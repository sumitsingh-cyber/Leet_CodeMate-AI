/* CodeMate AI – Linked List Algorithms */
(() => {
  function makeNodes(arr) { return arr.slice(); } // values array

  /* ── Reverse Linked List – Iterative ── */
  function reverseList(input, rec) {
    const nodes = input.array.slice();
    const n = nodes.length;
    rec.record({ nodes: nodes.slice(), highlights: {} }, 'init', `Reverse Linked List: ${nodes.join(' → ')} → null`);
    let prev = -1, curr = 0;
    while (curr < n) {
      const h = {}; if (prev >= 0) h[prev] = 'done'; h[curr] = 'current'; if (curr + 1 < n) h[curr + 1] = 'compare';
      rec.record({ nodes: nodes.slice(), highlights: h }, 'step', `curr=${curr}(${nodes[curr]}), prev=${prev < 0 ? 'null' : nodes[prev]}`);
      prev = curr; curr++;
    }
    const reversed = nodes.slice().reverse();
    const allDone = {}; reversed.forEach((_, i) => allDone[i] = 'done');
    rec.record({ nodes: reversed, highlights: allDone }, 'done', `Reversed: ${reversed.join(' → ')} → null`);
  }

  /* ── Detect Cycle – Floyd's Algorithm ── */
  function detectCycle(input, rec) {
    const nodes = input.array.slice();
    const cycleAt = input.cycleAt !== undefined ? input.cycleAt : -1;
    rec.record({ nodes: nodes.slice(), highlights: {} }, 'init', `Cycle Detection (Floyd's): [${nodes}]${cycleAt >= 0 ? ` (cycle at index ${cycleAt})` : ' (no cycle)'}`);
    let slow = 0, fast = 0;
    const visited = new Set();
    for (let step = 0; step < nodes.length * 2 + 2; step++) {
      const h = {};
      h[slow] = 'slow'; if (fast < nodes.length) h[fast] = h[fast] === 'slow' ? 'done' : 'fast';
      rec.record({ nodes: nodes.slice(), highlights: h }, 'move', `slow=${slow}(${nodes[slow]}), fast=${fast < nodes.length ? nodes[fast] : '?'}`);
      if (cycleAt >= 0) {
        slow = (slow + 1 < nodes.length) ? slow + 1 : cycleAt;
        fast = (fast + 1 < nodes.length) ? fast + 1 : cycleAt;
        fast = (fast + 1 < nodes.length) ? fast + 1 : cycleAt;
        if (slow === fast) {
          rec.record({ nodes: nodes.slice(), highlights: { [slow]: 'done' } }, 'found', `Cycle detected! slow and fast meet at index ${slow}`);
          return;
        }
      } else {
        slow++; fast += 2;
        if (fast >= nodes.length) {
          rec.record({ nodes: nodes.slice(), highlights: {} }, 'done', `fast reached end → No cycle detected`);
          return;
        }
      }
    }
    rec.record({ nodes: nodes.slice(), highlights: {} }, 'done', `No cycle detected (exhausted steps).`);
  }

  /* ── Find Middle of Linked List – Fast/Slow ── */
  function middleNode(input, rec) {
    const nodes = input.array.slice();
    let slow = 0, fast = 0;
    rec.record({ nodes: nodes.slice(), highlights: { 0: 'slow' } }, 'init', `Middle of Linked List: [${nodes}]`);
    while (fast < nodes.length - 1 && fast + 1 < nodes.length - 1) {
      const h = {}; h[slow] = 'slow'; h[fast] = 'fast';
      rec.record({ nodes: nodes.slice(), highlights: h }, 'move', `slow=${slow}(${nodes[slow]}), fast=${fast}(${nodes[fast]})`);
      slow++; fast += 2;
    }
    if (fast + 1 === nodes.length - 1) fast++;
    const hf = {}; hf[slow] = 'done'; hf[fast] = 'fast';
    rec.record({ nodes: nodes.slice(), highlights: hf }, 'done', `Middle node: index ${slow}, value=${nodes[slow]}`);
  }

  /* ── Merge Two Sorted Lists ── */
  function mergeTwoLists(input, rec) {
    const l1 = input.array.slice().sort((a, b) => a - b);
    const l2 = input.target_array ? input.target_array.slice().sort((a, b) => a - b) : [2, 4, 6];
    const merged = [];
    let i = 0, j = 0;
    rec.record({ nodes: [...l1, ...l2], vars: { l1: `[${l1}]`, l2: `[${l2}]`, merged: '[]' } }, 'init', `Merge two sorted lists: [${l1}] and [${l2}]`);
    while (i < l1.length && j < l2.length) {
      const h = {}; l1.forEach((_, k) => h[k] = k === i ? 'current' : 'inactive'); l2.forEach((_, k) => h[l1.length + k] = k === j ? 'compare' : 'inactive');
      rec.record({ nodes: [...l1, ...l2], highlights: h, vars: { l1val: l1[i], l2val: l2[j], merged: `[${merged}]` } }, 'compare', `Compare l1[${i}]=${l1[i]} and l2[${j}]=${l2[j]}`);
      if (l1[i] <= l2[j]) { merged.push(l1[i++]); } else { merged.push(l2[j++]); }
      rec.record({ nodes: merged.slice(), highlights: { [merged.length - 1]: 'done' }, vars: { merged: `[${merged}]` } }, 'pick', `Pick ${merged[merged.length-1]} → merged=[${merged}]`);
    }
    while (i < l1.length) { merged.push(l1[i++]); rec.record({ nodes: merged.slice(), highlights: { [merged.length-1]: 'done' }, vars: { merged: `[${merged}]` } }, 'append', `Append remaining from l1`); }
    while (j < l2.length) { merged.push(l2[j++]); rec.record({ nodes: merged.slice(), highlights: { [merged.length-1]: 'done' }, vars: { merged: `[${merged}]` } }, 'append', `Append remaining from l2`); }
    const allDone = {}; merged.forEach((_, k) => allDone[k] = 'done');
    rec.record({ nodes: merged, highlights: allDone, vars: { result: `[${merged}]` } }, 'done', `Merged sorted list: [${merged}]`);
  }

  window.VizAlgoLinkedList = { reverseList, detectCycle, middleNode, mergeTwoLists };
})();

