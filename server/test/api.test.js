import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../app.js';
import { loadConfig } from '../config.js';

function boot(overrides = {}) {
  process.env.MOCK_AI = 'true';
  process.env.TOKEN_SECRET = 'x'.repeat(40);
  const cfg = { ...loadConfig(), ...overrides };
  const server = createApp(cfg).listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { method = 'GET', body, token, origin } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(origin ? { Origin: origin } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, headers: res.headers, json: await res.json().catch(() => null) };
  };
  return { cfg, server, call };
}

const problem = {
  slug: 'two-sum',
  number: '1',
  title: 'Two Sum',
  url: 'https://leetcode.com/problems/two-sum/',
  difficulty: 'Easy',
  tags: ['Array', 'Hash Table'],
  statement: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.\nExample 1:\nInput: nums = [2,7], target = 9\nOutput: [0,1]\nConstraints:\n2 <= nums.length <= 10^4',
  examples: [{ index: 1, input: 'nums = [2,7], target = 9', output: '[0,1]', explanation: '' }],
  constraints: ['2 <= nums.length <= 10^4'],
  schema: [],
  starterCode: 'class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { return {}; } };',
  editorCode: 'class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { return {}; } };',
  editorLanguageLabel: 'C++',
  editorLanguageKey: 'cpp',
  completeness: { hasStatement: true, exampleCount: 1, hasConstraints: true, hasSchema: false, missing: [], statementLength: 190 },
  selectedLanguage: 'auto',
  language: 'cpp',
  category: 'algorithms',
};

test('health works and does not leak secrets', async () => {
  const { server, call } = boot();
  const r = await call('/health');
  assert.equal(r.status, 200);
  assert.equal(r.json.ok, true);
  assert.ok(!JSON.stringify(r.json).includes('KEY'));
  server.close();
});

test('solve requires a token', async () => {
  const { server, call } = boot();
  const r = await call('/api/solve', { method: 'POST', body: { ...problem, operation: 'explain' } });
  assert.equal(r.status, 401);
  server.close();
});

test('session + solve works for all 10 operations', async () => {
  const { server, call } = boot({ perInstallPerMinute: 100, perInstallDailyLimit: 100 });
  const s = await call('/api/session', { method: 'POST', body: {} });
  assert.equal(s.status, 200);
  const ops = ['explain', 'hint', 'approach', 'solution', 'dryrun', 'complexity', 'edgecases', 'review', 'optimize', 'followup'];
  for (const operation of ops) {
    const body = { ...problem, operation, userCode: 'class Solution {};', question: 'Why a hash map?', hintLevel: 1 };
    const r = await call('/api/solve', { method: 'POST', token: s.json.token, body });
    assert.equal(r.status, 200, `${operation} failed: ${JSON.stringify(r.json)}`);
    assert.equal(r.json.ok, true);
    assert.ok(r.json.text.length > 0);
  }
  server.close();
});

test('rejects bad operation, bad language, missing code, long input', async () => {
  const { server, call } = boot({ perInstallPerMinute: 100 });
  const { json: s } = await call('/api/session', { method: 'POST', body: {} });
  const post = (body) => call('/api/solve', { method: 'POST', token: s.token, body });
  assert.equal((await post({ ...problem, operation: 'hack' })).status, 400);
  assert.equal((await post({ ...problem, operation: 'explain', selectedLanguage: 'cobol' })).status, 400);
  assert.equal((await post({ ...problem, operation: 'review', editorCode: '' })).status, 400);
  assert.equal((await post({ ...problem, operation: 'hint', hintLevel: 9 })).status, 400);
  assert.equal((await post({ ...problem, operation: 'explain', statement: 'a'.repeat(9000) })).status, 400);
  server.close();
});

test('daily quota blocks and reports remaining', async () => {
  const { server, call } = boot({ perInstallDailyLimit: 2, perInstallPerMinute: 100 });
  const { json: s } = await call('/api/session', { method: 'POST', body: {} });
  const post = () => call('/api/solve', { method: 'POST', token: s.token, body: { ...problem, operation: 'explain' } });
  assert.equal((await post()).status, 200);
  const second = await post();
  assert.equal(second.json.quota.remaining, 0);
  const third = await post();
  assert.equal(third.status, 429);
  assert.equal(third.json.error.code, 'INSTALL_LIMIT');
  server.close();
});

test('per-minute rate limit', async () => {
  const { server, call } = boot({ perInstallPerMinute: 2, perInstallDailyLimit: 50 });
  const { json: s } = await call('/api/session', { method: 'POST', body: {} });
  const post = () => call('/api/solve', { method: 'POST', token: s.token, body: { ...problem, operation: 'explain' } });
  await post(); await post();
  const r = await post();
  assert.equal(r.status, 429);
  assert.equal(r.json.error.code, 'RATE_LIMITED');
  server.close();
});

test('kill switch disables AI', async () => {
  const { server, call } = boot({ aiEnabled: false });
  const { json: s } = await call('/api/session', { method: 'POST', body: {} });
  const r = await call('/api/solve', { method: 'POST', token: s.token, body: { ...problem, operation: 'explain' } });
  assert.equal(r.status, 503);
  assert.equal(r.json.error.code, 'AI_DISABLED');
  server.close();
});

test('forged and tampered tokens are rejected', async () => {
  const { server, call } = boot();
  const { json: s } = await call('/api/session', { method: 'POST', body: {} });
  const tampered = s.token.slice(0, -2) + (s.token.endsWith('aa') ? 'bb' : 'aa');
  const r = await call('/api/solve', { method: 'POST', token: tampered, body: { ...problem, operation: 'explain' } });
  assert.equal(r.status, 401);
  server.close();
});

test('CORS: production requires the allowed extension id', async () => {
  const { server, call } = boot({ isProduction: true, allowedExtensionIds: ['abcdefghijklmnop'] });
  const ok = await call('/health', { origin: 'chrome-extension://abcdefghijklmnop' });
  const bad = await call('/health', { origin: 'chrome-extension://zzzz' });
  const web = await call('/health', { origin: 'https://evil.example' });
  assert.equal(ok.headers.get('access-control-allow-origin'), 'chrome-extension://abcdefghijklmnop');
  assert.equal(bad.headers.get('access-control-allow-origin'), null);
  assert.equal(web.headers.get('access-control-allow-origin'), null);
  server.close();
});

test('oversized body is rejected', async () => {
  const { server, call } = boot({ maxBodyBytes: 500 });
  const r = await call('/api/session', { method: 'POST', body: { installId: 'x'.repeat(2000) } });
  assert.equal(r.status, 413);
  server.close();
});
