import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyProblem } from '../services/classify.js';

test('auto classifies an algorithm problem from its visible C++ editor', () => {
  const result = classifyProblem({ statement: 'Return indices for the two numbers.', editorLanguageLabel: 'C++', editorLanguageKey: 'cpp', selectedLanguage: 'auto' });
  assert.equal(result.category, 'algorithms');
  assert.equal(result.language, 'cpp');
  assert.ok(result.confidence >= 0.9);
});

test('visible SQL schema chooses MySQL when no dialect is visible', () => {
  const result = classifyProblem({ statement: 'Find the employee rows.', schema: [{ table: 'Scores', columns: [{ name: 'score', type: 'int' }] }], selectedLanguage: 'auto' });
  assert.equal(result.category, 'sql');
  assert.equal(result.language, 'mysql');
  assert.ok(result.reasons.some((reason) => reason.includes('MySQL')));
});

test('visible SQL editor dialect wins a conflicting algorithm selection', () => {
  const result = classifyProblem({ statement: 'Return a database query.', editorLanguageLabel: 'MySQL', editorLanguageKey: 'mysql', selectedLanguage: 'cpp' });
  assert.equal(result.category, 'sql');
  assert.equal(result.language, 'mysql');
  assert.ok(result.confidence < 0.7);
});

test('Pandas starter code and statement classify as Pandas', () => {
  const result = classifyProblem({ statement: 'Return a DataFrame with the requested columns.', starterCode: 'def find_products(products: pd.DataFrame) -> pd.DataFrame:', editorLanguageKey: 'python', selectedLanguage: 'auto' });
  assert.equal(result.category, 'pandas');
  assert.equal(result.language, 'pandas');
});

test('shell starter code classifies as Bash', () => {
  const result = classifyProblem({ statement: 'Print the required lines.', starterCode: '#!/bin/bash\ngrep value input.txt', selectedLanguage: 'auto' });
  assert.equal(result.category, 'shell');
  assert.equal(result.language, 'bash');
});

test('weak evidence is marked low confidence', () => {
  const result = classifyProblem({ statement: 'Solve the problem.', selectedLanguage: 'auto' });
  assert.ok(result.confidence < 0.7);
  assert.ok(result.reasons.length > 0);
});