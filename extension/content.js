// Reads the visible LeetCode problem. Sends data only when the side panel asks for it.
(() => {
  const MAX_DESCRIPTION = 7500;
  const MAX_CODE = 9500;

  const slugFromUrl = () => (location.pathname.match(/^\/problems\/([^/]+)/) || [])[1] || null;
  const clean = (s) => (s || '').replace(/\u00a0/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  const textOf = (el) => clean(el?.innerText || el?.textContent || '');
  const prettifySlug = (slug) => (slug || '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // ---- Title: several strategies, first hit wins ----
  function extractTitle(slug) {
    const strategies = [
      () => textOf(document.querySelector('[data-cy="question-title"]')),
      () => {
        const links = document.querySelectorAll(`a[href^="/problems/${slug}"]`);
        for (const a of links) {
          const t = textOf(a);
          if (/^\d+\.\s+\S/.test(t)) return t;
        }
        return '';
      },
      () => textOf(document.querySelector('div.text-title-large a, .text-title-large')),
      () => {
        const og = document.querySelector('meta[property="og:title"]')?.content || '';
        return og.replace(/\s*-\s*LeetCode.*$/i, '');
      },
      () => document.title.replace(/\s*-\s*LeetCode.*$/i, ''),
      () => prettifySlug(slug),
    ];
    for (const run of strategies) {
      try {
        const raw = run();
        if (raw && raw.length > 1) {
          const m = raw.match(/^(\d+)\.\s*(.+)$/);
          return { number: m ? m[1] : null, title: (m ? m[2] : raw).slice(0, 150) };
        }
      } catch { /* try next strategy */ }
    }
    return { number: null, title: prettifySlug(slug) };
  }

  // ---- Description (statement + examples + constraints) ----
  function smallestContaining(needle) {
    let best = null;
    for (const el of document.querySelectorAll('div, section, article')) {
      const t = el.innerText;
      if (!t || t.length > 20000 || !t.includes(needle)) continue;
      if (!best || t.length < best.innerText.length) best = el;
    }
    return best;
  }

  function extractDescription() {
    const strategies = [
      () => textOf(document.querySelector('[data-track-load="description_content"]')),
      () => textOf(document.querySelector('[class*="question-content"], [class*="description__"]')),
      () => textOf(document.querySelector('div[class*="elfjS"]')),
      () => {
        // Heuristic: smallest block that contains the examples
        const el = smallestContaining('Example 1');
        return el ? textOf(el) : '';
      },
      () => document.querySelector('meta[name="description"]')?.content || '',
    ];
    for (const run of strategies) {
      try {
        const t = run();
        if (t && t.length >= 60) return t.slice(0, MAX_DESCRIPTION);
      } catch { /* try next strategy */ }
    }
    return '';
  }

  // ---- Editor code ----
  function domCode() {
    // Fallback: Monaco only renders visible lines, so this may be partial.
    const lines = document.querySelectorAll('.monaco-editor .view-lines .view-line');
    if (!lines.length) return '';
    return Array.from(lines)
      .sort((a, b) => parseFloat(a.style.top || '0') - parseFloat(b.style.top || '0'))
      .map((l) => (l.textContent || '').replace(/\u00a0/g, ' '))
      .join('\n');
  }

  function getEditorCode() {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).slice(2);
      const finish = (code) => {
        window.removeEventListener('message', onMessage);
        clearTimeout(timer);
        resolve(clean(code || '').slice(0, MAX_CODE));
      };
      const onMessage = (e) => {
        const d = e.data;
        if (e.source !== window || !d || d.source !== 'codemate-bridge' || d.id !== id) return;
        finish(d.code || domCode());
      };
      const timer = setTimeout(() => finish(domCode()), 700);
      window.addEventListener('message', onMessage);
      window.postMessage({ source: 'codemate-content', type: 'GET_CODE', id }, '*');
    });
  }

  // ---- Public: wait for the dynamic page to render, then return data ----
  async function getProblem() {
    const slug = slugFromUrl();
    if (!slug) return { ok: false, reason: 'NOT_PROBLEM' };

    const deadline = Date.now() + 6000;
    let description = '';
    while (Date.now() < deadline) {
      description = extractDescription();
      if (description) break;
      await new Promise((r) => setTimeout(r, 400));
    }
    if (!description) return { ok: false, reason: 'NO_DESCRIPTION', slug };

    const { number, title } = extractTitle(slug);
    const code = await getEditorCode();
    return {
      ok: true,
      problem: { slug, number, title, description, code, url: `${location.origin}/problems/${slug}/` },
    };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type !== 'GET_PROBLEM') return false;
    getProblem().then(sendResponse).catch(() => sendResponse({ ok: false, reason: 'ERROR' }));
    return true; // async response
  });

  // LeetCode is a single-page app: tell the panel when the problem changes.
  let lastSlug = slugFromUrl();
  setInterval(() => {
    const now = slugFromUrl();
    if (now !== lastSlug) {
      lastSlug = now;
      chrome.runtime.sendMessage({ type: 'PROBLEM_CHANGED' }).catch(() => {}); // panel may be closed
    }
  }, 700);
})();
