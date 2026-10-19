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
const { AiError, createAi } = await import(pathToFileURL(path.join(SRV, 'services', 'gemini.js')));

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
    <div data-track-load="description_content"><pre>Given an array nums of n integers, return an array of all the unique quadruplets such that they sum to target.

Example 1:
Input: nums = [1,0,-1,0,-2,2], target = 0
Output: [[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]

Constraints:
1 &lt;= nums.length &lt;= 200</pre></div>
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
  const res = await new Promise((resolve) => listeners[0]({ type: 'GET_PROBLEM', requestId: 'fixture-1' }, {}, resolve));
  check('content: problem detected', () => assert.equal(res.ok, true));
  check('content: title + number', () => { assert.equal(res.problem.title, '4Sum'); assert.equal(res.problem.number, '18'); });
  check('content: description has examples + constraints', () => { assert.ok(res.problem.statement.includes('Example 1') && res.problem.statement.includes('Constraints')); });
  check('content: code from Monaco model (skips plaintext editor)', () => { assert.ok(res.problem.editorCode.includes('fourSum') && !res.problem.editorCode.includes('[1,0,-1]')); });
  check('content: slug', () => assert.equal(res.problem.slug, '4sum'));

  // Fallback strategies: no data-track attribute, DOM-only code
  const dom2 = new JSDOM('<!doctype html><title>Two Sum - LeetCode</title><body><main><div><div><h4>Two Sum</h4><div>Given an array of integers nums and an integer target, return indices of the two numbers.<pre>Example 1:\nInput: nums = [2,7], target = 9\nOutput: [0,1]</pre></div></div></div></main></body>', { url: 'https://leetcode.com/problems/two-sum/', runScripts: 'dangerously' });
  addInnerText(dom2.window);
  const l2 = []; dom2.window.chrome = { runtime: { onMessage: { addListener: (f) => l2.push(f) }, sendMessage: () => Promise.resolve() } };
  const s = dom2.window.document.createElement('script'); s.textContent = fs.readFileSync(path.join(EXT, 'content.js'), 'utf8'); dom2.window.document.body.appendChild(s);
  const r2 = await new Promise((resolve) => l2[0]({ type: 'GET_PROBLEM', requestId: 'fixture-2' }, {}, resolve));
  check('content: fallback strategies find title (from document.title) and text', () => { assert.equal(r2.ok, true); assert.equal(r2.problem.title, 'Two Sum'); });

  const dom3 = new JSDOM('<!doctype html><title>LeetCode</title><body></body>', { url: 'https://leetcode.com/problemset/', runScripts: 'dangerously' });
  const l3 = []; dom3.window.chrome = { runtime: { onMessage: { addListener: (f) => l3.push(f) }, sendMessage: () => Promise.resolve() } };
  const s3 = dom3.window.document.createElement('script'); s3.textContent = fs.readFileSync(path.join(EXT, 'content.js'), 'utf8'); dom3.window.document.body.appendChild(s3);
  const r3 = await new Promise((resolve) => l3[0]({ type: 'GET_PROBLEM', requestId: 'fixture-3' }, {}, resolve));
  check('content: non-problem page -> NOT_PROBLEM', () => assert.equal(r3.reason, 'NOT_PROBLEM'));
}

// ---------- 3. Side panel against the real backend (mock AI) ----------
{
  let solveCalls = 0;
  let timeoutNextSolve = false;
  const cfg = { ...loadConfig(), perInstallPerMinute: 100, perInstallDailyLimit: 100 };
  const mockAi = createAi(cfg);
  const ai = {
    generate(input, options) {
      if (timeoutNextSolve) {
        timeoutNextSolve = false;
        throw new AiError('AI_TIMEOUT', 'The AI response exceeded the server deadline. Your current problem context is preserved; use Try again to retry.', 504);
      }
      return mockAi.generate(input, options);
    },
  };
  const app = createApp(cfg, { ai });
  const server = app.listen(0);
  const port = server.address().port;

  const html = fs.readFileSync(path.join(EXT, 'sidepanel.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'chrome-extension://testid/sidepanel.html', runScripts: 'dangerously', pretendToBeVisual: true });
  const win = dom.window;
  win.fetch = async (url, opts) => { const isSolve = String(url).endsWith('/api/solve'); if (isSolve) { solveCalls++; lastSolveBody = JSON.parse(opts.body); } const response = await fetch(url, opts); if (isSolve && holdNextSolve) { holdNextSolve = false; await new Promise((resolve) => { releaseHeld = resolve; }); } return response; };
  win.AbortController = AbortController;
  const store = {};
  let holdNextSolve = false;
  let releaseHeld = null;
  let lastSolveBody = null;
  let activeUrl = 'https://leetcode.com/problems/4sum/';
  const statement = 'Given an array nums of n integers, return all unique quadruplets that sum to target. Example 1: Input: nums = [1,0,-1,0,-2,2], target = 0 Output: [[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]] Constraints: 1 <= nums.length <= 200';
  const starterCode = 'class Solution { public: vector<vector<int>> fourSum(vector<int>& nums, int target) { return {}; } };';
  const problem = { slug: '4sum', number: '18', title: '4Sum', url: 'https://leetcode.com/problems/4sum/', difficulty: 'Medium', tags: ['Array'], statement, examples: [{ index: 1, input: 'nums = [1,0,-1,0,-2,2], target = 0', output: '[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]', explanation: '' }], constraints: ['1 <= nums.length <= 200'], schema: [], starterCode, editorCode: starterCode, editorLanguageLabel: 'C++', editorLanguageKey: 'cpp', completeness: { hasStatement: true, exampleCount: 1, hasConstraints: true, hasSchema: false, missing: [], statementLength: statement.length } };
  let currentResponse = { ok: true, problem }; activeUrl = 'https://leetcode.com/problems/4sum/';
  win.chrome = {
    tabs: { query: async () => [{ id: 1, url: activeUrl }], sendMessage: async (_tabId, message) => ({ ...currentResponse, requestId: message.requestId }), onActivated: { addListener() {} }, onUpdated: { addListener() {} } },
    runtime: { onMessage: { addListener() {} } },
    storage: { local: { get: async (keys) => Object.fromEntries(keys.filter((k) => k in store).map((k) => [k, store[k]])), set: async (o) => Object.assign(store, o) } },
  };
  let copied = null;
  Object.defineProperty(win.navigator, 'clipboard', { value: { writeText: async (t) => { copied = t; } }, configurable: true });
  for (const f of ['config.js', 'markdown.js', 'api.js', 'classify.js', 'sidepanel.js']) {
    let src = fs.readFileSync(path.join(EXT, f), 'utf8');
    if (f === 'config.js') src = src.replaceAll('https://codemate-ai-server.onrender.com', 'http://127.0.0.1:' + port);
    const s = win.document.createElement('script'); s.textContent = src; win.document.body.appendChild(s);
  }
  const $ = (sel) => win.document.querySelector(sel);
  const waitFor = async (fn, ms = 4000) => { const t = Date.now(); while (Date.now() - t < ms) { if (fn()) return true; await sleep(30); } return false; };
  const click = (op) => $(`.sec-btn[data-op="${op}"]`).click();

  await waitFor(() => $('#problemTitle').textContent.includes('4Sum'));
  check('panel: shows problem title and "Problem detected"', () => { assert.equal($('#problemTitle').textContent, '18. 4Sum'); assert.ok($('#problemStatus').textContent.includes('Problem detected')); });
  check('panel: 10 section buttons, enabled', () => { const b = [...win.document.querySelectorAll('.sec-btn')]; assert.equal(b.length, 10); assert.ok(b.every((x) => !x.disabled)); });
  check('panel: no API call before any click', () => assert.equal(solveCalls, 0));
  const pandasStatement = 'Return a DataFrame containing each product with its computed price. Example 1: Input: products Output: result Constraints: 1 <= products.length <= 100';
  const pandasCode = 'import pandas as pd\n\ndef compute_price(products: pd.DataFrame) -> pd.DataFrame:';
  const pandasProblem = { slug: 'products-price', number: '2877', title: 'Create a DataFrame from List', url: 'https://leetcode.com/problems/products-price/', difficulty: 'Easy', tags: ['Pandas'], statement: pandasStatement, examples: [{ index: 1, input: 'products', output: 'result', explanation: '' }], constraints: ['1 <= products.length <= 100'], schema: [], starterCode: pandasCode, editorCode: pandasCode, editorLanguageLabel: 'Python', editorLanguageKey: 'python', completeness: { hasStatement: true, exampleCount: 1, hasConstraints: true, hasSchema: false, missing: [], statementLength: pandasStatement.length } };
  currentResponse = { ok: true, problem: pandasProblem }; activeUrl = pandasProblem.url; $('#refreshBtn').click(); await waitFor(() => $('#problemTitle').textContent.includes('Create a DataFrame'));
  check('panel: Auto recognizes Pandas from visible starter and statement', () => assert.ok($('#contextPreview').textContent.includes('pandas')));
  const sqlStatement = 'Write a query to find the rank of each score. Example 1: Input: Scores Output: result Constraints: 1 <= id <= 10';
  const sqlProblem = { slug: 'rank-scores', number: '178', title: 'Rank Scores', url: 'https://leetcode.com/problems/rank-scores/', difficulty: 'Medium', tags: ['Database'], statement: sqlStatement, examples: [{ index: 1, input: 'Scores', output: 'result', explanation: '' }], constraints: ['1 <= id <= 10'], schema: [], starterCode: '', editorCode: '', editorLanguageLabel: 'MySQL', editorLanguageKey: 'mysql', completeness: { hasStatement: true, exampleCount: 1, hasConstraints: true, hasSchema: false, missing: ['schema'], statementLength: sqlStatement.length } };
  currentResponse = { ok: false, reason: 'INCOMPLETE_CONTEXT', problem: sqlProblem }; activeUrl = sqlProblem.url; $('#refreshBtn').click(); await waitFor(() => $('#problemTitle').textContent.includes('Rank Scores'));
  const beforeIncomplete = solveCalls; click('solution'); await waitFor(() => $('.error'));
  check('panel: MySQL detection blocks missing schema without sending', () => { assert.ok(win.document.querySelector('#contextPreview').textContent.toLowerCase().includes('mysql')); assert.ok(win.document.querySelector('.error').textContent.includes('schema')); assert.equal(solveCalls, beforeIncomplete); });
  const completeSql = { ...sqlProblem, schema: [{ table: 'Scores', columns: [{ name: 'id', type: 'int' }, { name: 'score', type: 'decimal' }], notes: [] }], completeness: { ...sqlProblem.completeness, hasSchema: true, missing: [] } };
  currentResponse = { ok: true, problem: completeSql }; $('#refreshBtn').click(); await waitFor(() => $('#problemStatus').textContent.includes('Problem detected'));
  const beforeSql = solveCalls; click('solution'); await waitFor(() => solveCalls === beforeSql + 1 && !win.document.querySelector('.spinner'));
  check('panel: complete Rank Scores context sends its schema as MySQL', () => { assert.equal(lastSolveBody.category, 'sql'); assert.equal(lastSolveBody.language, 'mysql'); assert.equal(lastSolveBody.schema[0].table, 'Scores'); assert.ok($('.copy-code')); });
  currentResponse = { ok: true, problem }; activeUrl = 'https://leetcode.com/problems/4sum/'; $('#refreshBtn').click(); await waitFor(() => $('#problemTitle').textContent.includes('4Sum'));
  holdNextSolve = true;
  const beforeDelayed = solveCalls; click('approach'); await waitFor(() => solveCalls === beforeDelayed + 1 && releaseHeld);
  const twoSumProblem = { ...problem, slug: 'two-sum', number: '1', title: 'Two Sum', url: 'https://leetcode.com/problems/two-sum/' };
  currentResponse = { ok: true, problem: twoSumProblem }; activeUrl = twoSumProblem.url; $('#refreshBtn').click(); await waitFor(() => $('#problemTitle').textContent.includes('Two Sum'));
  releaseHeld(); await sleep(80);
  check('panel: delayed old-page result is discarded after navigation', () => assert.ok(!$('#resultBody').textContent.includes('Mock answer (approach)')));
  currentResponse = { ok: true, problem }; activeUrl = 'https://leetcode.com/problems/4sum/'; $('#refreshBtn').click(); await waitFor(() => $('#problemTitle').textContent.includes('4Sum'));

  for (const op of ['explain', 'approach', 'solution', 'dryrun', 'complexity', 'edgecases', 'review', 'optimize']) {
    const before = solveCalls;
    click(op);
    await waitFor(() => !win.document.querySelector('.spinner') && $('#resultBody').textContent.includes('Mock answer'));
    check('panel: ' + op + ' renders result with 1 API call', () => { assert.equal(solveCalls, before + 1); if (op === 'solution') assert.ok(win.document.querySelector('#resultBody').textContent.includes('AI checked')); else if (['review', 'optimize'].includes(op)) assert.ok(win.document.querySelector('#resultBody').textContent.includes('Example checks')); else assert.ok(win.document.querySelector('#resultBody').textContent.includes('(' + op + ')')); assert.equal(win.document.querySelector('#resultTitle').textContent.length > 0, true); });
  }
  const callsAfterAll = solveCalls;
  click('explain'); await sleep(100);
  check('panel: clicking a cached section makes NO new API call', () => assert.equal(solveCalls, callsAfterAll));
  check('panel: footer shows remaining quota', () => assert.match($('#quota').textContent, /free requests left today/));

  click('solution'); await sleep(100);
  check('panel: code block has own Copy button copying only code', () => { assert.ok($('.copy-code')); });
  $('.copy-code').click(); await sleep(50);
  check('panel: code copy contains only code', () => assert.equal(copied, starterCode));
  $('#copyBtn').click(); await sleep(50);
  check('panel: whole-result copy works', () => assert.equal(copied, starterCode));

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
  const followupQuestion = 'Why sort first?';
  const beforeFollowupTimeout = solveCalls;
  timeoutNextSolve = true;
  $('#askInput').value = followupQuestion; $('#askBtn').click();
  await waitFor(() => solveCalls === beforeFollowupTimeout + 1 && $('.error') && !win.document.querySelector('.spinner'));
  check('panel: timeout shows request ID and retains follow-up question for retry', () => {
    assert.match($('.error').textContent, /context is preserved/i);
    assert.match($('.error').textContent, /Request ID: [0-9a-f-]{36}/i);
    assert.equal($('#askInput').value, followupQuestion);
    assert.ok($('#resultExtra .btn'));
  });
  $('#resultExtra .btn').click();
  await waitFor(() => solveCalls === beforeFollowupTimeout + 2 && $('.chat-q') && !win.document.querySelector('.spinner'));
  check('panel: follow-up retry keeps the question and renders the answer', () => {
    assert.equal($('.chat-q').textContent, followupQuestion);
    assert.ok($('.chat-a').textContent.includes('Mock answer'));
  });

  // clear removes cache -> next click calls API again
  click('explain'); await sleep(50); $('#clearBtn').click(); await sleep(30);
  check('panel: clear empties the result', () => assert.ok($('#resultBody').textContent.includes('Nothing generated yet')));

  // review with no code -> message, no API call
  currentResponse = { ok: true, problem: { ...problem, editorCode: '' } };
  const beforeNoCode = solveCalls;
  click('review'); await waitFor(() => $('.error'));
  check('panel: review without editor code shows message and makes no API call', () => { assert.ok($('.error').textContent.includes('No code was found')); assert.equal(solveCalls, beforeNoCode); });

  // non-problem page
  currentResponse = { ok: false, reason: 'NOT_PROBLEM' }; activeUrl = 'https://leetcode.com/problemset/';
  $('#refreshBtn').click(); await waitFor(() => $('#problemTitle').textContent.includes('Open a LeetCode'));
  check('panel: non-problem page disables buttons and explains', () => { assert.ok([...win.document.querySelectorAll('.sec-btn')].every((b) => b.disabled)); assert.ok($('#problemStatus').textContent.includes('leetcode.com/problems')); });

  // server down -> friendly error + retry
  server.close(); server.closeAllConnections?.();
  currentResponse = { ok: true, problem }; activeUrl = 'https://leetcode.com/problems/4sum/';
  $('#refreshBtn').click(); await waitFor(() => $('#problemTitle').textContent.includes('4Sum'));
  click('complexity'); await waitFor(() => $('.error'));
  check('panel: server down shows friendly error with Try again', () => { assert.ok($('.error').textContent.includes('Cannot reach')); assert.ok(win.document.querySelector('#resultExtra .btn')); });
  win.close();
}

for (const [s, n] of results) console.log(s, n);
console.log(`\n${results.filter((r) => r[0] === 'PASS').length}/${results.length} passed`);
process.exit(results.some((r) => r[0] === 'FAIL') ? 1 : 0);
