/* CodeMate AI – DSA Visualizer Renderer
   SVG/HTML-based rendering for all DSA categories. */

(() => {
  const C = {
    current:  '#35d6c4',  // teal  – active pointer / current
    compare:  '#ffc45c',  // amber – being compared
    done:     '#4ade80',  // green – sorted/visited/found
    rejected: '#ff7a7a',  // red   – rejected/wrong path
    inactive: '#2b3550',  // dark  – default bar/box
    text:     '#e8ecf7',
    muted:    '#9aa6c4',
    surface:  '#1c2438',
    line:     '#2b3550',
    accent:   '#35d6c4',
    pivot:    '#c084fc',  // purple – pivot element
    slow:     '#38bdf8',  // blue  – slow pointer
    fast:     '#f97316',  // orange – fast pointer
  };

  /* ── Helpers ─────────────────────────────────────────────── */
  function svg(tag, attrs, children = []) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    for (const c of children) if (c) el.appendChild(c);
    return el;
  }
  function div(cls, innerHTML = '') {
    const d = document.createElement('div');
    d.className = cls; d.innerHTML = innerHTML; return d;
  }
  function colorFor(role) {
    return C[role] || C.inactive;
  }

  /* ── Array Renderer ──────────────────────────────────────── */
  function renderArray(container, step) {
    const { array = [], highlights = {} } = step.state;
    const n = array.length;
    if (!n) { container.innerHTML = '<p style="color:var(--muted)">Empty array</p>'; return; }
    const W = Math.max(36, Math.min(54, Math.floor((container.clientWidth - 20) / n)));
    const H = 52;
    const svgW = n * W + 10;
    const root = svg('svg', { viewBox: `0 0 ${svgW} ${H + 40}`, width: '100%', style: 'overflow:visible' });
    array.forEach((val, i) => {
      const role = highlights[i] || 'inactive';
      const fill = colorFor(role);
      const x = i * W + 5;
      root.appendChild(svg('rect', { x, y: 10, width: W - 4, height: H, rx: 6, fill, opacity: role === 'inactive' ? '0.55' : '1' }));
      root.appendChild(svg('text', { x: x + (W - 4) / 2, y: 10 + H / 2 + 5, 'text-anchor': 'middle', fill: role === 'inactive' ? C.muted : '#000', 'font-size': W > 40 ? '14' : '11', 'font-weight': '700', 'font-family': 'monospace' })).textContent = String(val);
      // index label
      root.appendChild(svg('text', { x: x + (W - 4) / 2, y: H + 26, 'text-anchor': 'middle', fill: C.muted, 'font-size': '10' })).textContent = String(i);
    });
    // pointer labels below
    const ptrs = {};
    for (const [name, idx] of Object.entries(step.highlights || {})) {
      if (typeof idx === 'number' && idx >= 0 && idx < n) {
        if (!ptrs[idx]) ptrs[idx] = [];
        ptrs[idx].push(name);
      }
    }
    let ptrY = H + 38;
    for (const [idx, names] of Object.entries(ptrs)) {
      const x = Number(idx) * W + 5 + (W - 4) / 2;
      const t = svg('text', { x, y: ptrY, 'text-anchor': 'middle', fill: C.accent, 'font-size': '10', 'font-weight': '600' });
      t.textContent = names.join('/');
      root.appendChild(t);
    }
    container.innerHTML = '';
    container.appendChild(root);
  }

  /* ── Bar Chart Renderer (Sorting) ────────────────────────── */
  function renderBars(container, step) {
    const { array = [], highlights = {} } = step.state;
    const n = array.length;
    if (!n) return;
    const maxVal = Math.max(...array, 1);
    const W = Math.max(14, Math.min(40, Math.floor((container.clientWidth - 20) / n)));
    const H = 120;
    const svgW = n * W + 10;
    const root = svg('svg', { viewBox: `0 0 ${svgW} ${H + 24}`, width: '100%' });
    array.forEach((val, i) => {
      const role = highlights[i] || 'inactive';
      const fill = colorFor(role);
      const barH = Math.max(4, Math.round((val / maxVal) * H));
      const x = i * W + 5;
      root.appendChild(svg('rect', { x, y: H - barH + 4, width: Math.max(W - 2, 2), height: barH, rx: 3, fill, opacity: role === 'inactive' ? '0.6' : '1' }));
      if (W >= 22) {
        const t = svg('text', { x: x + (W - 2) / 2, y: H - barH, 'text-anchor': 'middle', fill: C.muted, 'font-size': '9' });
        t.textContent = String(val);
        root.appendChild(t);
      }
    });
    container.innerHTML = '';
    container.appendChild(root);
  }

  /* ── Linked List Renderer ────────────────────────────────── */
  function renderLinkedList(container, step) {
    const { nodes = [], highlights = {} } = step.state;
    if (!nodes.length) { container.innerHTML = '<p style="color:var(--muted)">Empty list</p>'; return; }
    const NODE_W = 52, NODE_H = 36, GAP = 28, Y = 40;
    const totalW = nodes.length * (NODE_W + GAP) + GAP;
    const root = svg('svg', { viewBox: `0 0 ${totalW} ${Y + NODE_H + 30}`, width: '100%' });
    nodes.forEach((val, i) => {
      const role = highlights[i] || 'inactive';
      const fill = colorFor(role);
      const x = i * (NODE_W + GAP) + GAP / 2;
      root.appendChild(svg('rect', { x, y: Y, width: NODE_W, height: NODE_H, rx: 6, fill, opacity: role === 'inactive' ? '0.5' : '1' }));
      root.appendChild(svg('text', { x: x + NODE_W / 2, y: Y + NODE_H / 2 + 5, 'text-anchor': 'middle', fill: role === 'inactive' ? C.muted : '#000', 'font-size': '13', 'font-weight': '700' })).textContent = String(val);
      // arrow to next
      if (i < nodes.length - 1) {
        const ax = x + NODE_W, ay = Y + NODE_H / 2;
        const bx = ax + GAP, by = ay;
        root.appendChild(svg('line', { x1: ax, y1: ay, x2: bx - 4, y2: by, stroke: C.line, 'stroke-width': '2', 'marker-end': 'url(#arr)' }));
      } else {
        root.appendChild(svg('text', { x: x + NODE_W + 8, y: Y + NODE_H / 2 + 5, fill: C.muted, 'font-size': '12' })).textContent = '∅';
      }
    });
    // arrowhead marker
    const defs = svg('defs', {});
    const marker = svg('marker', { id: 'arr', markerWidth: '6', markerHeight: '6', refX: '3', refY: '3', orient: 'auto' });
    marker.appendChild(svg('path', { d: 'M0,0 L0,6 L6,3 z', fill: C.line }));
    defs.appendChild(marker);
    root.insertBefore(defs, root.firstChild);
    // pointer labels
    for (const [name, idx] of Object.entries(step.highlights || {})) {
      if (typeof idx === 'number' && idx >= 0 && idx < nodes.length) {
        const x = idx * (NODE_W + GAP) + GAP / 2 + NODE_W / 2;
        root.appendChild(svg('text', { x, y: Y - 8, 'text-anchor': 'middle', fill: C.accent, 'font-size': '10', 'font-weight': '600' })).textContent = name;
      }
    }
    container.innerHTML = '';
    container.appendChild(root);
  }

  /* ── Stack Renderer ──────────────────────────────────────── */
  function renderStack(container, step) {
    const { stack = [], highlights = {} } = step.state;
    const maxVis = 8;
    const items = stack.slice(-maxVis);
    const BOX_H = 34, BOX_W = 120;
    const H = items.length * BOX_H + 40;
    const root = svg('svg', { viewBox: `0 0 ${BOX_W + 60} ${H}`, width: Math.min(180, container.clientWidth) });
    // bottom line
    root.appendChild(svg('line', { x1: 10, y1: H - 8, x2: BOX_W + 10, y2: H - 8, stroke: C.line, 'stroke-width': '2' }));
    items.forEach((val, i) => {
      const stackIdx = stack.length - items.length + i;
      const role = highlights[stackIdx] || (i === items.length - 1 ? 'current' : 'inactive');
      const fill = colorFor(role);
      const y = H - 8 - (i + 1) * BOX_H;
      root.appendChild(svg('rect', { x: 10, y, width: BOX_W, height: BOX_H - 2, rx: 4, fill, opacity: role === 'inactive' ? '0.5' : '1' }));
      root.appendChild(svg('text', { x: 10 + BOX_W / 2, y: y + BOX_H / 2 + 4, 'text-anchor': 'middle', fill: role === 'inactive' ? C.muted : '#000', 'font-size': '13', 'font-weight': '600' })).textContent = String(val);
      if (i === items.length - 1) {
        root.appendChild(svg('text', { x: BOX_W + 16, y: y + BOX_H / 2 + 4, fill: C.accent, 'font-size': '11', 'font-weight': '700' })).textContent = '← top';
      }
    });
    if (!items.length) {
      root.appendChild(svg('text', { x: 10 + BOX_W / 2, y: H / 2, 'text-anchor': 'middle', fill: C.muted, 'font-size': '12' })).textContent = '(empty)';
    }
    container.innerHTML = '';
    container.appendChild(root);
  }

  /* ── DP Table Renderer ───────────────────────────────────── */
  function renderDPTable(container, step) {
    const { dp = [], highlights = {}, rowLabels = [], colLabels = [] } = step.state;
    if (!dp.length) return;
    const CELL = 36;
    const rows = dp.length, cols = Array.isArray(dp[0]) ? dp[0].length : 1;
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'overflow-x:auto;font-family:monospace;font-size:12px';
    const table = document.createElement('table');
    table.style.cssText = 'border-collapse:collapse;';
    // header row
    const thead = document.createElement('thead');
    const hrRow = document.createElement('tr');
    hrRow.appendChild(Object.assign(document.createElement('th'), { style: 'padding:4px;color:var(--muted)' }));
    for (let j = 0; j < cols; j++) {
      const th = document.createElement('th');
      th.style.cssText = `padding:4px 8px;color:var(--muted);min-width:${CELL}px;text-align:center`;
      th.textContent = colLabels[j] !== undefined ? String(colLabels[j]) : String(j);
      hrRow.appendChild(th);
    }
    thead.appendChild(hrRow); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for (let i = 0; i < rows; i++) {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.style.cssText = 'padding:4px 8px;color:var(--muted);text-align:right';
      th.textContent = rowLabels[i] !== undefined ? String(rowLabels[i]) : String(i);
      tr.appendChild(th);
      const rowVals = Array.isArray(dp[i]) ? dp[i] : [dp[i]];
      for (let j = 0; j < cols; j++) {
        const td = document.createElement('td');
        const key = `${i},${j}`;
        const role = highlights[key] || 'inactive';
        td.style.cssText = `padding:4px 8px;text-align:center;border:1px solid var(--line);border-radius:4px;background:${colorFor(role)};color:${role === 'inactive' ? 'var(--muted)' : '#000'};font-weight:${role !== 'inactive' ? '700' : '400'};transition:background 0.2s;min-width:${CELL}px`;
        td.textContent = rowVals[j] === undefined ? '·' : String(rowVals[j] === Infinity ? '∞' : rowVals[j]);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrapper.appendChild(table);
    container.innerHTML = '';
    container.appendChild(wrapper);
  }

  /* ── Tree Renderer ───────────────────────────────────────── */
  function renderTree(container, step) {
    const { nodes = [], edges = [], highlights = {} } = step.state;
    if (!nodes.length) { container.innerHTML = '<p style="color:var(--muted)">Empty tree</p>'; return; }
    // Compute positions via simple BFS layout
    const pos = {};
    const queue = [{ id: nodes[0].id, depth: 0, offset: 0 }];
    const depthCount = {}; const depthNext = {};
    nodes.forEach(n => { const d = n.depth || 0; depthCount[d] = (depthCount[d] || 0) + 1; depthNext[d] = 0; });
    const maxDepth = Math.max(...nodes.map(n => n.depth || 0));
    const H_STEP = 60, NODE_R = 18;
    const svgH = (maxDepth + 1) * H_STEP + NODE_R * 2 + 10;
    const svgW = Math.min(container.clientWidth || 340, 500);
    nodes.forEach(n => {
      const d = n.depth || 0;
      const count = depthCount[d] || 1;
      const idx = depthNext[d]++;
      pos[n.id] = { x: ((idx + 0.5) / count) * svgW, y: d * H_STEP + NODE_R + 10 };
    });
    const root = svg('svg', { viewBox: `0 0 ${svgW} ${svgH}`, width: '100%' });
    edges.forEach(([a, b]) => {
      if (pos[a] && pos[b]) {
        root.appendChild(svg('line', { x1: pos[a].x, y1: pos[a].y, x2: pos[b].x, y2: pos[b].y, stroke: C.line, 'stroke-width': '2' }));
      }
    });
    nodes.forEach(n => {
      if (!pos[n.id]) return;
      const { x, y } = pos[n.id];
      const role = highlights[n.id] || 'inactive';
      const fill = colorFor(role);
      root.appendChild(svg('circle', { cx: x, cy: y, r: NODE_R, fill, opacity: role === 'inactive' ? '0.5' : '1' }));
      root.appendChild(svg('text', { x, y: y + 5, 'text-anchor': 'middle', fill: role === 'inactive' ? C.muted : '#000', 'font-size': '12', 'font-weight': '700' })).textContent = String(n.val);
    });
    container.innerHTML = '';
    container.appendChild(root);
  }

  /* ── Graph Renderer ──────────────────────────────────────── */
  function renderGraph(container, step) {
    const { nodes = [], edges = [], highlights = {} } = step.state;
    if (!nodes.length) return;
    const svgW = container.clientWidth || 340, svgH = 200;
    const NODE_R = 18;
    // Circular layout
    const pos = {};
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      pos[n.id] = { x: svgW / 2 + (svgW / 2 - NODE_R - 10) * Math.cos(angle), y: svgH / 2 + (svgH / 2 - NODE_R - 10) * Math.sin(angle) };
    });
    const root = svg('svg', { viewBox: `0 0 ${svgW} ${svgH}`, width: '100%' });
    edges.forEach(([a, b, w]) => {
      if (!pos[a] || !pos[b]) return;
      root.appendChild(svg('line', { x1: pos[a].x, y1: pos[a].y, x2: pos[b].x, y2: pos[b].y, stroke: C.line, 'stroke-width': '2' }));
      if (w !== undefined) {
        const mx = (pos[a].x + pos[b].x) / 2, my = (pos[a].y + pos[b].y) / 2;
        const t = svg('text', { x: mx, y: my - 4, 'text-anchor': 'middle', fill: C.muted, 'font-size': '10' });
        t.textContent = String(w); root.appendChild(t);
      }
    });
    nodes.forEach(n => {
      const { x, y } = pos[n.id];
      const role = highlights[n.id] || 'inactive';
      const fill = colorFor(role);
      root.appendChild(svg('circle', { cx: x, cy: y, r: NODE_R, fill, opacity: role === 'inactive' ? '0.5' : '1' }));
      root.appendChild(svg('text', { x, y: y + 5, 'text-anchor': 'middle', fill: role === 'inactive' ? C.muted : '#000', 'font-size': '12', 'font-weight': '700' })).textContent = String(n.id);
    });
    container.innerHTML = '';
    container.appendChild(root);
  }

  /* ── Grid / 2D Array Renderer ────────────────────────────── */
  function renderGrid(container, step) {
    const { grid = [], highlights = {} } = step.state;
    if (!grid.length) return;
    const rows = grid.length, cols = grid[0].length;
    const CELL = Math.max(20, Math.min(36, Math.floor((container.clientWidth - 20) / cols)));
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:inline-flex;flex-direction:column;gap:2px;overflow-x:auto';
    for (let r = 0; r < rows; r++) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:2px';
      for (let c = 0; c < cols; c++) {
        const key = `${r},${c}`;
        const role = highlights[key] || 'inactive';
        const cell = document.createElement('div');
        cell.style.cssText = `width:${CELL}px;height:${CELL}px;display:flex;align-items:center;justify-content:center;border-radius:4px;background:${colorFor(role)};color:${role === 'inactive' ? 'var(--muted)' : '#000'};font-size:11px;font-weight:700;border:1px solid var(--line);opacity:${role === 'inactive' ? '0.55' : '1'}`;
        cell.textContent = String(grid[r][c]);
        row.appendChild(cell);
      }
      wrapper.appendChild(row);
    }
    container.innerHTML = '';
    container.appendChild(wrapper);
  }

  /* ── String / Characters Renderer ───────────────────────── */
  function renderString(container, step) {
    const { chars = [], highlights = {} } = step.state;
    if (!chars.length) return;
    const CHAR_W = 32;
    const svgW = chars.length * CHAR_W + 10;
    const root = svg('svg', { viewBox: `0 0 ${svgW} 60`, width: '100%' });
    chars.forEach((ch, i) => {
      const role = highlights[i] || 'inactive';
      const fill = colorFor(role);
      const x = i * CHAR_W + 5;
      root.appendChild(svg('rect', { x, y: 8, width: CHAR_W - 4, height: 32, rx: 5, fill, opacity: role === 'inactive' ? '0.5' : '1' }));
      root.appendChild(svg('text', { x: x + (CHAR_W - 4) / 2, y: 29, 'text-anchor': 'middle', fill: role === 'inactive' ? C.muted : '#000', 'font-size': '14', 'font-weight': '700' })).textContent = ch === ' ' ? '·' : ch;
      root.appendChild(svg('text', { x: x + (CHAR_W - 4) / 2, y: 52, 'text-anchor': 'middle', fill: C.muted, 'font-size': '9' })).textContent = String(i);
    });
    container.innerHTML = '';
    container.appendChild(root);
  }

  /* ── Variables / State Panel ─────────────────────────────── */
  function renderVars(container, vars = {}) {
    if (!Object.keys(vars).length) { container.innerHTML = ''; return; }
    const items = Object.entries(vars).map(([k, v]) => {
      const val = Array.isArray(v) ? '[' + v.join(', ') + ']' : String(v === undefined ? '—' : v === Infinity ? '∞' : v);
      return `<span class="viz-var"><span class="viz-var-name">${k}</span><span class="viz-var-val">${val}</span></span>`;
    }).join('');
    container.innerHTML = `<div class="viz-vars">${items}</div>`;
  }

  /* ── Main Dispatcher ─────────────────────────────────────── */
  function renderStep(vizContainer, step, category) {
    if (!step) return;
    const vis = vizContainer.querySelector('.viz-canvas');
    const msg = vizContainer.querySelector('.viz-message');
    const varsEl = vizContainer.querySelector('.viz-vars-panel');

    if (msg) msg.textContent = step.message || '';
    if (varsEl) renderVars(varsEl, step.state.vars || {});

    if (!vis) return;
    switch (category) {
      case 'bars':        return renderBars(vis, step);
      case 'linked-list': return renderLinkedList(vis, step);
      case 'stack':       return renderStack(vis, step);
      case 'dp':          return renderDPTable(vis, step);
      case 'tree':        return renderTree(vis, step);
      case 'graph':       return renderGraph(vis, step);
      case 'grid':        return renderGrid(vis, step);
      case 'string':      return renderString(vis, step);
      default:            return renderArray(vis, step);
    }
  }

  window.VizRenderer = { renderStep, renderArray, renderBars, renderLinkedList, renderStack, renderDPTable, renderTree, renderGraph, renderGrid, renderString, renderVars };
})();

