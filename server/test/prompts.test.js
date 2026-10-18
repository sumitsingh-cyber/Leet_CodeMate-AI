import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRequest, OPERATIONS } from '../services/prompts.js';

const base = {
  title: 'Two Sum',
  description: 'Given an array of integers nums and an integer target, return indices.',
  language: 'cpp',
  userCode: 'class Solution {};',
  question: 'Why a hash map?',
  hintLevel: 2,
  history: [{ role: 'user', text: 'hi' }, { role: 'model', text: 'hello' }],
};

test('every operation builds a valid Gemini request', () => {
  for (const operation of OPERATIONS) {
    const { systemInstruction, contents } = buildRequest({ ...base, operation });
    assert.ok(systemInstruction.length > 50);
    assert.equal(contents.at(-1).role, 'user');
    assert.ok(contents.at(-1).parts[0].text.includes('Two Sum'));
  }
});

test('hint prompt contains only the requested level', () => {
  const { contents } = buildRequest({ ...base, operation: 'hint', hintLevel: 1 });
  const text = contents[0].parts[0].text;
  assert.ok(text.includes('Level 1'));
  assert.ok(!text.includes('Level 3'));
});

test('without a key and not in mock mode, AI returns a clear config error', async () => {
  const { createAi } = await import('../services/gemini.js');
  const ai = createAi({ mockAi: false, geminiApiKey: '', geminiModel: '', maxOutputTokens: 100, aiTimeoutMs: 1000 });
  await assert.rejects(() => ai.generate({ ...base, operation: 'explain' }), (e) => e.code === 'SERVER_MISCONFIGURED');
});
