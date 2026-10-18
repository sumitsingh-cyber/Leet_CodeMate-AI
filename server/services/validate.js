import { LANGUAGES, MAX_HINT_LEVEL, OPERATIONS } from './prompts.js';

const MAX_TITLE = 200;
const MAX_HISTORY_TURNS = 6;
const MAX_HISTORY_CHARS = 1500;

class ValidationError extends Error {}

const str = (v, name, max, { required = true } = {}) => {
  if (v === undefined || v === null || v === '') {
    if (required) throw new ValidationError(`${name} is required.`);
    return '';
  }
  if (typeof v !== 'string') throw new ValidationError(`${name} must be text.`);
  if (v.length > max) throw new ValidationError(`${name} is too long (max ${max} characters).`);
  return v;
};

/** Validates and normalises the /api/solve body. Throws ValidationError. */
export function validateSolveBody(body, cfg) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('Request body must be a JSON object.');

  const operation = body.operation;
  if (!OPERATIONS.includes(operation)) throw new ValidationError('Unsupported operation.');

  const language = body.language;
  if (!Object.hasOwn(LANGUAGES, language)) throw new ValidationError('Unsupported language.');

  const title = str(body.title, 'title', MAX_TITLE).trim();
  const description = str(body.description, 'description', cfg.maxDescriptionChars).trim();
  if (description.length < 20) throw new ValidationError('Problem description is too short.');

  const out = { operation, language, title, description, userCode: '', hintLevel: 1, question: '', history: [] };

  if (operation === 'review' || operation === 'optimize') {
    out.userCode = str(body.userCode, 'userCode', cfg.maxCodeChars).trim();
    if (!out.userCode) throw new ValidationError('No code was provided to analyse.');
  }

  if (operation === 'hint') {
    const level = Number(body.hintLevel ?? 1);
    if (!Number.isInteger(level) || level < 1 || level > MAX_HINT_LEVEL) {
      throw new ValidationError(`hintLevel must be 1 to ${MAX_HINT_LEVEL}.`);
    }
    out.hintLevel = level;
  }

  if (operation === 'followup') {
    out.question = str(body.question, 'question', cfg.maxQuestionChars).trim();
    if (!out.question) throw new ValidationError('Please type a question.');
    if (body.history !== undefined) {
      if (!Array.isArray(body.history)) throw new ValidationError('history must be a list.');
      const recent = body.history.slice(-MAX_HISTORY_TURNS);
      for (const turn of recent) {
        if (!turn || (turn.role !== 'user' && turn.role !== 'model') || typeof turn.text !== 'string') {
          throw new ValidationError('history contains an invalid entry.');
        }
        out.history.push({ role: turn.role, text: turn.text.slice(0, MAX_HISTORY_CHARS) });
      }
      // Gemini expects the conversation to start with a user turn and alternate.
      while (out.history.length && out.history[0].role !== 'user') out.history.shift();
    }
  }
  return out;
}

export { ValidationError };
