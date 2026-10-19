import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '@google/genai';
import { AiError, createAi } from '../services/gemini.js';

const input = {
  operation: 'approach',
  slug: 'two-sum',
  number: '1',
  title: 'Two Sum',
  url: 'https://leetcode.com/problems/two-sum/',
  difficulty: 'Easy',
  tags: ['Array', 'Hash Table'],
  statement: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target. Example 1: nums = [2,7], target = 9, output = [0,1].',
  examples: [{ index: 1, input: 'nums = [2,7], target = 9', output: '[0,1]', explanation: '' }],
  constraints: ['2 <= nums.length <= 10^4'],
  schema: [],
  starterCode: 'class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { return {}; } };',
  editorCode: 'class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { return {}; } };',
  editorLanguageLabel: 'C++',
  editorLanguageKey: 'cpp',
  category: 'algorithms',
  language: 'cpp',
  classification: { confidence: 0.99, reasons: ['starter-code signature'] },
  question: '',
  history: [],
};

function createTestAi(generateContent, overrides = {}) {
  const calls = [];
  const cfg = {
    mockAi: false,
    geminiApiKey: 'TEST_ONLY_API_KEY',
    geminiModel: 'test-model',
    maxOutputTokens: 2048,
    aiTimeoutMs: 100,
    verifyRetry: false,
    ...overrides,
  };
  const ai = createAi(cfg, {
    clientFactory: () => ({
      models: {
        generateContent: async (request) => {
          calls.push(request);
          return generateContent(request);
        },
      },
    }),
  });
  return { ai, calls, cfg };
}

async function captureInfo(run) {
  const lines = [];
  const original = console.info;
  console.info = (...args) => lines.push(args.join(' '));
  try {
    return { value: await run(), lines };
  } catch (error) {
    return { error, lines };
  } finally {
    console.info = original;
  }
}

test('successful generation logs request metadata without logging prompt content or credentials', async () => {
  const { ai, calls, cfg } = createTestAi(async () => ({ text: 'Use a hash map.', sdkHttpResponse: { status: 200 } }), { aiTimeoutMs: 25 });
  const { value, lines } = await captureInfo(() => ai.generate(input, { requestId: 'req-success' }));

  assert.equal(value.text, 'Use a hash map.');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].model, cfg.geminiModel);
  assert.equal(calls[0].config.abortSignal.aborted, false);
  await new Promise((resolve) => setTimeout(resolve, cfg.aiTimeoutMs + 10));
  assert.equal(calls[0].config.abortSignal.aborted, false, 'the deadline timer is cleared after success');
  assert.match(lines[0], /requestId=req-success/);
  assert.match(lines[0], /promptBytes=\d+/);
  assert.match(lines[0], /timeoutMs=25/);
  assert.match(lines[0], /elapsedMs=\d+/);
  assert.match(lines[0], /upstreamStatus=200/);
  assert.match(lines[0], /ownAbortTimerFired=false/);
  assert.ok(!lines.join('\n').includes(input.statement));
  assert.ok(!lines.join('\n').includes(cfg.geminiApiKey));
});

test('server deadline aborts the in-flight SDK request and is not retried', async () => {
  let upstreamSignal;
  const { ai, calls } = createTestAi(({ config }) => new Promise((_resolve, reject) => {
    upstreamSignal = config.abortSignal;
    config.abortSignal.addEventListener('abort', () => {
      reject(new DOMException('The request was aborted.', 'AbortError'));
    }, { once: true });
  }), { aiTimeoutMs: 15, verifyRetry: true });
  const solutionInput = { ...input, operation: 'solution' };
  const { error, lines } = await captureInfo(() => ai.generate(solutionInput, { requestId: 'req-timeout' }));

  assert.ok(error instanceof AiError);
  assert.equal(error.code, 'AI_TIMEOUT');
  assert.equal(error.httpStatus, 504);
  assert.equal(upstreamSignal.aborted, true);
  assert.equal(calls.length, 1, 'timeouts do not trigger verification retries');
  assert.match(lines[0], /requestId=req-timeout/);
  assert.match(lines[0], /ownAbortTimerFired=true/);
  assert.match(lines[0], /outcome=timeout/);
  assert.match(error.message, /context is preserved/i);
});

test('caller cancellation aborts the SDK request without being mislabeled as a server timeout', async () => {
  let started;
  let upstreamSignal;
  const requestStarted = new Promise((resolve) => { started = resolve; });
  const { ai } = createTestAi(({ config }) => new Promise((_resolve, reject) => {
    upstreamSignal = config.abortSignal;
    started();
    config.abortSignal.addEventListener('abort', () => {
      reject(new DOMException('The request was aborted.', 'AbortError'));
    }, { once: true });
  }), { aiTimeoutMs: 1000 });
  const caller = new AbortController();
  const pending = ai.generate(input, { requestId: 'req-cancelled', signal: caller.signal });
  await requestStarted;
  caller.abort();
  const { error, lines } = await captureInfo(() => pending);

  assert.ok(error instanceof AiError);
  assert.equal(error.code, 'REQUEST_CANCELLED');
  assert.equal(upstreamSignal.aborted, true);
  assert.match(lines[0], /ownAbortTimerFired=false/);
  assert.match(lines[0], /outcome=cancelled/);
});

test('upstream 429 and 503 errors preserve status diagnostics and map to useful server errors', async (t) => {
  for (const status of [429, 503]) {
    await t.test(`upstream ${status}`, async () => {
      const { ai } = createTestAi(async () => { throw new ApiError({ message: 'upstream error', status }); });
      const { error, lines } = await captureInfo(() => ai.generate(input, { requestId: `req-${status}` }));

      assert.ok(error instanceof AiError);
      assert.equal(error.httpStatus, 503);
      assert.equal(error.code, status === 429 ? 'AI_QUOTA' : 'AI_UNAVAILABLE');
      assert.match(lines[0], new RegExp(`upstreamStatus=${status}`));
      assert.match(lines[0], /ownAbortTimerFired=false/);
      assert.ok(!lines[0].includes('upstream error'));
    });
  }
});

test('malformed SDK responses return a retryable error and safe diagnostics', async () => {
  const { ai } = createTestAi(async () => ({ candidates: [] }));
  const { error, lines } = await captureInfo(() => ai.generate(input, { requestId: 'req-malformed' }));

  assert.ok(error instanceof AiError);
  assert.equal(error.code, 'AI_MALFORMED_RESPONSE');
  assert.equal(error.httpStatus, 502);
  assert.match(lines[0], /outcome=malformed_response/);
  assert.match(error.message, /context is preserved/i);
});
