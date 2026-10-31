/* CodeMate AI – Linked List Algorithms */
(() => {
  /* ── Reverse Linked List (LeetCode 206) ── */
  function reverseList(input, rec) {
    const raw = input.head || input.nums || input.array || [1, 2, 3, 4, 5];
    const nodes = raw.slice();
    const n = nodes.length;
    rec.record({ nodes: nodes.slice(), highlights: {}, actualOutput: nodes.slice().reverse() }, 'init', `Reverse Linked List: ${nodes.join(' → ')} → null`);
    if (!n) {
      rec.record({ nodes: [], highlights: {}, actualOutput: [] }, 'done', 'Empty list → null');
      return;
    }
    let prev = -1, curr = 0;
    while (curr < n) {
      const h = {};
      if (prev >= 0) h[prev] = 'done';
      h[curr] = 'current';
      if (curr + 1 < n) h[curr + 1] = 'compare';
      rec.record({ nodes: nodes.slice(), highlights: h, vars: { currVal: nodes[curr], prevVal: prev < 0 ? 'null' : nodes[prev], nextVal: curr + 1 < n ? nodes[curr + 1] : 'null' } }, 'step', `curr = node(${nodes[curr]}), prev = ${prev < 0 ? 'null' : `node(${nodes[prev]})`}`);
      prev = curr;
      curr++;
    }
    const reversed = nodes.slice().reverse();
    const allDone = {};
    reversed.forEach((_, i) => allDone[i] = 'done');
    rec.record({ nodes: reversed, highlights: allDone, actualOutput: reversed.slice() }, 'done', `Reversed: ${reversed.join(' → ')} → null`);
  }

  /* ── Detect Cycle – Floyd's Algorithm (LeetCode 141) ── */
  function detectCycle(input, rec) {
    const raw = input.head || input.nums || input.array || [3, 2, 0, -4];
    const nodes = raw.slice();
    const cycleAt = input.pos !== undefined ? Number(input.pos) : (input.cycleAt !== undefined ? Number(input.cycleAt) : -1);
    const hasCycle = cycleAt >= 0 && cycleAt < nodes.length;

    rec.record({
      nodes: nodes.slice(),
      highlights: { 0: 'slow' },
      vars: { head: nodes[0], pos: cycleAt, hasCycle }
    }, 'init', `Cycle Detection (Floyd's Fast & Slow Pointers): [${nodes.join(' → ')}]${hasCycle ? ` (tail connects to index ${cycleAt})` : ' (no cycle, pos = -1)'}`);

    if (!nodes.length) {
      rec.record({ nodes: [], highlights: {}, actualOutput: false }, 'done', 'Empty list → false');
      return;
    }

    let slow = 0, fast = 0;
    for (let step = 0; step < nodes.length * 3 + 4; step++) {
      const h = {};
      h[slow] = 'slow';
      if (fast < nodes.length) {
        h[fast] = h[fast] === 'slow' ? 'done' : 'fast';
      }
      rec.record({
        nodes: nodes.slice(),
        highlights: h,
        vars: { step, slowIndex: slow, slowVal: nodes[slow], fastIndex: fast < nodes.length ? fast : 'end', fastVal: fast < nodes.length ? nodes[fast] : 'null' }
      }, 'move', `Step ${step + 1}: slow at index ${slow} (${nodes[slow]}), fast at index ${fast < nodes.length ? fast : 'end'} (${fast < nodes.length ? nodes[fast] : 'null'})`);

      if (hasCycle) {
        slow = (slow + 1 < nodes.length) ? slow + 1 : cycleAt;
        fast = (fast + 1 < nodes.length) ? fast + 1 : cycleAt;
        fast = (fast + 1 < nodes.length) ? fast + 1 : cycleAt;
        if (slow === fast) {
          rec.record({
            nodes: nodes.slice(),
            highlights: { [slow]: 'done' },
            vars: { meetingIndex: slow, meetingVal: nodes[slow], result: true },
            actualOutput: true
          }, 'found', `Cycle detected! Slow and fast pointers meet at node index ${slow} (value: ${nodes[slow]}).`);
          return;
        }
      } else {
        slow++;
        fast += 2;
        if (fast >= nodes.length) {
          rec.record({
            nodes: nodes.slice(),
            highlights: {},
            vars: { result: false },
            actualOutput: false
          }, 'done', `Fast pointer reached null (end of list) → No cycle detected (returns false).`);
          return;
        }
      }
    }
    rec.record({ nodes: nodes.slice(), highlights: {}, actualOutput: false }, 'done', 'No cycle detected.');
  }

  /* ── Find Middle of Linked List (LeetCode 876) ── */
  function middleNode(input, rec) {
    const raw = input.head || input.nums || input.array || [1, 2, 3, 4, 5];
    const nodes = raw.slice();
    let slow = 0, fast = 0;
    rec.record({ nodes: nodes.slice(), highlights: { 0: 'slow' }, vars: { slow: 0, fast: 0 } }, 'init', `Middle of Linked List: [${nodes.join(' → ')}]`);
    while (fast < nodes.length - 1 && fast + 1 < nodes.length - 1) {
      const h = {}; h[slow] = 'slow'; h[fast] = 'fast';
      rec.record({ nodes: nodes.slice(), highlights: h, vars: { slow, fast, slowVal: nodes[slow], fastVal: nodes[fast] } }, 'move', `slow = ${slow} (${nodes[slow]}), fast = ${fast} (${nodes[fast]})`);
      slow++; fast += 2;
    }
    if (fast + 1 === nodes.length - 1) fast++;
    const hf = {}; hf[slow] = 'done'; hf[fast] = 'fast';
    const midPortion = nodes.slice(slow);
    rec.record({ nodes: nodes.slice(), highlights: hf, vars: { middleIndex: slow, middleVal: nodes[slow], resultList: `[${midPortion.join(' → ')}]` }, actualOutput: midPortion }, 'done', `Middle node found at index ${slow} (value = ${nodes[slow]}). Sublist from middle: [${midPortion.join(' → ')}]`);
  }

  /* ── Merge Two Sorted Lists (LeetCode 21) ── */
  function mergeTwoLists(input, rec) {
    const raw1 = input.list1 || input.l1 || input.array || [1, 2, 4];
    const raw2 = input.list2 || input.l2 || input.target_array || [1, 3, 4];
    const l1 = raw1.slice().sort((a, b) => a - b);
    const l2 = raw2.slice().sort((a, b) => a - b);
    const merged = [];
    let i = 0, j = 0;
    rec.record({ nodes: [...l1, ...l2], vars: { list1: `[${l1.join(' → ')}]`, list2: `[${l2.join(' → ')}]`, merged: '[]' } }, 'init', `Merge two sorted lists: [${l1.join(' → ')}] and [${l2.join(' → ')}]`);
    while (i < l1.length && j < l2.length) {
      const h = {};
      l1.forEach((_, k) => h[k] = k === i ? 'current' : 'inactive');
      l2.forEach((_, k) => h[l1.length + k] = k === j ? 'compare' : 'inactive');
      rec.record({ nodes: [...l1, ...l2], highlights: h, vars: { l1val: l1[i], l2val: l2[j], merged: `[${merged.join(' → ')}]` } }, 'compare', `Compare list1[${i}]=${l1[i]} and list2[${j}]=${l2[j]}`);
      if (l1[i] <= l2[j]) { merged.push(l1[i++]); } else { merged.push(l2[j++]); }
      rec.record({ nodes: merged.slice(), highlights: { [merged.length - 1]: 'done' }, vars: { merged: `[${merged.join(' → ')}]` } }, 'pick', `Pick smaller value ${merged[merged.length - 1]} → merged = [${merged.join(' → ')}]`);
    }
    while (i < l1.length) {
      merged.push(l1[i++]);
      rec.record({ nodes: merged.slice(), highlights: { [merged.length - 1]: 'done' }, vars: { merged: `[${merged.join(' → ')}]` } }, 'append', `Append remaining node from list1`);
    }
    while (j < l2.length) {
      merged.push(l2[j++]);
      rec.record({ nodes: merged.slice(), highlights: { [merged.length - 1]: 'done' }, vars: { merged: `[${merged.join(' → ')}]` } }, 'append', `Append remaining node from list2`);
    }
    const allDone = {};
    merged.forEach((_, k) => allDone[k] = 'done');
    rec.record({ nodes: merged, highlights: allDone, vars: { result: `[${merged.join(' → ')}]` }, actualOutput: merged.slice() }, 'done', `Merged sorted list: [${merged.join(' → ')}]`);
  }

  window.VizAlgoLinkedList = { reverseList, detectCycle, middleNode, mergeTwoLists };
})();
