/* CodeMate AI side panel */
(() => {
  const $ = (id) => document.getElementById(id);
  const LANGS = { auto: 'Auto (recommended)', cpp: 'C++', python: 'Python', java: 'Java', mysql: 'MySQL', postgresql: 'PostgreSQL', oraclesql: 'Oracle SQL', mssql: 'MS SQL Server', pandas: 'Pandas', bash: 'Bash' };
  const LABELS = { explain: 'Explain Problem', hint: 'Hint', approach: 'Approach', solution: 'Solution Code', dryrun: 'Dry Run', complexity: 'Complexity', edgecases: 'Edge Cases', review: 'Review My Code', optimize: 'Optimize My Code', followup: 'Ask Follow-up' };
  const ICONS = { gear: '<path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>', refresh: '<path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/>', copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', explain: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1-1.5 2M12 17h.01"/>', hint: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>', approach: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H14a3 3 0 013 3v6.5"/>', solution: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>', dryrun: '<path d="M4 6h16M4 12h16M4 18h10"/><path d="M18 15l3 3-3 3"/>', complexity: '<path d="M3 20h18M5 16l4-5 4 3 6-8"/>', edgecases: '<path d="M12 3l9 16H3L12 3z"/><path d="M12 10v4M12 17h.01"/>', review: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8.5 11l2 2 3.5-4"/>', optimize: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>', followup: '<path d="M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12z"/>' };
  const SECTION_IDS = Object.keys(LABELS);
  const state = { problem: null, classification: null, contextId: '', language: CONFIG.DEFAULT_LANGUAGE || 'auto', active: null, busy: false, loading: false, error: null, draft: '', cache: new Map(), hints: new Map(), chats: new Map(), requestId: 0, actionId: 0 };
  const hash = (value) => { let h = 5381; const s = String(value || ''); for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slugFromUrl = (url) => { try { return (new URL(url).pathname.match(/^\/problems\/([^/]+)/) || [])[1] || ''; } catch { return ''; } };
  const debounce = (fn, ms) => { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); }; };
  function identity(problem, classification) {
    const full = JSON.stringify({ title: problem.title, number: problem.number, statement: problem.statement, examples: problem.examples, constraints: problem.constraints, schema: problem.schema, tags: problem.tags, difficulty: problem.difficulty, starterCode: problem.starterCode, editorCode: problem.editorCode, editorLanguageKey: problem.editorLanguageKey, editorLanguageLabel: problem.editorLanguageLabel });
    return [problem.slug, classification.category, classification.language, state.language, hash(full)].join('|');
  }
  const keyFor = (op) => state.contextId + '|' + op;
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); }
    catch { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
  }
  function buildStaticUi() {
    const svg = (name) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
    $('settingsBtn').innerHTML = svg('gear'); $('refreshBtn').innerHTML = svg('refresh'); $('copyBtn').innerHTML = svg('copy'); $('clearBtn').innerHTML = svg('trash'); $('serverUrl').textContent = CONFIG.BACKEND_URL;
    for (const select of [$('lang'), $('defaultLang')]) select.innerHTML = Object.entries(LANGS).map(([v, label]) => '<option value="' + v + '">' + label + '</option>').join('');
    $('grid').innerHTML = SECTION_IDS.map((id) => '<button type="button" class="sec-btn" data-op="' + id + '" aria-pressed="false" disabled>' + svg(id) + '<span>' + LABELS[id] + '</span></button>').join('');
  }
  function setProblemUi(dot, title, status, isError = false) {
    $('statusDot').className = 'dot ' + dot; $('problemTitle').textContent = title; $('problemStatus').textContent = status; $('problemStatus').className = 'problem-status' + (isError ? ' err' : '');
  }
  async function fetchProblem() {
    let tab;
    try { [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); } catch { return { ok: false, reason: 'NO_TAB' }; }
    const slug = tab && slugFromUrl(tab.url || '');
    if (!tab || !slug || !/^https:\/\/leetcode\.com\/problems\//.test(tab.url || '')) return { ok: false, reason: 'NOT_PROBLEM' };
    const requestId = ++state.requestId;
    let response;
    try { response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PROBLEM', requestId }); }
    catch { return { ok: false, reason: 'NO_SCRIPT', requestId }; }
    let currentTab;
    try { [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true }); } catch { /* stale tab */ }
    if (!currentTab || currentTab.id !== tab.id || slugFromUrl(currentTab.url || '') !== slug) return { ok: false, reason: 'PROBLEM_CHANGED', requestId };
    if (response?.requestId !== requestId) return { ok: false, reason: 'STALE_RESPONSE', requestId };
    if (response?.problem?.slug !== slug) return { ok: false, reason: 'PROBLEM_CHANGED', requestId };
    return response;
  }
  function renderPreview() {
    const target = $('contextPreview'), p = state.problem, c = state.classification;
    if (!p || !c) { target.textContent = ''; return; }
    const confidence = Math.round(c.confidence * 100), missing = p.completeness?.missing || [];
    const tables = (p.schema || []).map((t) => t.table).join(', ') || 'none detected';
    target.innerHTML = '<strong>Current page context</strong><div>Type: ' + esc(c.category) + ' · Language: ' + esc(LANGS[c.language] || c.language) + '</div><div>Confidence: ' + confidence + '% · Examples: ' + (p.examples || []).length + ' · Constraints: ' + (p.constraints || []).length + '</div><div>Tables: ' + esc(tables) + ' · Statement: ' + (p.completeness?.statementLength || (p.statement || '').length) + ' characters</div><div>Starter code: ' + (p.starterCode || '').length + ' chars · Current editor: ' + (p.editorCode || '').length + ' chars</div>' + (confidence < 70 ? '<p class="context-warning">Low-confidence guess. Check the detected type or choose a language.</p>' : '') + (missing.length ? '<p class="context-warning">Missing: ' + esc(missing.join(', ')) + '</p>' : '');
  }
  function applyResponse(response) {
    const oldId = state.contextId;
    if (!response?.problem) {
      state.problem = null; state.classification = null; state.contextId = ''; state.active = null; state.error = null;
      const messages = { NOT_PROBLEM: ['Open a LeetCode problem', 'Go to a page like leetcode.com/problems/two-sum/, then refresh.'], NO_SCRIPT: ['Reload the LeetCode tab', 'The page script is unavailable. Reload the tab (Ctrl+R), then refresh.'], NO_TAB: ['No active tab', 'Select a LeetCode problem tab, then refresh.'], NO_DESCRIPTION: ['Problem text not found', 'The page may still be loading or its layout changed. Press refresh to retry.'], PROBLEM_CHANGED: ['Problem changed while reading', 'The active page changed during the read. Press refresh and try again.'], STALE_RESPONSE: ['Page read expired', 'A newer read replaced this result. Press refresh and try again.'] };
      const msg = messages[response?.reason] || ['Problem not available', 'Refresh the page and try again.'];
      setProblemUi('err', msg[0], msg[1], response?.reason !== 'NOT_PROBLEM'); $('contextPreview').textContent = ''; return;
    }
    state.problem = response.problem; state.classification = CodeMateClassifier.classify(state.problem, state.language); state.contextId = identity(state.problem, state.classification);
    const p = state.problem, missing = p.completeness?.missing || [], complete = response.ok && !missing.length;
    const lines = p.editorCode ? p.editorCode.split('\n').length : 0;
    setProblemUi(complete ? 'ok' : 'err', p.number ? p.number + '. ' + p.title : p.title, complete ? 'Problem detected · ' + (p.examples || []).length + ' example(s)' + (lines ? ' · ' + lines + ' editor lines' : '') : 'Context incomplete: ' + (missing.join(', ') || response.reason || 'refresh required') + '.', !complete);
    if (oldId && oldId !== state.contextId) state.error = null;
    renderPreview();
  }
  async function refreshProblem() {
    const id = ++state.actionId; state.busy = false; state.loading = false;
    setProblemUi('loading', state.problem?.title || 'Reading problem...', 'Reading the visible page and editor...');
    const response = await fetchProblem();
    if (id !== state.actionId) return;
    const oldSlug = state.problem?.slug; applyResponse(response);
    if (oldSlug && oldSlug !== state.problem?.slug) { state.active = null; state.error = null; }
    render();
  }
  function currentEntry() {
    if (!state.problem || !state.active) return null;
    if (state.active === 'hint') { const list = state.hints.get(state.contextId) || []; return list.length ? { text: list.map((v) => v.text).join('\n\n---\n\n'), verifiedExamples: 0 } : null; }
    if (state.active === 'followup') return null;
    return state.cache.get(keyFor(state.active)) || null;
  }
  function displayMarkdown(entry, op) {
    if (!entry) return '';
    if (op !== 'solution') return entry.text;
    const lang = state.classification?.language || 'python';
    const fence = lang === 'cpp' ? 'cpp' : ['python', 'pandas'].includes(lang) ? 'python' : lang === 'java' ? 'java' : lang === 'bash' ? 'bash' : 'sql';
    const ticks = String.fromCharCode(96).repeat(3);
    return ticks + fence + '\n' + entry.text + '\n' + ticks;
  }
  function addRetry(extra) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'btn ghost'; button.textContent = 'Try again'; button.addEventListener('click', state.error.retry); extra.prepend(button);
  }
  function buildAsk(extra) {
    extra.innerHTML = '<div class="ask"><label for="askInput" class="label">Your question</label><textarea id="askInput" maxlength="1000" placeholder="Type a question about this problem"></textarea><div class="row"><span class="hint">Enter to send, Shift+Enter for a new line</span><button type="button" class="btn" id="askBtn"' + (state.busy ? ' disabled' : '') + '>Ask</button></div></div>';
    const input = $('askInput'); input.value = state.draft || ''; input.addEventListener('input', () => { state.draft = input.value; });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitQuestion(); } });
    $('askBtn').addEventListener('click', submitQuestion);
  }
  function render() {
    const p = state.problem;
    for (const button of $('grid').querySelectorAll('.sec-btn')) {
      const op = button.dataset.op; button.disabled = !p || state.busy; button.setAttribute('aria-pressed', String(state.active === op));
      const done = p && (op === 'hint' ? (state.hints.get(state.contextId) || []).length : op === 'followup' ? (state.chats.get(state.contextId) || []).length : state.cache.has(keyFor(op)));
      button.classList.toggle('done', Boolean(done));
    }
    $('lang').value = state.language; $('defaultLang').value = state.language; $('lang').disabled = $('defaultLang').disabled = state.busy;
    $('resultTitle').textContent = state.active ? LABELS[state.active] : 'Result';
    const body = $('resultBody'), extra = $('resultExtra'); extra.innerHTML = '';
    if (!p) { body.innerHTML = '<p class="empty">Open a LeetCode problem to get started.</p>'; $('copyBtn').disabled = $('clearBtn').disabled = true; return; }
    if (!state.active) { body.innerHTML = '<p class="empty">Pick a section above. The page and editor are re-read when you click.</p>'; $('copyBtn').disabled = $('clearBtn').disabled = true; return; }
    let html = state.error ? '<p class="error" role="alert">' + esc(state.error.message) + '</p>' : '';
    if (state.loading) html += '<div class="loading-row"><span class="spinner" aria-hidden="true"></span><span>Reading current context and preparing your answer...</span></div>';
    if (state.active === 'followup') {
      const chat = state.chats.get(state.contextId) || [];
      for (let i = 0; i < chat.length; i += 2) html += '<p class="chat-q">' + esc(chat[i].text) + '</p><div class="chat-a">' + renderMarkdown(chat[i + 1]?.text || '') + '</div>';
      if (!chat.length && !state.loading && !state.error) html += '<p class="empty">Ask a question about this problem, for example "Why does a hash map work here?"</p>';
      body.innerHTML = html; buildAsk(extra); $('copyBtn').disabled = $('clearBtn').disabled = chat.length === 0;
      if (state.error?.retry && !state.loading) addRetry(extra); return;
    }
    const entry = currentEntry();
    if (entry) {
      html += renderMarkdown(displayMarkdown(entry, state.active));
      if (entry.verifiedExamples) html += '<p class="verification-note">AI checked ' + entry.verifiedExamples + ' example(s) by reasoning; the code was not executed.</p>';
    } else if (!state.loading && !state.error) html += '<p class="empty">Nothing generated yet for ' + esc(LANGS[state.classification?.language] || 'this language') + '.</p>';
    body.innerHTML = html;
    if (state.active === 'hint') {
      const level = (state.hints.get(state.contextId) || []).length;
      if (level > 0 && level < 4 && !state.loading) extra.innerHTML = '<button type="button" class="btn" id="nextHint">Show hint ' + (level + 1) + ' of 4</button>';
      else if (level >= 4) extra.innerHTML = '<p class="empty">That was the last hint. Try Approach or Solution Code if you are still stuck.</p>';
    }
    if (state.error?.retry && !state.loading) addRetry(extra);
    $('copyBtn').disabled = $('clearBtn').disabled = !entry;
  }
  function payloadFor(problem, classification, operation, extra = {}) {
    return { operation, slug: problem.slug, number: problem.number || '', title: problem.title, url: problem.url, difficulty: problem.difficulty || '', tags: problem.tags || [], statement: problem.statement, examples: problem.examples || [], constraints: problem.constraints || [], schema: problem.schema || [], starterCode: problem.starterCode || '', editorCode: problem.editorCode || '', editorLanguageLabel: problem.editorLanguageLabel || '', editorLanguageKey: problem.editorLanguageKey || '', completeness: problem.completeness, selectedLanguage: state.language, language: classification.language, category: classification.category, ...extra };
  }
  function incompleteText(problem) {
    const missing = problem?.completeness?.missing || [];
    return 'The current page context is incomplete (' + (missing.join(', ') || 'statement or examples') + '). No request was sent. Wait for the description to finish loading, then refresh.';
  }
  async function performAction(operation, { nextHint = false, question = '' } = {}) {
    if (!state.problem || state.busy) return;
    const actionId = ++state.actionId; state.active = operation; state.error = null; state.busy = state.loading = true; render();
    try {
      const response = await fetchProblem();
      if (actionId !== state.actionId) return;
      applyResponse(response);
      if (!response?.problem) { state.error = { message: 'Could not read the current problem page. Refresh and try again.', retry: () => performAction(operation, { nextHint, question }) }; return; }
      const p = response.problem;
      if (!response.ok || p.completeness?.missing?.length) { state.error = { message: incompleteText(p), retry: refreshProblem }; return; }
      const classification = CodeMateClassifier.classify(p, state.language);
      state.classification = classification; state.contextId = identity(p, classification); renderPreview();
      if (operation === 'followup' && !question) { state.loading = false; render(); $('askInput')?.focus(); return; }
      if (['review', 'optimize'].includes(operation) && !p.editorCode) { state.error = { message: 'No code was found in the LeetCode editor. Add code, then click this section again.', retry: () => performAction(operation) }; return; }
      if (operation === 'hint') {
        const list = state.hints.get(state.contextId) || [];
        if (list.length && !nextHint) return;
        if (list.length >= 4) return;
      }
      const cacheKey = keyFor(operation);
      if (operation !== 'hint' && operation !== 'followup' && state.cache.has(cacheKey)) return;
      const extras = operation === 'hint' ? { hintLevel: (state.hints.get(state.contextId) || []).length + 1 } : operation === 'followup' ? { question, history: (state.chats.get(state.contextId) || []).slice(-6) } : {};
      const result = await Api.solve(payloadFor(p, classification, operation, extras));
      if (actionId !== state.actionId) return;
      if (result.quota) $('quota').textContent = result.quota.remaining + ' of ' + result.quota.limit + ' free requests left today';
      const latest = await fetchProblem();
      if (actionId !== state.actionId) return;
      if (!latest?.ok || !latest.problem) {
        applyResponse(latest); state.error = { message: 'The page changed while the answer was being prepared. The old-page answer was discarded. Refresh and try again.', retry: () => performAction(operation, { nextHint, question }) }; return;
      }
      const latestClass = CodeMateClassifier.classify(latest.problem, state.language);
      if (identity(latest.problem, latestClass) !== state.contextId) {
        state.problem = latest.problem; state.classification = latestClass; state.contextId = identity(latest.problem, latestClass); renderPreview();
        state.error = { message: 'The problem or editor changed while the answer was being prepared. The answer was discarded. Click the section again.', retry: () => performAction(operation, { nextHint, question }) }; return;
      }
      const entry = { text: String(result.text || ''), verifiedExamples: Number(result.verifiedExamples) || 0 };
      if (operation === 'hint') state.hints.set(state.contextId, [...(state.hints.get(state.contextId) || []), entry]);
      else if (operation === 'followup') {
        const chat = state.chats.get(state.contextId) || [];
        state.chats.set(state.contextId, [...chat, { role: 'user', text: question }, { role: 'model', text: entry.text }].slice(-20)); state.draft = '';
      } else state.cache.set(cacheKey, entry);
      state.error = null;
    } catch (error) {
      if (actionId !== state.actionId) return;
      if (error?.quota) $('quota').textContent = error.quota.remaining + ' of ' + error.quota.limit + ' free requests left today';
      const retry = operation === 'followup' ? () => performAction(operation, { question }) : () => performAction(operation, { nextHint: operation === 'hint' });
      state.error = { message: error?.message || 'Something went wrong. Please try again.', retry };
    } finally {
      if (actionId === state.actionId) { state.busy = state.loading = false; render(); }
    }
  }
  async function submitQuestion() {
    const question = ($('askInput')?.value || '').trim();
    if (!question || state.busy || !state.problem) return;
    state.draft = question; await performAction('followup', { question });
  }
  function clearActive() {
    if (!state.problem || !state.active) return;
    if (state.active === 'hint') state.hints.delete(state.contextId);
    else if (state.active === 'followup') state.chats.delete(state.contextId);
    else state.cache.delete(keyFor(state.active));
    state.error = null; render();
  }
  function rawResultText() {
    if (state.active === 'followup') return (state.chats.get(state.contextId) || []).map((item) => item.role === 'user' ? 'Q: ' + item.text : item.text).join('\n\n');
    return currentEntry()?.text || '';
  }
  function bindEvents() {
    $('grid').addEventListener('click', (e) => { const b = e.target.closest('.sec-btn'); if (b && !b.disabled) performAction(b.dataset.op); });
    $('resultExtra').addEventListener('click', (e) => { if (e.target.closest('#nextHint') && !state.busy) performAction('hint', { nextHint: true }); });
    $('resultBody').addEventListener('click', async (e) => { const b = e.target.closest('.copy-code'); if (!b) return; await copyText(b.closest('.codeblock')?.querySelector('pre code')?.textContent || ''); b.textContent = 'Copied'; });
    $('copyBtn').addEventListener('click', async () => { const text = rawResultText(); if (!text) return; await copyText(text); $('copyBtn').setAttribute('aria-label', 'Copied'); setTimeout(() => $('copyBtn').setAttribute('aria-label', 'Copy result'), 1200); });
    $('clearBtn').addEventListener('click', clearActive); $('refreshBtn').addEventListener('click', refreshProblem);
    $('settingsBtn').addEventListener('click', () => { const panel = $('settings'); panel.hidden = !panel.hidden; $('settingsBtn').setAttribute('aria-expanded', String(!panel.hidden)); });
    const onLanguage = async (e) => {
      if (state.busy) return;
      state.language = Object.hasOwn(LANGS, e.target.value) ? e.target.value : 'auto';
      await chrome.storage.local.set({ language: state.language });
      if (state.problem) { state.classification = CodeMateClassifier.classify(state.problem, state.language); state.contextId = identity(state.problem, state.classification); renderPreview(); }
      render();
    };
    $('lang').addEventListener('change', onLanguage); $('defaultLang').addEventListener('change', onLanguage);
    const soon = debounce(refreshProblem, 500);
    chrome.tabs.onActivated.addListener(soon);
    chrome.tabs.onUpdated.addListener((_id, info, tab) => { if (tab.active && (info.url || info.status === 'complete')) soon(); });
    chrome.runtime.onMessage.addListener((msg) => { if (msg?.type === 'PROBLEM_CHANGED') soon(); });
  }
  async function init() {
    buildStaticUi(); const saved = await chrome.storage.local.get(['language']);
    if (saved.language && Object.hasOwn(LANGS, saved.language)) state.language = saved.language;
    bindEvents(); render(); await refreshProblem();
  }
  init();
})();
