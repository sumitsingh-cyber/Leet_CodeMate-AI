import test from 'node:test';
import assert from 'node:assert/strict';
import { createAi, AiError, validateGeneratedCode, verifyStructuredAnswer } from '../services/gemini.js';
import { loadConfig } from '../config.js';
import { createApp } from '../app.js';
import { UsageTracker } from '../services/usage.js';

const input = {
  operation: 'solution',
  slug: 'two-sum',
  number: '1',
  title: 'Two Sum',
  url: 'https://leetcode.com/problems/two-sum/',
  difficulty: 'Easy',
  tags: ['Array'],
  statement: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
  examples: [{ index: 1, input: 'nums = [2,7], target = 9', output: '[0,1]', explanation: '' }],
  constraints: ['2 <= nums.length <= 10^4'],
  schema: [],
  starterCode: 'class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { return {}; } };',
  editorCode: '',
  editorLanguageLabel: 'C++',
  editorLanguageKey: 'cpp',
  completeness: { hasStatement: true, exampleCount: 1, hasConstraints: true, hasSchema: false, missing: [] },
  selectedLanguage: 'auto',
  language: 'cpp',
  category: 'algorithms',
};
const good = {
  statementEvidence: ['return indices of the two numbers that add up to target'],
  requirements: ['Return the indices of two values whose sum is the target.'],
  exampleChecks: [{ example: 1, expected: '[0,1]', got: '[0,1]', match: true }],
  code: 'class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { return {0, 1}; } };',
};

test('verifies evidence, every example, output agreement, and starter signature', () => {
  assert.equal(verifyStructuredAnswer(input, good).ok, true);
});

test('rejects missing or mismatched example checks and unsupported evidence', () => {
  assert.match(verifyStructuredAnswer(input, { ...good, exampleChecks: [] }).reason, /Example 1/);
  assert.match(verifyStructuredAnswer(input, { ...good, statementEvidence: ['invented requirement'] }).reason, /evidence/);
  assert.match(verifyStructuredAnswer(input, { ...good, exampleChecks: [{ ...good.exampleChecks[0], match: false }] }).reason, /did not match/);
  assert.match(verifyStructuredAnswer(input, { ...good, exampleChecks: [{ ...good.exampleChecks[0], got: '[1,0]', match: true }] }).reason, /hand-traced output/);
});

test('rejects a SQL-only result for an algorithms problem', () => {
  assert.equal(validateGeneratedCode(input, { ...good, code: 'SELECT * FROM Scores' }).ok, false);
});

test('requires SQL output to reference a supplied table', () => {
  const sqlInput = { ...input, category: 'sql', language: 'mysql', schema: [{ table: 'Scores', columns: [{ name: 'score', type: 'int' }] }] };
  assert.equal(validateGeneratedCode(sqlInput, { code: 'SELECT score FROM Scores' }).ok, true);
  assert.equal(validateGeneratedCode(sqlInput, { code: 'SELECT score FROM OtherScores' }).ok, false);
});

test('uses official structured JSON config and retries a failed verification once with feedback', async () => {
  const calls = [];
  const ai = createAi({ mockAi: false, geminiApiKey: 'unit-test-key', geminiModel: 'unit-test-model', maxOutputTokens: 500, aiTimeoutMs: 1000, verifyRetry: true }, {
    clientFactory: () => ({ models: { generateContent: async (request) => {
      calls.push(request);
      const answer = calls.length === 1 ? { ...good, statementEvidence: ['not in current statement'] } : good;
      return { text: JSON.stringify(answer) };
    } } }),
  });
  const result = await ai.generate(input);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].config.responseMimeType, 'application/json');
  assert.ok(calls[0].config.responseJsonSchema);
  assert.match(calls[1].contents.at(-1).parts[0].text, /failed server verification/);
  assert.equal(result.text, good.code);
  assert.equal(result.verifiedExamples, 1);
});

test('returns an answer-not-verified error when retry is disabled', async () => {
  const ai = createAi({ mockAi: false, geminiApiKey: 'unit-test-key', geminiModel: 'unit-test-model', maxOutputTokens: 500, aiTimeoutMs: 1000, verifyRetry: false }, {
    clientFactory: () => ({ models: { generateContent: async () => ({ text: JSON.stringify({ ...good, exampleChecks: [] }) }) } }),
  });
  await assert.rejects(() => ai.generate(input), (error) => error instanceof AiError && error.code === 'ANSWER_NOT_VERIFIED');
});

test('failed answer verification refunds the reserved request quota', async () => {
  process.env.MOCK_AI = 'true';
  process.env.TOKEN_SECRET = 'z'.repeat(40);
  const cfg = { ...loadConfig(), perInstallPerMinute: 100, perInstallDailyLimit: 4 };
  const usage = new UsageTracker(cfg);
  const app = createApp(cfg, { usage, ai: { generate: async () => { throw new AiError('ANSWER_NOT_VERIFIED', 'Could not verify answer.', 422); } } });
  const server = app.listen(0);
  try {
    const origin = 'http://127.0.0.1:' + server.address().port;
    const session = await fetch(origin + '/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then((r) => r.json());
    const response = await fetch(origin + '/api/solve', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.token }, body: JSON.stringify({ ...input, operation: 'solution' }) });
    const body = await response.json();
    assert.equal(response.status, 422);
    assert.equal(body.error.code, 'ANSWER_NOT_VERIFIED');
    assert.equal(body.quota.remaining, 4);
    assert.equal(body.quota.used, 0);
  } finally {
    server.close();
    server.closeAllConnections?.();
    usage.sweeper && clearInterval(usage.sweeper);
  }
});