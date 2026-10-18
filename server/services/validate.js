import { MAX_HINT_LEVEL, OPERATIONS, LANGUAGES } from './prompts.js';
import { CATEGORIES, classifyProblem } from './classify.js';

const MAX_TITLE = 200;
const MAX_HISTORY_TURNS = 6;
const MAX_HISTORY_CHARS = 1500;
const MAX_EXAMPLES = 30;
const MAX_CONSTRAINTS = 80;
const MAX_SCHEMA_TABLES = 30;
const MAX_COLUMNS = 80;

export class ValidationError extends Error {}

function stringValue(value, name, max, { required = true } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ValidationError(name + ' is required.');
    return '';
  }
  if (typeof value !== 'string') throw new ValidationError(name + ' must be text.');
  if (value.length > max) throw new ValidationError(name + ' is too long (max ' + max + ' characters).');
  return value.trim();
}

function stringList(value, name, maxItems, maxChars, { required = true } = {}) {
  if (value === undefined && !required) return [];
  if (!Array.isArray(value) || value.length > maxItems) throw new ValidationError(name + ' must be a list.');
  return value.map((item) => stringValue(item, name + ' item', maxChars));
}

function validateExamples(value, maxChars) {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_EXAMPLES) {
    throw new ValidationError('Complete examples are required before asking for help.');
  }
  return value.map((example, index) => {
    if (!example || typeof example !== 'object' || Array.isArray(example)) throw new ValidationError('An example is malformed.');
    const parsedIndex = Number(example.index);
    if (!Number.isInteger(parsedIndex) || parsedIndex < 1 || parsedIndex > MAX_EXAMPLES) throw new ValidationError('An example index is invalid.');
    const input = stringValue(example.input, 'example input', maxChars);
    const output = stringValue(example.output, 'example output', maxChars);
    const explanation = stringValue(example.explanation, 'example explanation', maxChars, { required: false });
    return { index: parsedIndex || index + 1, input, output, explanation };
  });
}

function validateSchema(value) {
  if (!Array.isArray(value) || value.length > MAX_SCHEMA_TABLES) throw new ValidationError('schema must be a list.');
  return value.map((table) => {
    if (!table || typeof table !== 'object' || Array.isArray(table)) throw new ValidationError('A schema table is malformed.');
    const name = stringValue(table.table, 'schema table name', 120);
    if (!Array.isArray(table.columns) || table.columns.length === 0 || table.columns.length > MAX_COLUMNS) {
      throw new ValidationError('Every schema table must include its columns.');
    }
    const columns = table.columns.map((column) => {
      if (!column || typeof column !== 'object' || Array.isArray(column)) throw new ValidationError('A schema column is malformed.');
      return {
        name: stringValue(column.name, 'schema column name', 120),
        type: stringValue(column.type, 'schema column type', 120, { required: false }),
      };
    });
    const notes = stringList(table.notes || [], 'schema notes', 30, 300, { required: false });
    return { table: name, columns, notes };
  });
}

function validateCompleteness(value, examples, statement, schema) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ValidationError('completeness is required.');
  const hasStatement = value.hasStatement === true && statement.length >= 60;
  const hasExamples = value.exampleCount === examples.length && examples.length > 0;
  const hasConstraints = value.hasConstraints === true;
  const hasSchema = value.hasSchema === true && schema.length > 0;
  const missing = Array.isArray(value.missing) ? value.missing.slice(0, 20).map(String) : [];
  if (!hasStatement) throw new ValidationError('The complete problem statement is missing. Refresh the LeetCode page.');
  if (!hasExamples) throw new ValidationError('The complete examples are missing. Refresh the LeetCode page.');
  return { hasStatement, exampleCount: examples.length, hasConstraints, hasSchema, missing };
}

/** Validates a complete, current-page /api/solve body. No fields are filled from prior requests. */
export function validateSolveBody(body, cfg) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('Request body must be a JSON object.');
  const operation = body.operation;
  if (!OPERATIONS.includes(operation)) throw new ValidationError('Unsupported operation.');

  const slug = stringValue(body.slug, 'slug', 180);
  if (!/^[a-z0-9-]+$/i.test(slug)) throw new ValidationError('slug is invalid.');
  const number = stringValue(body.number, 'number', 20, { required: false });
  const title = stringValue(body.title, 'title', MAX_TITLE);
  const url = stringValue(body.url, 'url', 500);
  if (!/^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/?$/i.test(url)) throw new ValidationError('url must identify a visible LeetCode problem.');
  const difficulty = stringValue(body.difficulty, 'difficulty', 20, { required: false });
  if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) throw new ValidationError('difficulty is invalid.');
  const tags = stringList(body.tags, 'tags', 30, 80);

  const statement = stringValue(body.statement, 'statement', cfg.maxDescriptionChars);
  const examples = validateExamples(body.examples, cfg.maxDescriptionChars);
  const constraints = stringList(body.constraints, 'constraints', MAX_CONSTRAINTS, 500);
  const schema = validateSchema(body.schema);
  for (const field of ['starterCode', 'editorCode', 'editorLanguageLabel', 'editorLanguageKey']) { if (!Object.hasOwn(body, field)) throw new ValidationError(field + ' is required.'); }
  const starterCode = stringValue(body.starterCode, 'starterCode', cfg.maxCodeChars, { required: false });
  const editorCode = stringValue(body.editorCode, 'editorCode', cfg.maxCodeChars, { required: false });
  const editorLanguageLabel = stringValue(body.editorLanguageLabel, 'editorLanguageLabel', 80, { required: false });
  const editorLanguageKey = stringValue(body.editorLanguageKey, 'editorLanguageKey', 30, { required: false });
  const completeness = validateCompleteness(body.completeness, examples, statement, schema);

  const requestedLanguage = stringValue(body.selectedLanguage || body.language, 'language', 30);
  if (requestedLanguage !== 'auto' && !Object.hasOwn(LANGUAGES, requestedLanguage)) {
    throw new ValidationError('Unsupported language.');
  }
  const suppliedCategory = stringValue(body.category, 'category', 30);
  if (!CATEGORIES.includes(suppliedCategory)) throw new ValidationError('Unsupported problem category.');

  const classification = classifyProblem({
    statement,
    schema,
    editorLanguageLabel,
    editorLanguageKey,
    tags,
    starterCode,
    editorCode,
    selectedLanguage: requestedLanguage,
  });
  if (classification.category === 'sql' && schema.length === 0) {
    throw new ValidationError('The database schema is missing. Refresh the visible LeetCode problem before asking.');
  }

  const input = {
    operation,
    slug,
    number,
    title,
    url,
    difficulty,
    tags,
    statement,
    examples,
    constraints,
    schema,
    starterCode,
    editorCode,
    editorLanguageLabel,
    editorLanguageKey,
    completeness,
    selectedLanguage: requestedLanguage,
    category: classification.category,
    language: classification.language,
    classification,
    userCode: editorCode,
    hintLevel: 1,
    question: '',
    history: [],
  };

  if ((operation === 'review' || operation === 'optimize') && !editorCode) {
    throw new ValidationError('No code was provided to analyse.');
  }
  if (operation === 'hint') {
    const level = Number(body.hintLevel ?? 1);
    if (!Number.isInteger(level) || level < 1 || level > MAX_HINT_LEVEL) {
      throw new ValidationError('hintLevel must be 1 to ' + MAX_HINT_LEVEL + '.');
    }
    input.hintLevel = level;
  }
  if (operation === 'followup') {
    input.question = stringValue(body.question, 'question', cfg.maxQuestionChars);
    if (!input.question) throw new ValidationError('Please type a question.');
    if (body.history !== undefined) {
      if (!Array.isArray(body.history)) throw new ValidationError('history must be a list.');
      const recent = body.history.slice(-MAX_HISTORY_TURNS);
      for (const turn of recent) {
        if (!turn || (turn.role !== 'user' && turn.role !== 'model') || typeof turn.text !== 'string') {
          throw new ValidationError('history contains an invalid entry.');
        }
        input.history.push({ role: turn.role, text: turn.text.slice(0, MAX_HISTORY_CHARS) });
      }
      while (input.history.length && input.history[0].role !== 'user') input.history.shift();
    }
  }
  return input;
}
