/* CodeMate AI – Tree, Graph, DP, Hashing, Greedy, Bit Algorithms */
(() => {
  /* ════════════ TREES ════════════ */

  function buildTreeNodes(arr) {
    const nodes = [], edges = [];
    if (!Array.isArray(arr) || !arr.length) return { nodes, edges };
    const valid = arr.filter(v => v !== null && v !== undefined);
    if (!valid.length) return { nodes, edges };
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === null || arr[i] === undefined) continue;
      nodes.push({ id: i, val: arr[i], depth: Math.floor(Math.log2(i + 1)) });
      const lc = 2 * i + 1, rc = 2 * i + 2;
      if (lc < arr.length && arr[lc] !== null && arr[lc] !== undefined) edges.push([i, lc]);
      if (rc < arr.length && arr[rc] !== null && arr[rc] !== undefined) edges.push([i, rc]);
    }
    return { nodes, edges };
  }

  /* ── Binary Tree Inorder Traversal (LeetCode 94) ── */
  function inorderTraversal(input, rec) {
    const raw = input.root !== undefined ? input.root : (input.tree || [4, 2, 6, 1, 3, 5, 7]);
    const treeArr = Array.isArray(raw) ? raw : [4, 2, 6, 1, 3, 5, 7];
    const { nodes, edges } = buildTreeNodes(treeArr);
    const result = [];
    rec.record({ nodes: nodes.slice(), edges, highlights: {}, vars: { treeArray: `[${treeArr.join(', ')}]` } }, 'init', `Inorder Traversal (Left → Root → Right)`);

    function inorder(i) {
      if (i >= treeArr.length || treeArr[i] === null || treeArr[i] === undefined) return;
      inorder(2 * i + 1);
      const h = {}; h[i] = 'current';
      rec.record({ nodes: nodes.slice(), edges, highlights: h, vars: { visiting: treeArr[i], nodeIndex: i } }, 'visit', `Visit node value ${treeArr[i]}`);
      result.push(treeArr[i]);
      h[i] = 'done';
      rec.record({ nodes: nodes.slice(), edges, highlights: { ...h }, vars: { visitedList: `[${result.join(', ')}]` } }, 'done_node', `Added ${treeArr[i]}. Traversal so far: [${result.join(', ')}]`);
      inorder(2 * i + 2);
    }

    inorder(0);
    const allDone = {}; nodes.forEach(n => allDone[n.id] = 'done');
    rec.record({ nodes: nodes.slice(), edges, highlights: allDone, vars: { inorderResult: `[${result.join(', ')}]` }, actualOutput: result.slice() }, 'done', `Inorder Traversal: [${result.join(', ')}]`);
  }

  /* ── Binary Tree Level Order Traversal (LeetCode 102) ── */
  function levelOrderTraversal(input, rec) {
    const raw = input.root !== undefined ? input.root : (input.tree || [3, 9, 20, null, null, 15, 7]);
    const treeArr = Array.isArray(raw) ? raw : [3, 9, 20, null, null, 15, 7];
    const { nodes, edges } = buildTreeNodes(treeArr);
    const result = [];
    if (!treeArr.length || treeArr[0] === null || treeArr[0] === undefined) {
      rec.record({ nodes: [], edges: [], vars: { result: '[]' }, actualOutput: [] }, 'done', 'Empty tree → []');
      return;
    }
    const queue = [0];
    rec.record({ nodes: nodes.slice(), edges, highlights: { 0: 'current' }, vars: { root: treeArr[0], queue: `[${treeArr[0]}]` } }, 'init', `Level Order Traversal (BFS queue)`);

    while (queue.length) {
      const levelSize = queue.length;
      const level = [];
      for (let k = 0; k < levelSize; k++) {
        const i = queue.shift();
        if (i >= treeArr.length || treeArr[i] === null || treeArr[i] === undefined) continue;
        level.push(treeArr[i]);
        const h = {}; h[i] = 'current'; queue.forEach(qi => { h[qi] = 'compare'; });
        rec.record({ nodes: nodes.slice(), edges, highlights: h, vars: { processingNode: treeArr[i], currentLevel: `[${level.join(', ')}]`, remainingQueue: queue.length } }, 'dequeue', `Dequeue node ${treeArr[i]}`);
        const lc = 2 * i + 1, rc = 2 * i + 2;
        if (lc < treeArr.length && treeArr[lc] !== null && treeArr[lc] !== undefined) {
          queue.push(lc);
          h[lc] = 'compare';
          rec.record({ nodes: nodes.slice(), edges, highlights: { ...h }, vars: { enqueueChild: treeArr[lc] } }, 'enqueue', `Enqueue left child ${treeArr[lc]}`);
        }
        if (rc < treeArr.length && treeArr[rc] !== null && treeArr[rc] !== undefined) {
          queue.push(rc);
          h[rc] = 'compare';
          rec.record({ nodes: nodes.slice(), edges, highlights: { ...h }, vars: { enqueueChild: treeArr[rc] } }, 'enqueue', `Enqueue right child ${treeArr[rc]}`);
        }
        h[i] = 'done';
      }
      result.push(level);
      rec.record({ nodes: nodes.slice(), edges, highlights: {}, vars: { completedLevel: `[${level.join(', ')}]`, totalLevels: result.length } }, 'level', `Completed level: [${level.join(', ')}]`);
    }

    const allDone = {}; nodes.forEach(n => allDone[n.id] = 'done');
    rec.record({ nodes: nodes.slice(), edges, highlights: allDone, vars: { result: JSON.stringify(result) }, actualOutput: result }, 'done', `Level Order Traversal: ${JSON.stringify(result)}`);
  }

  /* ════════════ GRAPHS ════════════ */

  function bfsGraph(input, rec) {
    const n = input.n || 6;
    const edgeList = input.edges || [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]];
    const adj = Array.from({ length: n }, () => []);
    edgeList.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u); });
    const nodes = Array.from({ length: n }, (_, i) => ({ id: i }));
    const graphEdges = edgeList.map(([u, v]) => [u, v]);
    const visited = new Array(n).fill(false);
    const queue = [0]; visited[0] = true;
    const order = [];
    rec.record({ nodes, edges: graphEdges, highlights: { 0: 'current' } }, 'init', `BFS from node 0 in graph of ${n} nodes`);
    while (queue.length) {
      const u = queue.shift(); order.push(u);
      const h = {}; order.forEach(x => h[x] = 'done'); queue.forEach(x => h[x] = 'compare'); h[u] = 'current';
      rec.record({ nodes, edges: graphEdges, highlights: h, vars: { visiting: u, queue: `[${queue.join(', ')}]`, visited: `[${order.join(', ')}]` } }, 'visit', `Visit node ${u}`);
      for (const v of adj[u]) {
        if (!visited[v]) {
          visited[v] = true; queue.push(v);
          const h2 = { ...h, [v]: 'compare' };
          rec.record({ nodes, edges: graphEdges, highlights: h2, vars: { enqueue: v, queue: `[${queue.join(', ')}]` } }, 'enqueue', `Enqueue neighbor ${v}`);
        }
      }
    }
    const allDone = {}; nodes.forEach(nd => allDone[nd.id] = 'done');
    rec.record({ nodes, edges: graphEdges, highlights: allDone, vars: { order: `[${order.join(', ')}]` }, actualOutput: order.slice() }, 'done', `BFS order: [${order.join(', ')}]`);
  }

  function dfsGraph(input, rec) {
    const n = input.n || 6;
    const edgeList = input.edges || [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]];
    const adj = Array.from({ length: n }, () => []);
    edgeList.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u); });
    const nodes = Array.from({ length: n }, (_, i) => ({ id: i }));
    const graphEdges = edgeList.map(([u, v]) => [u, v]);
    const visited = new Array(n).fill(false);
    const order = [], stack = [];
    rec.record({ nodes, edges: graphEdges, highlights: {} }, 'init', `DFS from node 0 in graph of ${n} nodes`);
    function dfs(u) {
      visited[u] = true; order.push(u); stack.push(u);
      const h = {}; order.forEach(x => h[x] = 'done'); stack.forEach(x => h[x] = 'compare'); h[u] = 'current';
      rec.record({ nodes, edges: graphEdges, highlights: h, vars: { visiting: u, callStack: `[${stack.join(', ')}]`, visited: `[${order.join(', ')}]` } }, 'visit', `Visit node ${u}`);
      for (const v of adj[u]) {
        if (!visited[v]) {
          const h2 = { ...h, [v]: 'compare' };
          rec.record({ nodes, edges: graphEdges, highlights: h2, vars: { exploreEdge: `${u} → ${v}` } }, 'explore', `Explore edge ${u} → ${v}`);
          dfs(v);
        }
      }
      stack.pop();
    }
    dfs(0);
    const allDone = {}; nodes.forEach(nd => allDone[nd.id] = 'done');
    rec.record({ nodes, edges: graphEdges, highlights: allDone, vars: { order: `[${order.join(', ')}]` }, actualOutput: order.slice() }, 'done', `DFS order: [${order.join(', ')}]`);
  }

  /* ── Number of Islands (LeetCode 200) ── */
  function numberOfIslands(input, rec) {
    const raw = input.grid || [
      ['1', '1', '1', '1', '0'],
      ['1', '1', '0', '1', '0'],
      ['1', '1', '0', '0', '0'],
      ['0', '0', '0', '0', '0']
    ];
    const g = raw.map(r => r.slice());
    const rows = g.length, cols = g[0]?.length || 0;
    let islands = 0;
    rec.record({ grid: g.map(r => r.slice()), highlights: {}, vars: { gridDimensions: `${rows}×${cols}`, islandsFound: 0 } }, 'init', `Number of Islands (Grid DFS traversal). Dimensions: ${rows}×${cols}`);

    function dfs(r, c) {
      if (r < 0 || r >= rows || c < 0 || c >= cols || g[r][c] !== '1') return;
      g[r][c] = '0';
      const h = {}; h[`${r},${c}`] = 'done';
      rec.record({ grid: g.map(row => row.slice()), highlights: h, vars: { sinkingLand: `(${r}, ${c})`, islandsFound: islands } }, 'sink', `Sink connected land at (${r}, ${c}) → convert '1' to '0'`);
      dfs(r + 1, c);
      dfs(r - 1, c);
      dfs(r, c + 1);
      dfs(r, c - 1);
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (g[r][c] === '1') {
          islands++;
          const h = {}; h[`${r},${c}`] = 'current';
          rec.record({ grid: g.map(row => row.slice()), highlights: h, vars: { foundIsland: `#${islands}`, coordinates: `(${r}, ${c})`, totalIslands: islands } }, 'island', `Found new unvisited island #${islands} at (${r}, ${c})! Triggering DFS to sink entire island.`);
          dfs(r, c);
        }
      }
    }

    rec.record({ grid: g.map(r => r.slice()), vars: { totalIslands: islands }, actualOutput: islands }, 'done', `Finished scanning grid! Total islands found = ${islands}.`);
  }

  /* ════════════ DYNAMIC PROGRAMMING ════════════ */

  /* ── Climbing Stairs (LeetCode 70) ── */
  function climbingStairs(input, rec) {
    const raw = input.n !== undefined ? input.n : 3;
    const n = Math.max(1, Math.min(Number(raw) || 3, 20));
    const dp = new Array(n + 1).fill(0);
    dp[0] = 1;
    dp[1] = 1;
    rec.record({
      dp: [dp.slice()],
      colLabels: Array.from({ length: n + 1 }, (_, i) => i),
      rowLabels: ['ways'],
      highlights: { '0,0': 'done', '0,1': 'done' },
      vars: { n, 'dp[0]': 1, 'dp[1]': 1 }
    }, 'init', `Climbing Stairs: n = ${n}. Base cases: dp[0] = 1, dp[1] = 1`);

    for (let i = 2; i <= n; i++) {
      dp[i] = dp[i - 1] + dp[i - 2];
      const h = {}; h[`0,${i}`] = 'current'; h[`0,${i-1}`] = 'compare'; h[`0,${i-2}`] = 'compare';
      rec.record({
        dp: [dp.slice()],
        colLabels: Array.from({ length: n + 1 }, (_, k) => k),
        rowLabels: ['ways'],
        highlights: h,
        vars: { step: i, 'dp[i]': dp[i], formula: `dp[${i-1}] + dp[${i-2}] = ${dp[i-1]} + ${dp[i-2]}` }
      }, 'compute', `Step ${i}: dp[${i}] = dp[${i-1}] + dp[${i-2}] = ${dp[i-1]} + ${dp[i-2]} = ${dp[i]}`);
    }

    const hFinal = {}; hFinal[`0,${n}`] = 'done';
    rec.record({
      dp: [dp.slice()],
      colLabels: Array.from({ length: n + 1 }, (_, i) => i),
      rowLabels: ['ways'],
      highlights: hFinal,
      vars: { result: dp[n], totalWays: dp[n] },
      actualOutput: dp[n]
    }, 'done', `Distinct ways to climb ${n} stairs = ${dp[n]} (returns ${dp[n]}).`);
  }

  /* ── Coin Change (LeetCode 322) ── */
  function coinChange(input, rec) {
    const coins = (input.coins || [1, 2, 5]).slice().sort((a, b) => a - b);
    const amount = input.amount !== undefined ? Number(input.amount) : 11;
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    rec.record({
      dp: [dp.slice()],
      highlights: { '0,0': 'done' },
      colLabels: Array.from({ length: amount + 1 }, (_, i) => i),
      rowLabels: ['min_coins'],
      vars: { coins: `[${coins.join(', ')}]`, amount, 'dp[0]': 0 }
    }, 'init', `Coin Change: coins = [${coins.join(', ')}], target amount = ${amount}`);

    for (let i = 1; i <= amount; i++) {
      for (const c of coins) {
        if (c <= i && dp[i - c] !== Infinity && dp[i - c] + 1 < dp[i]) {
          dp[i] = dp[i - c] + 1;
        }
      }
      const h = {}; h[`0,${i}`] = 'current';
      rec.record({
        dp: [dp.slice()],
        highlights: h,
        colLabels: Array.from({ length: amount + 1 }, (_, k) => k),
        rowLabels: ['min_coins'],
        vars: { amount: i, minCoins: dp[i] === Infinity ? '∞' : dp[i] }
      }, 'compute', `dp[${i}] = ${dp[i] === Infinity ? '∞' : dp[i]} (minimum coins to make ${i})`);
    }

    const result = dp[amount] === Infinity ? -1 : dp[amount];
    const resultH = {}; resultH[`0,${amount}`] = result === -1 ? 'rejected' : 'done';
    rec.record({
      dp: [dp.slice()],
      highlights: resultH,
      colLabels: Array.from({ length: amount + 1 }, (_, i) => i),
      rowLabels: ['min_coins'],
      vars: { result, targetAmount: amount },
      actualOutput: result
    }, 'done', result === -1 ? `Cannot make target amount ${amount} with coins [${coins.join(', ')}] → returns -1` : `Minimum coins required for amount ${amount} = ${result}.`);
  }

  /* ── Longest Common Subsequence (LeetCode 1143) ── */
  function longestCommonSubsequence(input, rec) {
    const s1 = String(input.text1 !== undefined ? input.text1 : (input.string || 'ABCBDAB'));
    const s2 = String(input.text2 !== undefined ? input.text2 : (input.target || 'BDCAB'));
    const m = s1.length, n2 = s2.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n2 + 1).fill(0));
    const rLabels = [' ', ...s1.split('')], cLabels = [' ', ...s2.split('')];
    rec.record({ dp: dp.map(r => r.slice()), colLabels: cLabels, rowLabels: rLabels, highlights: {} }, 'init', `LCS: text1 = "${s1}", text2 = "${s2}"`);

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n2; j++) {
        const h = {}; h[`${i},${j}`] = 'current';
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
          h[`${i-1},${j-1}`] = 'compare';
          rec.record({ dp: dp.map(r => r.slice()), colLabels: cLabels, rowLabels: rLabels, highlights: h, vars: { matchChar: s1[i-1], value: dp[i][j] } }, 'match', `Match '${s1[i-1]}': dp[${i}][${j}] = dp[${i-1}][${j-1}] + 1 = ${dp[i][j]}`);
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          h[`${i-1},${j}`] = 'compare'; h[`${i},${j-1}`] = 'compare';
          rec.record({ dp: dp.map(r => r.slice()), colLabels: cLabels, rowLabels: rLabels, highlights: h, vars: { maxFrom: `max(${dp[i-1][j]}, ${dp[i][j-1]})`, value: dp[i][j] } }, 'no_match', `No match: dp[${i}][${j}] = max(top, left) = ${dp[i][j]}`);
        }
      }
    }
    const hf = {}; hf[`${m},${n2}`] = 'done';
    rec.record({ dp: dp.map(r => r.slice()), colLabels: cLabels, rowLabels: rLabels, highlights: hf, vars: { LCS_length: dp[m][n2] }, actualOutput: dp[m][n2] }, 'done', `LCS length = ${dp[m][n2]}.`);
  }

  /* ════════════ HASHING ════════════ */

  function groupAnagrams(input, rec) {
    const raw = input.strs || input.words || ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'];
    const words = raw.slice();
    const map = {};
    rec.record({ array: words, vars: { wordsCount: words.length } }, 'init', `Group Anagrams: [${words.map(w => `"${w}"`).join(', ')}]`);
    for (let i = 0; i < words.length; i++) {
      const key = words[i].split('').sort().join('');
      if (!map[key]) map[key] = [];
      map[key].push(words[i]);
      rec.record({ array: words, highlights: { [i]: 'current' }, vars: { word: words[i], sortedKey: key, totalGroups: Object.keys(map).length } }, 'group', `"${words[i]}" sorted = "${key}" → place in group "${key}"`);
    }
    const result = Object.values(map);
    rec.record({ array: words, vars: { result: JSON.stringify(result) }, actualOutput: result }, 'done', `Grouped Anagrams: ${JSON.stringify(result)}`);
  }

  /* ════════════ BIT MANIPULATION ════════════ */

  /* ── Single Number (LeetCode 136) ── */
  function singleNumber(input, rec) {
    const raw = input.nums || input.array || [4, 1, 2, 1, 2];
    const arr = raw.slice();
    let xor = 0;
    rec.record({ array: arr, vars: { xor: 0, binary: (0).toString(2).padStart(8, '0') } }, 'init', `Single Number via XOR: [${arr.join(', ')}]`);
    for (let i = 0; i < arr.length; i++) {
      const prev = xor;
      xor ^= arr[i];
      rec.record({
        array: arr,
        highlights: { [i]: 'current' },
        vars: { i, val: arr[i], prevXOR: prev, newXOR: xor, binary: xor.toString(2).padStart(8, '0') }
      }, 'xor', `Step ${i + 1}: ${prev} ^ ${arr[i]} = ${xor}`);
    }
    const idx = arr.indexOf(xor);
    const h = {}; if (idx >= 0) h[idx] = 'done';
    rec.record({ array: arr, highlights: h, vars: { singleNumber: xor }, actualOutput: xor }, 'done', `Single number is ${xor} (all duplicate numbers cancelled out via XOR).`);
  }

  /* ── Count Set Bits (LeetCode 191) ── */
  function countSetBits(input, rec) {
    const raw = input.n !== undefined ? input.n : 13;
    const n = Number(raw) || 13;
    let count = 0;
    const binary = n.toString(2);
    const chars = binary.split('').map(Number);
    rec.record({ array: chars, vars: { n, binaryString: `${binary}b`, initialCount: 0 } }, 'init', `Count Set Bits of ${n} (${binary} in binary)`);
    for (let i = 0; i < chars.length; i++) {
      const h = { [i]: chars[i] === 1 ? 'current' : 'compare' };
      if (chars[i] === 1) count++;
      rec.record({ array: chars, highlights: h, vars: { bitIndex: i, bitValue: chars[i], runningCount: count } }, 'bit', `Bit ${i} is ${chars[i]} → set count = ${count}`);
    }
    rec.record({ array: chars, vars: { setBitsCount: count, number: n }, actualOutput: count }, 'done', `Total set bits (Hamming Weight) = ${count}.`);
  }

  /* ════════════ GREEDY ════════════ */

  /* ── Jump Game (LeetCode 55) ── */
  function jumpGame(input, rec) {
    const raw = input.nums || input.array || [2, 3, 1, 1, 4];
    const arr = raw.slice();
    const n = arr.length;
    let maxReach = 0;
    rec.record({ array: arr, highlights: { 0: 'current' }, vars: { maxReach: arr[0], currentIndex: 0 } }, 'init', `Jump Game: [${arr.join(', ')}]`);
    for (let i = 0; i < n; i++) {
      if (i > maxReach) {
        rec.record({ array: arr, highlights: { [i]: 'rejected' }, vars: { index: i, maxReach, result: false }, actualOutput: false }, 'blocked', `Cannot reach index ${i} (max reach is ${maxReach}) → returns false`);
        return;
      }
      if (i + arr[i] > maxReach) {
        maxReach = i + arr[i];
        const h = { [i]: 'done' };
        for (let k = i + 1; k <= Math.min(maxReach, n - 1); k++) h[k] = 'compare';
        rec.record({ array: arr, highlights: h, vars: { index: i, jumpValue: arr[i], newMaxReach: maxReach } }, 'update', `From index ${i} jump ${arr[i]}: new max reach = ${maxReach}`);
      }
      if (maxReach >= n - 1) {
        const h = {}; arr.forEach((_, k) => h[k] = 'done');
        rec.record({ array: arr, highlights: h, vars: { result: true, finalReach: maxReach }, actualOutput: true }, 'done', `Can reach the last index! maxReach ${maxReach} ≥ target ${n - 1} → returns true.`);
        return;
      }
    }
    rec.record({ array: arr, vars: { result: true }, actualOutput: true }, 'done', `Can reach the end → returns true.`);
  }

  /* ── Merge Intervals (LeetCode 56) ── */
  function mergeIntervals(input, rec) {
    const raw = input.intervals || [[1, 3], [2, 6], [8, 10], [15, 18]];
    const intervals = raw.slice().sort((a, b) => a[0] - b[0]);
    const merged = [intervals[0].slice()];
    rec.record({ array: intervals.map(iv => iv[0]), vars: { initialIntervals: JSON.stringify(intervals), merged: JSON.stringify(merged) } }, 'init', `Merge Intervals: ${JSON.stringify(intervals)}`);
    for (let i = 1; i < intervals.length; i++) {
      const cur = intervals[i];
      const last = merged[merged.length - 1];
      const h = {}; merged.forEach((_, k) => h[k] = 'done'); h[merged.length - 1] = 'compare';
      rec.record({ array: intervals.map(iv => iv[0]), highlights: h, vars: { currentInterval: JSON.stringify(cur), lastMerged: JSON.stringify(last) } }, 'compare', `Check ${JSON.stringify(cur)} against last merged ${JSON.stringify(last)}`);
      if (cur[0] <= last[1]) {
        last[1] = Math.max(last[1], cur[1]);
        rec.record({ array: intervals.map(iv => iv[0]), highlights: { [merged.length - 1]: 'done' }, vars: { updatedMerged: JSON.stringify(merged) } }, 'merge', `Overlap! Extended last merged interval to ${JSON.stringify(last)}`);
      } else {
        merged.push(cur.slice());
        rec.record({ array: intervals.map(iv => iv[0]), highlights: { [merged.length - 1]: 'current' }, vars: { updatedMerged: JSON.stringify(merged) } }, 'add', `No overlap. Appended new interval ${JSON.stringify(cur)}`);
      }
    }
    rec.record({ array: intervals.map(iv => iv[0]), vars: { result: JSON.stringify(merged) }, actualOutput: merged }, 'done', `Merged Intervals: ${JSON.stringify(merged)}`);
  }

  window.VizAlgoTrees = { inorderTraversal, levelOrderTraversal };
  window.VizAlgoGraphs = { bfsGraph, dfsGraph, numberOfIslands };
  window.VizAlgoDP = { coinChange, climbingStairs, longestCommonSubsequence };
  window.VizAlgoHashing = { groupAnagrams };
  window.VizAlgoBit = { singleNumber, countSetBits };
  window.VizAlgoGreedy = { jumpGame, mergeIntervals };
})();
