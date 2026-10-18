import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXT = path.join(ROOT, 'extension');
const SRV = path.join(ROOT, 'server');
process.env.MOCK_AI = 'true';
process.env.TOKEN_SECRET = 'y'.repeat(40);
const { loadConfig } = await import(pathToFileURL(path.join(SRV, 'config.js')));
const { createApp } = await import(pathToFileURL(path.join(SRV, 'app.js')));

const results = [];
const check = (name, fn) => { try { fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name + ' -> ' + e.message]); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const addInnerText = (win) => Object.defineProperty(win.HTMLElement.prototype, 'innerText', { get() { return this.textContent; }, configurable: true });

// ---------- 1. Markdown safety ----------
{
  const { render } = (await import('node:module')).createRequire(import.meta.url)(path.join(EXT, 'markdown.js'));
  const html = render('<script>alert(1)</script> **bold** `<img onerror=x>`\n\n```cpp\n<b>x</b> && y\n```\n\n| a | b |\n|---|---|\n| 1 | <i>2</i> |\n\n[link](javascript:alert(1)) ![i](x)');
  check('markdown: no raw script/img/i tags', () => { assert.ok(!/<script|<img|<i>|<b>x/.test(html)); });
  check('markdown: code, table, bold rendered', () => { assert.ok(html.includes('class="copy-code"') && html.includes('<table>') && html.includes('<strong>bold</strong>')); });
  check('markdown: no anchors emitted', () => { assert.ok(!html.includes('<a ')); });
}

// ---------- 2. content.js on a fake LeetCode page ----------
{
  const dom = new JSDOM(`<!doctype html><title>4Sum - LeetCode</title><body>
    <div class="text-title-large"><a href="/problems/4sum/">18. 4Sum</a></div>
    <div data-track-load="description_content"><p>Given an array nums of n integers, return an array of all the unique quadruplets such that they sum to target.</p><p><strong>Example 1:</strong></p><pre>Input: nums = [1,0,-1,0,-2,2], target = 0</pre><p>Constraints: 1 &lt;= nums.length &lt;= 200</p></div>
    <div class="monaco-editor"><div class="view-lines"><div class="view-line" style="top:0px">class Solution {</div></div></div></body>`,
    { url: 'https://leetcode.com/problems/4sum/description/', runScripts: 'dangerously' });
  const win = dom.window; addInnerText(win);
  const listeners = [];
  win.chrome = { runtime: { onMessage: { addListener: (f) => listeners.push(f) }, sendMessage: () => Promise.resolve() } };
  win.monaco = { editor: { getModels: () => [
    { getLanguageId: () => 'plaintext', getValue: () => '[1,0,-1]\n0' },
    { getLanguageId: () => 'cpp', getValue: () => 'class Solution {\npublic:\n  vector<vector<int>> fourSum(vector<int>& nums, int target) { return {}; }\n};' },
  ] } };
  win.postMessage = (data) => setTimeout(() => win.dispatchEvent(new win.MessageEvent('message', { data, source: win })), 0); // Chrome sets source === window
  for (const f of ['page-bridge.js', 'content.js']) { const s = win.document.createElement('script'); s.textContent = fs.readFileSync(path.join(EXT, f), 'utf8'); win.document.body.appendChild(s); }
  const res = await new Promise((resolve) => listeners[0]({ type: 'GET_PROBLEM' }, {}, resolve));
  check('content: problem detected', () => assert.equal(res.ok, true));
  check('content: title + number', () => { assert.equal(res.problem.title, '4Sum'); assert.equal(res.problem.number, '18'); });
  check('content: description has examples + constraints', () => { assert.ok(res.problem.description.includes('Example 1') && res.problem.description.includes('Constraints')); });
  check('content: code from Monaco model (skips plaintext editor)', () => { assert.ok(res.problem.code.includes('fourSum') && !res.problem.code.includes('[1,0,-1]')); });
  check('content: slug', () => assert.equal(res.problem.slug, '4sum'));

  // Fallback strategies: no data-track attribute, DOM-only code
  const dom2 = new JSDOM(`<!doctype html><title>Two Sum - LeetCode</title><body><div><div><h4>Two Sum</h4><div>Given an array of integers nums and an integer target, return indices of the two numbers.<br>Example 1: Input nums = [2,7] Output [0,1]</div></div></div></body>`, { url: 'https://leetcode.com/problems/two-sum/', runScripts: 'dangerously' });
  addInnerText(dom2.window);
  const l2 = []; dom2.window.chrome = { runtime: { onMessage: { addListener: (f) => l2.push(f) }, sendMessage: () => Promise.resolve() } };
  const s = dom2.window.document.createElement('script'); s.textContent = fs.readFileSync(path.join(EXT, 'content.js'), 'utf8'); dom2.window.document.body.appendChild(s);
  const r2 = await new Promise((resolve) => l2[0]({ type: 'GET_PROBLEM' }, {}, resolve));
  check('content: fallback strategies find title (from document.title) and text', () => { assert.equal(r2.ok, true); assert.equal(r2.problem.title, 'Two Sum'); });

  const dom3 = new JSDOM('<!doctype html><title>LeetCode</title><body></body>', { url: 'https://leetcode.com/problemset/', runScripts: 'dangerously' });
  const l3 = []; dom3.window.chrome = { runtime: { onMessage: { addListener: (f) => l3.push(f) }, sendMessage: () => Promise.resolve() } };
  const s3 = dom3.window.document.createElement('script'); s3.textContent = fs.readFileSync(path.join(EXT, 'content.js'), 'utf8'); dom3.window.document.body.appendChild(s3);
  const r3 = await new Promise((resolve) => l3[0]({ type: 'GET_PROBLEM' }, {}, resolve));
  check('content: non-problem page -> NOT_PROBLEM', () => assert.equal(r3.reason, 'NOT_PROBLEM'));
}

// ---------- 3. Side panel against the real backend (mock AI) ----------
{
  let solveCalls = 0;
  const cfg = { ...loadConfig(), perInstallPerMinute: 100, perInstallDailyLimit: 100 };
  const app = createApp(cfg);
  const server = app.listen(0);
  const port = server.address().port;

  const html = fs.readFileSync(path.join(EXT, 'sidepanel.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'chrome-extension://testid/sidepanel.html', runScripts: 'dangerously', pretendToBeVisual: true });
  const win = dom.window;
  win.fetch = (url, opts) => {  if (String(url).endsWith('/api/solve')) solveCalls++; return fetch(url, opts); };
  win.AbortController = AbortController;
  const store = {};
  const problem = { slug: '4sum', number: '18', title: '4Sum', description: 'Given an array nums of n integers, return all unique quadruplets that sum to target. Example 1 ...', code: 'class Solution { public: vector<vector<int>> fourSum(vector<int>& n, int t){} };' };
  let currentResponse = { ok: true, problem };
  win.chrome = {
    tabs: { query: async () => [{ id: 1, url: 'https://leetcode.com/problems/4sum/' }], sendMessage: async () => currentResponse, onActivated: { addListener() {} }, onUpdated: { addListener() {} } },
    runtime: { onMessage: { addListener() {} } },
    storage: { local: { get: async (keys) => Object.fromEntries(keys.filter((k) => k in store).map((k) => [k, store[k]])), set: async (o) => Object.assign(store, o) } },
  };
  let copied = null;
  Object.defineProperty(win.navigator, 'clipboard', { value: { writeText: async (t) => { copied = t; } }, configurable: true });
  for (const f of ['config.js', 'markdown.js', 'api.js', 'sidepanel.js']) {
    let src = fs.readFileSync(path.join(EXT, f), 'utf8');
    if (f === 'config.js') src = src.replaceAll('http://localhost:3000', `http://127.0.0.1:${port}`);
    const s = win.document.createElement('script'); s.textContent = src; win.document.body.appendChild(s);
  }
  const $ = (sel) => win.document.querySelector(sel);
  const waitFor = async (fn, ms = 4000) => { const t = Date.now(); while (Date.now() - t < ms) { if (fn()) return true; await sleep(30); } return false; };
  const click = (op) => $(`.sec-btn[data-op="${op}"]`).click();

  await waitFor(() => $('#problemTitle').textContent.includes('4Sum'));
  check('panel: shows problem title and "Problem detected"', () => { assert.equal($('#problemTitle').textContent, '18. 4Sum'); assert.ok($('#problemStatus').textContent.includes('Problem detected')); });
  check('panel: 10 section buttons, enabled', () => { const b = [...win.document.querySelectorAll('.sec-btn')]; assert.equal(b.length, 10); assert.ok(b.every((x) => !x.disabled)); });
  check('panel: no API call before any click', () => assert.equal(solveCalls, 0));

  for (const op of ['explain', 'approach', 'solution', 'dryrun', 'complexity', 'edgecases', 'review', 'optimize']) {
    const before = solveCalls;
    click(op);
    await waitFor(() => !win.document.querySelector('.spinner') && $('#resultBody').textContent.includes('Mock answer'));
    check(`panel: ${op} renders result with 1 API call`, () => { assert.equal(solveCalls, before + 1); assert.ok($('#resultBody').textContent.includes(`(${op})`)); assert.equal($('#resultTitle').textContent.length > 0, true); });
  }
  const callsAfterAll = solveCalls;
  click('explain'); await sleep(100);
  check('panel: clicking a cached section makes NO new API call', () => assert.equal(solveCalls, callsAfterAll));
  check('panel: footer shows remaining quota', () => assert.match($('#quota').textContent, /free requests left today/));

  click('solution'); await sleep(100);
  check('panel: code block has own Copy button copying only code', () => { assert.ok($('.copy-code')); });
  $('.copy-code').click(); await sleep(50);
  check('panel: code copy contains only code', () => assert.equal(copied, 'class Solution {};'));
  $('#copyBtn').click(); await sleep(50);
  check('panel: whole-result copy works', () => assert.ok(copied.includes('Mock answer')));

  // language switch -> new cache key -> new call
  const beforeLang = solveCalls;
  $('#lang').value = 'python'; $('#lang').dispatchEvent(new win.Event('change'));
  await sleep(50);
  check('panel: language change persists default', () => assert.equal(store.language, 'python'));
  check('panel: language change does not auto-call API', () => assert.equal(solveCalls, beforeLang));
  click('solution'); await waitFor(() => solveCalls === beforeLang + 1 && !win.document.querySelector('.spinner'));
  check('panel: new language triggers one new call', () => assert.equal(solveCalls, beforeLang + 1));

  // progressive hints
  for (let level = 1; level <= 4; level++) {
    if (level === 1) click('hint'); else $('#nextHint').click();
    await waitFor(() => !win.document.querySelector('.spinner') && win.document.querySelectorAll('#resultBody h3').length >= level);
  }
  check('panel: 4 progressive hints accumulated, then no more button', () => { assert.equal($('#nextHint'), null); assert.ok($('#resultExtra').textContent.includes('last hint')); });

  // follow-up
  click('followup'); await sleep(50);
  $('#askInput').value = 'Why sort first?'; $('#askBtn').click();
  await waitFor(() => $('.chat-q') && !win.document.querySelector('.spinner'));
  check('panel: follow-up shows question and answer', () => { assert.equal($('.chat-q').textContent, 'Why sort first?'); assert.ok($('.chat-a').textContent.includes('Mock answer')); });

  // clear removes cache -> next click calls API again
  click('explain'); await sleep(50); $('#clearBtn').click(); await sleep(30);
  check('panel: clear empties the result', () => assert.ok($('#resultBody').textContent.includes('Nothing generated yet')));

  // review with no code -> message, no API call
  currentResponse = { ok: true, problem: { ...problem, code: '' } };
  const beforeNoCode = solveCalls;
  click('review'); await waitFor(() => $('.error'));
  check('panel: review without editor code shows message and makes no API call', () => { assert.ok($('.error').textContent.includes('No code was found')); assert.equal(solveCalls, beforeNoCode); });

  // non-problem page
  currentResponse = { ok: false, reason: 'NOT_PROBLEM' };
  $('#refreshBtn').click(); await waitFor(() => $('#problemTitle').textContent.includes('Open a LeetCode'));
  check('panel: non-problem page disables buttons and explains', () => { assert.ok([...win.document.querySelectorAll('.sec-btn')].every((b) => b.disabled)); assert.ok($('#problemStatus').textContent.includes('leetcode.com/problems')); });

  // server down -> friendly error + retry
  server.close(); server.closeAllConnections?.();
  currentResponse = { ok: true, problem };
  $('#refreshBtn').click(); await waitFor(() => $('#problemTitle').textContent.includes('4Sum'));
  click('complexity'); await waitFor(() => $('.error'));
  check('panel: server down shows friendly error with Try again', () => { assert.ok($('.error').textContent.includes('Cannot reach')); assert.ok(win.document.querySelector('#resultExtra .btn')); });
  win.close();
}

for (const [s, n] of results) console.log(s, n);
console.log(`\n${results.filter((r) => r[0] === 'PASS').length}/${results.length} passed`);
process.exit(results.some((r) => r[0] === 'FAIL') ? 1 : 0);
