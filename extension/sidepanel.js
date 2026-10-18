/* CodeMate AI side panel */
(() => {
  const $ = (id) => document.getElementById(id);

  const LANGS = { cpp: 'C++', python: 'Python', java: 'Java' };
  const MAX_HINT_LEVEL = 4;

  const ICONS = {
    gear: '<path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
    refresh: '<path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    explain: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1-1.5 2M12 17h.01"/>',
    hint: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>',
    approach: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H14a3 3 0 013 3v6.5"/>',
    solution: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    dryrun: '<path d="M4 6h16M4 12h16M4 18h10"/><path d="M18 15l3 3-3 3"/>',
    complexity: '<path d="M3 20h18M5 16l4-5 4 3 6-8"/>',
    edgecases: '<path d="M12 3l9 16H3L12 3z"/><path d="M12 10v4M12 17h.01"/>',
    review: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8.5 11l2 2 3.5-4"/>',
    optimize: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
    followup: '<path d="M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12z"/>',
  };
  const svg = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  const SECTIONS = [
    { id: 'explain', label: 'Explain Problem' },
    { id: 'hint', label: 'Hint' },
    { id: 'approach', label: 'Approach' },
    { id: 'solution', label: 'Solution Code' },
    { id: 'dryrun', label: 'Dry Run' },
    { id: 'complexity', label: 'Complexity' },
    { id: 'edgecases', label: 'Edge Cases' },
    { id: 'review', label: 'Review My Code', needsCode: true },
    { id: 'optimize', label: 'Optimize My Code', needsCode: true },
    { id: 'followup', label: 'Ask Follow-up' },
  ];
  const LABEL = Object.fromEntries(SECTIONS.map((s) => [s.id, s.label]));

  const state = {
    problem: null,        // { slug, number, title, description, code }
    language: CONFIG.DEFAULT_LANGUAGE,
    active: null,
    busy: false,
    loading: false,
    error: null,          // { message, retry }
    cache: new Map(),     // key -> markdown text
    hints: new Map(),     // slug -> [markdown, ...]
    chats: new Map(),     // slug -> [{role, text}]
    requestId: 0,
  };

  // ---------- helpers ----------
  const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const cacheKey = (op, code = '') => `${state.problem.slug}|${state.language}|${op}${code ? '|' + hash(code) : ''}`;
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
  }
  function flash(btn, text) {
    const old = btn.textContent;
    btn.textContent = text;
    setTimeout(() => { btn.textContent = old; }, 1200);
  }

  // ---------- static UI ----------
  function buildStaticUi() {
    $('settingsBtn').innerHTML = svg('gear');
    $('refreshBtn').innerHTML = svg('refresh');
    $('copyBtn').innerHTML = svg('copy');
    $('clearBtn').innerHTML = svg('trash');
    $('serverUrl').textContent = CONFIG.BACKEND_URL;

    for (const sel of [$('lang'), $('defaultLang')]) {
      sel.innerHTML = Object.entries(LANGS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    }
    $('grid').innerHTML = SECTIONS.map(
      (s) => `<button type="button" class="sec-btn" data-op="${s.id}" aria-pressed="false" disabled>${svg(s.id)}<span>${s.label}</span></button>`
    ).join('');
  }

  // ---------- problem detection ----------
  function setProblemUi({ dot, title, status, isError = false }) {
    $('statusDot').className = `dot ${dot}`;
    $('problemTitle').textContent = title;
    const el = $('problemStatus');
    el.textContent = status;
    el.className = `problem-status${isError ? ' err' : ''}`;
  }

  async function fetchProblem() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !/^https:\/\/leetcode\.com\/problems\//.test(tab.url)) return { ok: false, reason: 'NOT_PROBLEM' };
    try {
      return await chrome.tabs.sendMessage(tab.id, { type: 'GET_PROBLEM' });
    } catch {
      return { ok: false, reason: 'NO_SCRIPT' };
    }
  }

  async function refreshProblem() {
    const id = ++state.requestId;
    setProblemUi({ dot: 'loading', title: state.problem?.title || 'Reading problem...', status: 'Reading the page...' });
    const res = await fetchProblem();
    if (id !== state.requestId) return; // a newer refresh superseded this one

    const prevSlug = state.problem?.slug;
    if (res?.ok) {
      state.problem = res.problem;
      const p = res.problem;
      const lines = p.code ? p.code.split('\n').length : 0;
      setProblemUi({
        dot: 'ok',
        title: p.number ? `${p.number}. ${p.title}` : p.title,
        status: lines ? `Problem detected. Editor code found (${lines} lines).` : 'Problem detected. No editor code found (Review and Optimize need it).',
      });
      if (prevSlug !== p.slug) { state.active = null; state.error = null; }
    } else {
      state.problem = null;
      state.active = null;
      state.error = null;
      const messages = {
        NOT_PROBLEM: ['Open a LeetCode problem', 'Go to a page like leetcode.com/problems/two-sum, then reopen this panel or press refresh.'],
        NO_SCRIPT: ['Reload the LeetCode tab', 'CodeMate AI could not reach this page. Reload the tab once (Ctrl+R), then press refresh.'],
        NO_DESCRIPTION: ['Problem text not found', 'The page may still be loading, or LeetCode changed its layout. Press refresh to try again.'],
      };
      const [title, status] = messages[res?.reason] || ['Problem not available', 'Something went wrong while reading the page. Press refresh to try again.'];
      setProblemUi({ dot: 'err', title, status, isError: res?.reason !== 'NOT_PROBLEM' });
    }
    render();
  }

  // ---------- rendering ----------
  function currentContent() {
    if (!state.problem || !state.active) return null;
    const op = state.active;
    if (op === 'hint') {
      const list = state.hints.get(state.problem.slug) || [];
      return list.length ? list.join('\n\n---\n\n') : null;
    }
    if (op === 'followup') return null;
    if (op === 'review' || op === 'optimize') return state.cache.get(cacheKey(op, state.problem.code)) ?? null;
    return state.cache.get(cacheKey(op)) ?? null;
  }

  function render() {
    const p = state.problem;
    const grid = $('grid');
    for (const btn of grid.querySelectorAll('.sec-btn')) {
      const op = btn.dataset.op;
      btn.disabled = !p || state.busy;
      btn.setAttribute('aria-pressed', String(state.active === op));
      const done = p && (op === 'hint' ? (state.hints.get(p.slug) || []).length > 0
        : op === 'followup' ? (state.chats.get(p.slug) || []).length > 0
        : state.cache.has(cacheKey(op, op === 'review' || op === 'optimize' ? p.code : '')));
      btn.classList.toggle('done', Boolean(done));
    }
    $('lang').value = state.language;

    const body = $('resultBody');
    const extra = $('resultExtra');
    extra.innerHTML = '';
    $('resultTitle').textContent = state.active ? LABEL[state.active] : 'Result';

    if (!p) {
      body.innerHTML = '<p class="empty">Open a LeetCode problem to get started.</p>';
      $('copyBtn').disabled = $('clearBtn').disabled = true;
      return;
    }
    if (!state.active) {
      body.innerHTML = '<p class="empty">Pick a section above. Only that section is generated, and only when you click it.</p>';
      $('copyBtn').disabled = $('clearBtn').disabled = true;
      return;
    }

    let html = '';
    if (state.error) {
      html += `<p class="error" role="alert">${escapeHtml(state.error.message)}</p>`;
    }
    if (state.loading) {
      html += '<div class="loading-row"><span class="spinner" aria-hidden="true"></span><span>Thinking... this can take up to a minute.</span></div>';
    }

    const op = state.active;
    if (op === 'followup') {
      const chat = state.chats.get(p.slug) || [];
      for (let i = 0; i < chat.length; i += 2) {
        html += `<p class="chat-q">${escapeHtml(chat[i].text)}</p><div class="chat-a">${renderMarkdown(chat[i + 1]?.text || '')}</div>`;
      }
      if (!chat.length && !state.loading && !state.error) html += '<p class="empty">Ask anything about this problem, for example "Why does a hash map work here?"</p>';
      body.innerHTML = html;
      buildAsk(extra);
      $('copyBtn').disabled = chat.length === 0;
      $('clearBtn').disabled = chat.length === 0;
      return;
    }

    const content = currentContent();
    if (content) html += renderMarkdown(content);
    else if (!state.loading && !state.error) html += `<p class="empty">Nothing generated yet for this section in ${LANGS[state.language]}.</p>`;
    body.innerHTML = html;

    if (op === 'hint') {
      const level = (state.hints.get(p.slug) || []).length;
      if (level > 0 && level < MAX_HINT_LEVEL && !state.loading) {
        extra.innerHTML = `<button type="button" class="btn" id="nextHint" ${state.busy ? 'disabled' : ''}>Show hint ${level + 1} of ${MAX_HINT_LEVEL}</button>`;
      } else if (level >= MAX_HINT_LEVEL) {
        extra.innerHTML = '<p class="empty">That was the last hint. Try Approach or Solution Code if you are still stuck.</p>';
      }
    }
    if (state.error?.retry && !state.loading) {
      const retry = document.createElement('button');
      retry.type = 'button'; retry.className = 'btn ghost'; retry.textContent = 'Try again';
      retry.addEventListener('click', state.error.retry);
      extra.prepend(retry);
    }
    $('copyBtn').disabled = !content;
    $('clearBtn').disabled = !content;
  }

  function buildAsk(extra) {
    extra.innerHTML = `
      <div class="ask">
        <label for="askInput" class="label">Your question</label>
        <textarea id="askInput" maxlength="1000" placeholder="Type a question about this problem"></textarea>
        <div class="row"><span class="hint">Enter to send, Shift+Enter for a new line</span><button type="button" class="btn" id="askBtn" ${state.busy ? 'disabled' : ''}>Ask</button></div>
      </div>`;
    const input = $('askInput');
    const draft = state.draft || '';
    input.value = draft;
    input.addEventListener('input', () => { state.draft = input.value; });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitQuestion(); }
    });
    $('askBtn').addEventListener('click', submitQuestion);
  }

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- actions ----------
  function setQuota(q) {
    if (!q) return;
    $('quota').textContent = `${q.remaining} of ${q.limit} free requests left today`;
  }

  async function callApi(payload) {
    state.busy = true; state.loading = true; state.error = null;
    render();
    try {
      const r = await Api.solve(payload);
      setQuota(r.quota);
      return r.text;
    } finally {
      state.busy = false; state.loading = false;
    }
  }

  function showError(err, retry) {
    if (err?.quota) setQuota(err.quota);
    state.error = { message: err?.message || 'Something went wrong. Please try again.', retry };
    render();
  }

  function basePayload(code) {
    return {
      title: state.problem.title,
      description: state.problem.description,
      language: state.language,
      ...(code ? { userCode: code } : {}),
    };
  }

  async function runSection(op) {
    if (!state.problem || state.busy) return;
    state.active = op; state.error = null;

    if (op === 'followup') { render(); $('askInput')?.focus(); return; }
    if (op === 'hint') {
      if ((state.hints.get(state.problem.slug) || []).length) { render(); return; }
      return fetchHint();
    }

    let code = '';
    if (op === 'review' || op === 'optimize') {
      // Re-read the editor so edits made since the panel opened are included.
      state.busy = true; state.loading = true; render();
      const fresh = await fetchProblem();
      state.busy = false; state.loading = false;
      if (fresh?.ok) state.problem = { ...state.problem, code: fresh.problem.code };
      code = state.problem.code;
      if (!code) {
        state.error = { message: 'No code was found in the LeetCode editor. Type or paste your solution in the editor, then click this section again.' };
        render();
        return;
      }
    }

    const key = cacheKey(op, code);
    if (state.cache.has(key)) { render(); return; } // cached: no API call

    const attempt = async () => {
      try {
        const text = await callApi({ ...basePayload(code), operation: op });
        state.cache.set(key, text);
        state.error = null;
        render();
      } catch (err) { showError(err, attempt); }
    };
    await attempt();
  }

  async function fetchHint() {
    const slug = state.problem.slug;
    const list = state.hints.get(slug) || [];
    const level = list.length + 1;
    if (level > MAX_HINT_LEVEL) return;
    const attempt = async () => {
      try {
        const text = await callApi({ ...basePayload(), operation: 'hint', hintLevel: level });
        state.hints.set(slug, [...(state.hints.get(slug) || []), text]);
        state.error = null;
        render();
      } catch (err) { showError(err, attempt); }
    };
    await attempt();
  }

  async function submitQuestion() {
    const input = $('askInput');
    const question = (input?.value || '').trim();
    if (!question || state.busy || !state.problem) return;
    const slug = state.problem.slug;
    const chat = state.chats.get(slug) || [];
    const attempt = async () => {
      try {
        const text = await callApi({ ...basePayload(), operation: 'followup', question, history: chat.slice(-6) });
        state.chats.set(slug, [...chat, { role: 'user', text: question }, { role: 'model', text }].slice(-20));
        state.draft = '';
        state.error = null;
        render();
      } catch (err) { showError(err, attempt); }
    };
    await attempt();
  }

  function clearActive() {
    if (!state.problem || !state.active) return;
    const op = state.active;
    if (op === 'hint') state.hints.delete(state.problem.slug);
    else if (op === 'followup') state.chats.delete(state.problem.slug);
    else state.cache.delete(cacheKey(op, op === 'review' || op === 'optimize' ? state.problem.code : ''));
    state.error = null;
    render();
  }

  function rawResultText() {
    if (state.active === 'followup') {
      return (state.chats.get(state.problem.slug) || []).map((t) => (t.role === 'user' ? `Q: ${t.text}` : t.text)).join('\n\n');
    }
    return currentContent() || '';
  }

  // ---------- events ----------
  function bindEvents() {
    $('grid').addEventListener('click', (e) => {
      const btn = e.target.closest('.sec-btn');
      if (btn && !btn.disabled) runSection(btn.dataset.op);
    });
    $('resultExtra').addEventListener('click', (e) => {
      if (e.target.closest('#nextHint') && !state.busy) fetchHint();
    });
    $('resultBody').addEventListener('click', async (e) => {
      const btn = e.target.closest('.copy-code');
      if (!btn) return;
      const code = btn.closest('.codeblock')?.querySelector('pre code')?.textContent || '';
      await copyText(code);
      flash(btn, 'Copied');
    });
    $('copyBtn').addEventListener('click', async () => {
      const text = rawResultText();
      if (!text) return;
      await copyText(text);
      $('copyBtn').setAttribute('aria-label', 'Copied');
      setTimeout(() => $('copyBtn').setAttribute('aria-label', 'Copy result'), 1200);
    });
    $('clearBtn').addEventListener('click', clearActive);
    $('refreshBtn').addEventListener('click', refreshProblem);

    $('settingsBtn').addEventListener('click', () => {
      const panel = $('settings');
      panel.hidden = !panel.hidden;
      $('settingsBtn').setAttribute('aria-expanded', String(!panel.hidden));
    });
    const onLang = async (e) => {
      state.language = e.target.value;
      $('defaultLang').value = state.language;
      $('lang').value = state.language;
      await chrome.storage.local.set({ language: state.language });
      render();
    };
    $('lang').addEventListener('change', onLang);
    $('defaultLang').addEventListener('change', onLang);

    // The panel follows the active tab and in-page navigation.
    const soon = debounce(refreshProblem, 500);
    chrome.tabs.onActivated.addListener(soon);
    chrome.tabs.onUpdated.addListener((_id, info, tab) => { if (tab.active && (info.url || info.status === 'complete')) soon(); });
    chrome.runtime.onMessage.addListener((msg) => { if (msg?.type === 'PROBLEM_CHANGED') soon(); });
  }

  // ---------- start ----------
  async function init() {
    buildStaticUi();
    const saved = await chrome.storage.local.get(['language']);
    if (saved.language && LANGS[saved.language]) state.language = saved.language;
    $('defaultLang').value = state.language;
    bindEvents();
    render();
    await refreshProblem();
  }
  init();
})();
