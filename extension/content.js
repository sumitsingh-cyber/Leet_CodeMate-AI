(() => {
  const MAX_STATEMENT = 8000;
  const MAX_CODE = 9500;
  const SELECTORS = [
    '[data-track-load="description_content"]',
    '[data-cy="question-content"]',
    '[data-cy="question-description"]',
    '[data-testid="question-content"]',
    'main article[aria-label*="description"]',
    '[role="main"] article[aria-label*="description"]',
  ];
  let previousPage = null;
  const slugFromUrl = () => (location.pathname.match(/^\/problems\/([^/]+)/) || [])[1] || null;
  const clean = (value) => String(value || '').replace(/\u00a0/g, ' ').replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const textOf = (element) => clean(element && (element.innerText || element.textContent) || '');
  const visible = (element) => {
    if (!element || !element.isConnected || element.closest('[hidden], [aria-hidden="true"], nav, header, footer, aside, [role="navigation"], [role="complementary"]')) return false;
    const style = window.getComputedStyle ? window.getComputedStyle(element) : null;
    return !style || (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0');
  };

  function textWithTables(root) {
    if (!root) return '';
    const clone = root.cloneNode(true);
    for (const table of clone.querySelectorAll('table')) {
      const rows = Array.from(table.querySelectorAll('tr')).map((row) => {
        const cells = Array.from(row.querySelectorAll('th,td')).map((cell) => clean(cell.textContent));
        return cells.length ? '| ' + cells.join(' | ') + ' |' : '';
      }).filter(Boolean);
      table.replaceWith(document.createTextNode(rows.join('\n')));
    }
    return clean(clone.innerText || clone.textContent || '');
  }

  function extractTitle(slug) {
    let title = '';
    let number = '';
    for (const selector of ['[data-cy="question-title"]', 'a[href^="/problems/"]', 'h1', '.text-title-large']) {
      for (const element of document.querySelectorAll(selector)) {
        if (selector.startsWith('a[') && !(element.getAttribute('href') || '').includes('/problems/' + slug)) continue;
        const raw = textOf(element).replace(/\s*-\s*LeetCode.*$/i, '');
        const match = raw.match(/(?:^|\n)\s*(\d+)\.\s*(.+)$/);
        if (!number && match) number = match[1];
        const candidate = (match ? match[2] : raw).trim();
        if (candidate.length > 1) {
          title = candidate;
          break;
        }
      }
      if (title) break;
    }
    if (!title) {
      const pageTitle = document.querySelector('meta[property="og:title"]')?.content || document.title;
      title = clean(pageTitle.replace(/\s*-\s*LeetCode.*$/i, '')) || slug.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');
    }
    return { number, title: title.slice(0, 150) };
  }

  function findRoot() {
    for (const selector of SELECTORS) {
      for (const element of document.querySelectorAll(selector)) {
        if (visible(element) && textWithTables(element).length >= 40) return element;
      }
    }
    const main = document.querySelector('main, [role="main"]');
    if (!main) return null;
    let best = null;
    let bestScore = 0;
    for (const element of main.querySelectorAll('article, section, [role="article"], div')) {
      if (!visible(element)) continue;
      const text = textWithTables(element);
      if (text.length < 60 || text.length > 30000 || !/\b(example\s*\d+\s*:|constraints?\s*:|input\s*:|output\s*:|table\s*:|follow[-\s]?up\s*:)/i.test(text)) continue;
      const score = Number(/\bexample\s*\d+\s*:/i.test(text)) * 3 + Number(/\bconstraints?\s*:/i.test(text)) * 2
        + Number(/\btable\s*:/i.test(text)) * 3 + Number(/\binput\s*:/i.test(text)) + Number(/\boutput\s*:/i.test(text));
      if (score > bestScore || (score === bestScore && (!best || text.length < textWithTables(best).length))) {
        best = element;
        bestScore = score;
      }
    }
    return best;
  }

  function expand(root, tried) {
    for (const scope of [root, root && root.parentElement]) {
      if (!scope) continue;
      for (const control of scope.querySelectorAll('button, [role="button"]')) {
        if (tried.has(control) || !visible(control)) continue;
        const label = clean(control.getAttribute('aria-label') || textOf(control)).toLowerCase();
        if (/^(show more|see more|read more|expand description|show full description)$/.test(label)) {
          tried.add(control);
          control.click();
          return true;
        }
      }
    }
    return false;
  }

  function extractDifficulty() {
    for (const element of document.querySelectorAll('[data-difficulty], [diff], [data-cy*="difficulty"], [class*="difficulty"]')) {
      if (!visible(element)) continue;
      const value = clean(element.getAttribute('data-difficulty') || element.getAttribute('diff') || textOf(element));
      const match = value.match(/\b(Easy|Medium|Hard)\b/i);
      if (match) return match[1][0].toUpperCase() + match[1].slice(1).toLowerCase();
    }
    return '';
  }

  function extractTags() {
    const tags = [];
    for (const element of document.querySelectorAll('[data-cy="topic-tag"], [data-testid*="topic-tag"], a[href*="/tag/"]')) {
      const tag = textOf(element);
      if (visible(element) && tag && tag.length <= 80 && !tags.includes(tag)) tags.push(tag);
      if (tags.length === 20) break;
    }
    return tags;
  }

  function parseExamples(statement) {
    const markers = Array.from(statement.matchAll(/\bExample\s+(\d+)\s*:/gi));
    const examples = [];
    const sectionStop = /\n\s*(?:Constraints?\s*:|Follow[- ]?up\s*:|Note\s*:|Similar Questions\b)/i;
    const parseField = (block, name, nextFields) => {
      const next = nextFields.length ? '(?=\\s*(?:' + nextFields.join('|') + ')\\s*:|$)' : '$';
      const match = block.match(new RegExp('(?:^|\\n|\\s)' + name + '\\s*:\\s*([\\s\\S]*?)' + next, 'i'));
      return match ? clean(match[1]) : '';
    };
    for (let i = 0; i < markers.length; i++) {
      const start = markers[i].index + markers[i][0].length;
      let end = i + 1 < markers.length ? markers[i + 1].index : statement.length;
      const tail = statement.slice(start, end);
      const stop = tail.search(sectionStop);
      if (stop >= 0) end = start + stop;
      const block = statement.slice(start, end);
      const input = parseField(block, 'Input', ['Output', 'Explanation']);
      const output = parseField(block, 'Output', ['Explanation']);
      const explanation = parseField(block, 'Explanation', []);
      if (input && output) examples.push({ index: Number(markers[i][1]), input, output, explanation });
    }
    return examples;
  }

  function parseConstraints(statement) {
    const match = statement.match(/\bConstraints?\s*:\s*/i);
    if (!match) return [];
    const tail = statement.slice(match.index + match[0].length);
    const stop = tail.search(/\n\s*(?:Follow[- ]?up\s*:|Example\s+\d+\s*:|Note\s*:|Similar Questions\b)/i);
    const block = clean(stop >= 0 ? tail.slice(0, stop) : tail);
    return block.split(/\n+/).map((line) => clean(line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, ''))).filter(Boolean).slice(0, 80);
  }

  function pipeCells(line) {
    if (!/^\s*\|/.test(line) || /^\s*\|?[\s+:|-]+\|?\s*$/.test(line)) return [];
    return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => clean(cell));
  }
  const isType = (value) => /^(?:tinyint|smallint|mediumint|bigint|int|integer|decimal|numeric|float|double|real|char|varchar|text|date|datetime|timestamp|bool|boolean|bit|binary|varbinary|json)(?:\b|\()/i.test(value);

  function columnsFromRows(rows) {
    if (!rows.length) return [];
    const header = rows[0].map((value) => value.toLowerCase());
    if (header.some((value) => /column\s*name|column/.test(value)) && header.some((value) => /type/.test(value))) {
      return rows.slice(1).filter((row) => row.length >= 2 && row[0] && row[1]).map((row) => ({ name: row[0], type: row[1] }));
    }
    return rows.filter((row) => row.length >= 2 && row[0] && row[1] && isType(row[1])).map((row) => ({ name: row[0], type: row[1] }));
  }

  function extractSchema(root, statement) {
    const schema = [];
    const blocks = Array.from(statement.matchAll(/\bTable\s*:\s*([A-Za-z_][\w]*)/gi));
    for (let i = 0; i < blocks.length; i++) {
      const start = blocks[i].index + blocks[i][0].length;
      const end = i + 1 < blocks.length ? blocks[i + 1].index : statement.length;
      const tableText = statement.slice(start, end).split(/\n\s*(?:Example\s+\d+\s*:|Sample\s+Result\b)/i)[0];
      const columns = columnsFromRows(tableText.split('\n').map(pipeCells).filter((row) => row.length >= 2));
      if (columns.length) schema.push({ table: blocks[i][1], columns, notes: [] });
    }
    const names = blocks.map((item) => item[1]);
    let htmlIndex = 0;
    for (const table of root ? root.querySelectorAll('table') : []) {
      const rows = Array.from(table.querySelectorAll('tr')).map((row) => Array.from(row.querySelectorAll('th,td')).map((cell) => clean(cell.textContent))).filter((row) => row.length >= 2);
      const columns = columnsFromRows(rows);
      const name = names[htmlIndex] || 'Table ' + (htmlIndex + 1);
      htmlIndex++;
      if (columns.length && !schema.some((item) => item.table.toLowerCase() === name.toLowerCase())) schema.push({ table: name, columns, notes: [] });
    }
    return schema.filter((table, index, list) => list.findIndex((other) => other.table.toLowerCase() === table.table.toLowerCase()) === index);
  }

  function domCode() {
    const lines = document.querySelectorAll('.monaco-editor .view-lines .view-line');
    return Array.from(lines).sort((a, b) => parseFloat(a.style.top || '0') - parseFloat(b.style.top || '0'))
      .map((line) => (line.textContent || '').replace(/\u00a0/g, ' ')).join('\n').slice(0, MAX_CODE);
  }

  function getEditorState(requestId) {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).slice(2);
      const cleanup = () => { window.removeEventListener('message', onMessage); clearTimeout(timer); };
      const onMessage = (event) => {
        const data = event.data;
        if (event.source !== window || !data || data.source !== 'codemate-bridge' || data.id !== id || data.requestId !== requestId) return;
        cleanup();
        resolve({
          editorCode: clean(data.editorCode || domCode()).slice(0, MAX_CODE),
          starterCode: clean(data.starterCode || '').slice(0, MAX_CODE),
          editorLanguageLabel: data.editorLanguageLabel || '',
          editorLanguageKey: data.editorLanguageKey || '',
        });
      };
      const timer = setTimeout(() => {
        cleanup();
        resolve({ editorCode: domCode(), starterCode: '', editorLanguageLabel: '', editorLanguageKey: '' });
      }, 1400);
      window.addEventListener('message', onMessage);
      window.postMessage({ source: 'codemate-content', type: 'GET_CODE', id, requestId }, '*');
    });
  }

  async function getProblem(requestId) {
    const slug = slugFromUrl();
    if (!slug) return { ok: false, reason: 'NOT_PROBLEM', requestId };
    const deadline = Date.now() + 6000;
    const tried = new Set();
    let root = null;
    let rawStatement = '';
    while (Date.now() < deadline) {
      if (slugFromUrl() !== slug) return { ok: false, reason: 'PROBLEM_CHANGED', requestId };
      root = findRoot();
      if (root && expand(root, tried)) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }
      rawStatement = textWithTables(root);
      if (rawStatement.length >= 60) break;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    if (slugFromUrl() !== slug) return { ok: false, reason: 'PROBLEM_CHANGED', requestId };
    if (!rawStatement) return { ok: false, reason: 'NO_DESCRIPTION', requestId, slug };

    const title = extractTitle(slug);
    const examples = parseExamples(rawStatement);
    const constraints = parseConstraints(rawStatement);
    const schema = extractSchema(root, rawStatement);
    const tags = extractTags();
    const difficulty = extractDifficulty();
    const editor = await getEditorState(requestId);
    if (slugFromUrl() !== slug) return { ok: false, reason: 'PROBLEM_CHANGED', requestId };

    const database = ['mysql', 'postgresql', 'oraclesql', 'mssql'].includes(editor.editorLanguageKey)
      || schema.length > 0 || /\bTable\s*:\s*[A-Za-z_]/i.test(rawStatement);
    const missing = [];
    const statement = rawStatement.length <= MAX_STATEMENT ? rawStatement : '';
    const hasStatement = rawStatement.length >= 60 && statement.length >= 60;
    if (!hasStatement) missing.push(rawStatement.length > MAX_STATEMENT ? 'statement_too_long' : 'statement');
    if (!examples.length) missing.push('examples');
    if (database && !schema.length) missing.push('schema');
    const completeness = {
      hasStatement,
      exampleCount: examples.length,
      hasConstraints: constraints.length > 0,
      hasSchema: schema.length > 0,
      missing,
      statementLength: rawStatement.length,
    };

    if (previousPage && previousPage.slug !== slug && previousPage.statement === rawStatement) {
      completeness.missing.push('previous_problem_text');
    }
    const problem = {
      slug, number: title.number, title: title.title,
      url: location.origin + '/problems/' + slug + '/',
      difficulty, tags, statement, examples, constraints, schema,
      starterCode: editor.starterCode, editorCode: editor.editorCode,
      editorLanguageLabel: editor.editorLanguageLabel, editorLanguageKey: editor.editorLanguageKey,
      completeness,
    };
    if (!completeness.missing.length) previousPage = { slug, title: title.title, statement: rawStatement };
    return { ok: completeness.missing.length === 0, reason: completeness.missing.length ? 'INCOMPLETE_CONTEXT' : undefined, problem, requestId };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'GET_PROBLEM') return false;
    const requestId = message.requestId;
    getProblem(requestId).then(sendResponse).catch(() => sendResponse({ ok: false, reason: 'ERROR', requestId }));
    return true;
  });

  let lastSlug = slugFromUrl();
  setInterval(() => {
    const currentSlug = slugFromUrl();
    if (currentSlug !== lastSlug) {
      lastSlug = currentSlug;
      chrome.runtime.sendMessage({ type: 'PROBLEM_CHANGED', slug: currentSlug }).catch(() => {});
    }
  }, 500);
})();