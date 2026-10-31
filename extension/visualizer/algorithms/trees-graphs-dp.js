/* CodeMate AI – Tree, Graph, DP, Hashing, Greedy, Bit Algorithms */
(() => {

  /* ════════════ TREES ════════════ */

  function buildTreeNodes(arr) {
    // arr is level-order (null for missing)
    const nodes = [], edges = [];
    const valid = arr.filter(v => v !== null && v !== undefined);
    if (!valid.length) return { nodes, edges };
    const idxArr = arr.slice();
    for (let i = 0; i < idxArr.length; i++) {
      if (idxArr[i] === null || idxArr[i] === undefined) continue;
      nodes.push({ id: i, val: idxArr[i], depth: Math.floor(Math.log2(i + 1)) });
      const lc = 2*i+1, rc = 2*i+2;
      if (lc < idxArr.length && idxArr[lc] !== null) edges.push([i, lc]);
      if (rc < idxArr.length && idxArr[rc] !== null) edges.push([i, rc]);
    }
    return { nodes, edges };
  }

  function inorderTraversal(input, rec) {
    const treeArr = input.tree || [4,2,6,1,3,5,7];
    const { nodes, edges } = buildTreeNodes(treeArr);
    const result = [];
    rec.record({ nodes: nodes.slice(), edges, highlights: {} }, 'init', `Inorder Traversal (Left → Root → Right)`);
    function inorder(i) {
      if (i >= treeArr.length || treeArr[i] === null) return;
      inorder(2*i+1);
      const h = {}; h[i] = 'current';
      rec.record({ nodes: nodes.slice(), edges, highlights: h }, 'visit', `Visit node ${treeArr[i]}`);
      result.push(treeArr[i]);
      const hd = {}; result.forEach((_, k) => { /* find idx */ }); h[i] = 'done';
      rec.record({ nodes: nodes.slice(), edges, highlights: { ...h }, vars: { visited: `[${result}]` } }, 'done_node', `Visited ${treeArr[i]}. Result so far: [${result}]`);
      inorder(2*i+2);
    }
    inorder(0);
    const allDone = {}; nodes.forEach(n => allDone[n.id] = 'done');
    rec.record({ nodes: nodes.slice(), edges, highlights: allDone, vars: { inorder: `[${result}]` } }, 'done', `Inorder: [${result}]`);
  }

  function levelOrderTraversal(input, rec) {
    const treeArr = input.tree || [3,9,20,null,null,15,7];
    const { nodes, edges } = buildTreeNodes(treeArr);
    const result = [], queue = [0];
    rec.record({ nodes: nodes.slice(), edges, highlights: { 0: 'current' } }, 'init', `Level Order BFS Traversal`);
    while (queue.length) {
      const levelSize = queue.length;
      const level = [];
      for (let k = 0; k < levelSize; k++) {
        const i = queue.shift();
        if (i >= treeArr.length || treeArr[i] === null) continue;
        level.push(treeArr[i]);
        const h = {}; h[i] = 'current'; queue.forEach(qi => { h[qi] = 'compare'; });
        rec.record({ nodes: nodes.slice(), edges, highlights: h, vars: { queue: `[${queue}]`, level: `[${level}]` } }, 'dequeue', `Dequeue node ${treeArr[i]}`);
        const lc = 2*i+1, rc = 2*i+2;
        if (lc < treeArr.length && treeArr[lc] !== null) { queue.push(lc); h[lc] = 'compare'; rec.record({ nodes: nodes.slice(), edges, highlights: { ...h }, vars: { enqueue: treeArr[lc] } }, 'enqueue', `Enqueue left child ${treeArr[lc]}`); }
        if (rc < treeArr.length && treeArr[rc] !== null) { queue.push(rc); h[rc] = 'compare'; rec.record({ nodes: nodes.slice(), edges, highlights: { ...h }, vars: { enqueue: treeArr[rc] } }, 'enqueue', `Enqueue right child ${treeArr[rc]}`); }
        h[i] = 'done';
      }
      result.push(level);
      rec.record({ nodes: nodes.slice(), edges, highlights: {}, vars: { completedLevel: `[${level}]`, result: JSON.stringify(result) } }, 'level', `Level complete: [${level}]`);
    }
    const allDone = {}; nodes.forEach(n => allDone[n.id] = 'done');
    rec.record({ nodes: nodes.slice(), edges, highlights: allDone, vars: { result: JSON.stringify(result) } }, 'done', `Level order: ${JSON.stringify(result)}`);
  }

  /* ════════════ GRAPHS ════════════ */

  function bfsGraph(input, rec) {
    const n = input.n || 6;
    const edgeList = input.edges || [[0,1],[0,2],[1,3],[1,4],[2,5]];
    const adj = Array.from({ length: n }, () => []);
    edgeList.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u); });
    const nodes = Array.from({ length: n }, (_, i) => ({ id: i }));
    const graphEdges = edgeList.map(([u, v]) => [u, v]);
    const visited = new Array(n).fill(false);
    const queue = [0]; visited[0] = true;
    const order = [];
    rec.record({ nodes, edges: graphEdges, highlights: { 0: 'current' } }, 'init', `BFS from node 0. Graph has ${n} nodes.`);
    while (queue.length) {
      const u = queue.shift(); order.push(u);
      const h = {}; order.forEach(x => h[x] = 'done'); queue.forEach(x => h[x] = 'compare'); h[u] = 'current';
      rec.record({ nodes, edges: graphEdges, highlights: h, vars: { visiting: u, queue: `[${queue}]`, visited: `[${order}]` } }, 'visit', `Visit node ${u}. Queue: [${queue}]`);
      for (const v of adj[u]) {
        if (!visited[v]) {
          visited[v] = true; queue.push(v);
          const h2 = { ...h, [v]: 'compare' };
          rec.record({ nodes, edges: graphEdges, highlights: h2, vars: { enqueue: v, queue: `[${queue}]` } }, 'enqueue', `Enqueue neighbor ${v}`);
        }
      }
    }
    const allDone = {}; nodes.forEach(nd => allDone[nd.id] = 'done');
    rec.record({ nodes, edges: graphEdges, highlights: allDone, vars: { order: `[${order}]` } }, 'done', `BFS order: [${order}]`);
  }

  function dfsGraph(input, rec) {
    const n = input.n || 6;
    const edgeList = input.edges || [[0,1],[0,2],[1,3],[1,4],[2,5]];
    const adj = Array.from({ length: n }, () => []);
    edgeList.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u); });
    const nodes = Array.from({ length: n }, (_, i) => ({ id: i }));
    const graphEdges = edgeList.map(([u, v]) => [u, v]);
    const visited = new Array(n).fill(false);
    const order = [], stack = [];
    rec.record({ nodes, edges: graphEdges, highlights: {} }, 'init', `DFS from node 0. Graph has ${n} nodes.`);
    function dfs(u) {
      visited[u] = true; order.push(u); stack.push(u);
      const h = {}; order.forEach(x => h[x] = 'done'); stack.forEach(x => h[x] = 'compare'); h[u] = 'current';
      rec.record({ nodes, edges: graphEdges, highlights: h, vars: { visiting: u, stack: `[${stack}]`, order: `[${order}]` } }, 'visit', `Visit node ${u} (DFS stack: [${stack}])`);
      for (const v of adj[u]) {
        if (!visited[v]) {
          const h2 = { ...h, [v]: 'compare' };
          rec.record({ nodes, edges: graphEdges, highlights: h2, vars: { exploring: `${u} → ${v}` } }, 'explore', `Explore edge ${u} → ${v}`);
          dfs(v);
        }
      }
      stack.pop();
    }
    dfs(0);
    const allDone = {}; nodes.forEach(nd => allDone[nd.id] = 'done');
    rec.record({ nodes, edges: graphEdges, highlights: allDone, vars: { order: `[${order}]` } }, 'done', `DFS order: [${order}]`);
  }

  function numberOfIslands(input, rec) {
    const grid = input.grid || [['1','1','0','0'],['1','1','0','0'],['0','0','1','0'],['0','0','0','1']];
    const rows = grid.length, cols = grid[0].length;
    const g = grid.map(r => r.slice());
    let islands = 0;
    rec.record({ grid: g.map(r => r.slice()), highlights: {} }, 'init', `Number of Islands. Grid: ${rows}×${cols}`);
    function dfs(r, c) {
      if (r < 0 || r >= rows || c < 0 || c >= cols || g[r][c] !== '1') return;
      g[r][c] = '0';
      const h = {}; h[`${r},${c}`] = 'done';
      rec.record({ grid: g.map(row => row.slice()), highlights: h, vars: { sinking: `(${r},${c})` } }, 'sink', `Sink land at (${r},${c})`);
      dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1);
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (g[r][c] === '1') {
          islands++;
          const h = {}; h[`${r},${c}`] = 'current';
          rec.record({ grid: g.map(row => row.slice()), highlights: h, vars: { islands, startDFS: `(${r},${c})` } }, 'island', `Found island #${islands} at (${r},${c}). DFS to sink it.`);
          dfs(r, c);
        }
      }
    }
    rec.record({ grid: g.map(r => r.slice()), vars: { totalIslands: islands } }, 'done', `Total islands: ${islands}`);
  }

  /* ════════════ DYNAMIC PROGRAMMING ════════════ */

  function coinChange(input, rec) {
    const coins = input.coins || [1, 5, 6, 9];
    const amount = input.amount || 11;
    const dp = new Array(amount + 1).fill(Infinity); dp[0] = 0;
    const dpRow = [dp.slice()];
    rec.record({ dp: [dp.slice()], highlights: { '0,0': 'done' }, colLabels: Array.from({length:amount+1},(_,i)=>i), rowLabels: ['dp'] }, 'init', `Coin Change: coins=[${coins}], amount=${amount}`);
    for (let i = 1; i <= amount; i++) {
      for (const c of coins) {
        if (c <= i && dp[i-c] + 1 < dp[i]) {
          dp[i] = dp[i-c] + 1;
        }
      }
      const h = {}; h[`0,${i}`] = 'current';
      rec.record({ dp: [dp.slice()], highlights: h, colLabels: Array.from({length:amount+1},(_,k)=>k), rowLabels: ['dp'], vars: { amount: i, minCoins: dp[i] === Infinity ? '∞' : dp[i] } }, 'compute', `dp[${i}] = ${dp[i] === Infinity ? '∞' : dp[i]} (min coins for amount ${i})`);
    }
    const resultH = {}; resultH[`0,${amount}`] = dp[amount] === Infinity ? 'rejected' : 'done';
    rec.record({ dp: [dp.slice()], highlights: resultH, colLabels: Array.from({length:amount+1},(_,i)=>i), rowLabels: ['dp'], vars: { result: dp[amount] === Infinity ? -1 : dp[amount] } }, 'done', dp[amount] === Infinity ? `Impossible! Cannot make amount ${amount}` : `Minimum coins for ${amount}: ${dp[amount]}`);
  }

  function climbingStairs(input, rec) {
    const n = Math.min(input.n || 8, 15);
    const dp = new Array(n + 1).fill(0); dp[0] = 1; dp[1] = 1;
    rec.record({ dp: [dp.slice()], colLabels: Array.from({length:n+1},(_,i)=>i), rowLabels: ['ways'], highlights: { '0,0': 'done', '0,1': 'done' } }, 'init', `Climbing Stairs: n=${n}. dp[0]=1, dp[1]=1`);
    for (let i = 2; i <= n; i++) {
      dp[i] = dp[i-1] + dp[i-2];
      const h = {}; h[`0,${i}`] = 'current'; h[`0,${i-1}`] = 'compare'; h[`0,${i-2}`] = 'compare';
      rec.record({ dp: [dp.slice()], colLabels: Array.from({length:n+1},(_,k)=>k), rowLabels: ['ways'], highlights: h, vars: { i, 'dp[i]': dp[i], formula: `dp[${i-1}]+dp[${i-2}]=${dp[i-1]}+${dp[i-2]}` } }, 'compute', `dp[${i}] = dp[${i-1}]+dp[${i-2}] = ${dp[i-1]}+${dp[i-2]} = ${dp[i]}`);
    }
    const h = {}; h[`0,${n}`] = 'done';
    rec.record({ dp: [dp.slice()], colLabels: Array.from({length:n+1},(_,i)=>i), rowLabels: ['ways'], highlights: h, vars: { result: dp[n] } }, 'done', `Ways to climb ${n} stairs = ${dp[n]}`);
  }

  function longestCommonSubsequence(input, rec) {
    const s1 = input.string || 'ABCBDAB';
    const s2 = input.target || 'BDCAB';
    const m = s1.length, n2 = s2.length;
    const dp = Array.from({ length: m+1 }, () => new Array(n2+1).fill(0));
    const rLabels = [' ', ...s1.split('')], cLabels = [' ', ...s2.split('')];
    rec.record({ dp: dp.map(r=>r.slice()), colLabels: cLabels, rowLabels: rLabels, highlights: {} }, 'init', `LCS: "${s1}" and "${s2}"`);
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n2; j++) {
        const h = {}; h[`${i},${j}`] = 'current';
        if (s1[i-1] === s2[j-1]) {
          dp[i][j] = dp[i-1][j-1] + 1;
          h[`${i-1},${j-1}`] = 'compare';
          rec.record({ dp: dp.map(r=>r.slice()), colLabels: cLabels, rowLabels: rLabels, highlights: h, vars: { match: `'${s1[i-1]}'=='${s2[j-1]}'`, value: dp[i][j] } }, 'match', `Match '${s1[i-1]}': dp[${i}][${j}] = dp[${i-1}][${j-1}]+1 = ${dp[i][j]}`);
        } else {
          dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
          h[`${i-1},${j}`] = 'compare'; h[`${i},${j-1}`] = 'compare';
          rec.record({ dp: dp.map(r=>r.slice()), colLabels: cLabels, rowLabels: rLabels, highlights: h, vars: { noMatch: `'${s1[i-1]}'≠'${s2[j-1]}'`, value: dp[i][j] } }, 'no_match', `No match: dp[${i}][${j}] = max(${dp[i-1][j]}, ${dp[i][j-1]}) = ${dp[i][j]}`);
        }
      }
    }
    const hf = {}; hf[`${m},${n2}`] = 'done';
    rec.record({ dp: dp.map(r=>r.slice()), colLabels: cLabels, rowLabels: rLabels, highlights: hf, vars: { LCS_length: dp[m][n2] } }, 'done', `LCS length = ${dp[m][n2]}`);
  }

  /* ════════════ HASHING ════════════ */

  function groupAnagrams(input, rec) {
    const words = input.words || ['eat','tea','tan','ate','nat','bat'];
    const map = {};
    rec.record({ array: words, vars: { map: '{}' } }, 'init', `Group Anagrams: [${words.map(w=>`"${w}"`)}]`);
    for (let i = 0; i < words.length; i++) {
      const key = words[i].split('').sort().join('');
      if (!map[key]) map[key] = [];
      map[key].push(words[i]);
      rec.record({ array: words, highlights: { [i]: 'current' }, vars: { word: words[i], key, groups: Object.values(map).length } }, 'group', `"${words[i]}" sorted="${key}" → group "${key}"`);
    }
    rec.record({ array: words, vars: { result: JSON.stringify(Object.values(map)) } }, 'done', `Groups: ${JSON.stringify(Object.values(map))}`);
  }

  /* ════════════ BIT MANIPULATION ════════════ */

  function singleNumber(input, rec) {
    const arr = input.array.slice();
    let xor = 0;
    rec.record({ array: arr, vars: { xor: 0, binary: (0).toString(2).padStart(8,'0') } }, 'init', `Single Number (XOR): [${arr}]`);
    for (let i = 0; i < arr.length; i++) {
      const prev = xor;
      xor ^= arr[i];
      rec.record({ array: arr, highlights: { [i]: 'current' }, vars: { i, val: arr[i], prev_xor: prev.toString(2).padStart(8,'0'), xor: xor.toString(2).padStart(8,'0'), decimal: xor } }, 'xor', `XOR ${prev.toString(2).padStart(8,'0')} ^ ${arr[i].toString(2).padStart(8,'0')} = ${xor.toString(2).padStart(8,'0')}`);
    }
    const idx = arr.indexOf(xor);
    const h = {}; if (idx >= 0) h[idx] = 'done';
    rec.record({ array: arr, highlights: h, vars: { result: xor } }, 'done', `Single number = ${xor} (all duplicates cancelled out via XOR)`);
  }

  function countSetBits(input, rec) {
    const n = input.n !== undefined ? input.n : 13;
    let num = n, count = 0;
    const binary = n.toString(2);
    const chars = binary.split('').map(Number);
    rec.record({ array: chars, vars: { n, binary, count } }, 'init', `Count Set Bits of ${n} = ${binary}b`);
    for (let i = 0; i < chars.length; i++) {
      const h = { [i]: chars[i] === 1 ? 'current' : 'compare' };
      if (chars[i] === 1) count++;
      rec.record({ array: chars, highlights: h, vars: { bit: i, value: chars[i], count } }, 'bit', `Bit[${i}]=${chars[i]}. Count=${count}`);
    }
    rec.record({ array: chars, vars: { result: count, n, binary } }, 'done', `${n} (${binary}b) has ${count} set bits`);
  }

  /* ════════════ GREEDY ════════════ */

  function jumpGame(input, rec) {
    const arr = input.array.slice();
    const n = arr.length;
    let maxReach = 0;
    rec.record({ array: arr, highlights: { 0: 'current' }, vars: { maxReach: arr[0], i: 0 } }, 'init', `Jump Game: [${arr}]`);
    for (let i = 0; i < n; i++) {
      if (i > maxReach) {
        rec.record({ array: arr, highlights: { [i]: 'rejected' }, vars: { i, maxReach, result: false } }, 'blocked', `Cannot reach index ${i} (maxReach=${maxReach}) → FAIL`);
        return;
      }
      if (i + arr[i] > maxReach) {
        maxReach = i + arr[i];
        const h = { [i]: 'done' }; for (let k = i+1; k <= Math.min(maxReach, n-1); k++) h[k] = 'compare';
        rec.record({ array: arr, highlights: h, vars: { i, jump: arr[i], maxReach } }, 'update', `From i=${i} jump ${arr[i]}: new maxReach=${maxReach}`);
      } else {
        rec.record({ array: arr, highlights: { [i]: 'done' }, vars: { i, jump: arr[i], maxReach } }, 'skip', `i=${i}: reach ${i+arr[i]} ≤ maxReach=${maxReach}, no update`);
      }
      if (maxReach >= n - 1) {
        const h = {}; arr.forEach((_, k) => h[k] = 'done');
        rec.record({ array: arr, highlights: h, vars: { result: true } }, 'done', `Can reach end! maxReach=${maxReach} ≥ last index ${n-1}`);
        return;
      }
    }
    rec.record({ array: arr, vars: { result: true } }, 'done', `Jump Game: CAN reach the end!`);
  }

  function mergeIntervals(input, rec) {
    let intervals = input.intervals || [[1,3],[2,6],[8,10],[15,18]];
    intervals = intervals.slice().sort((a, b) => a[0] - b[0]);
    const merged = [intervals[0].slice()];
    rec.record({ array: intervals.map(iv => iv[0]), vars: { intervals: JSON.stringify(intervals), merged: JSON.stringify(merged) } }, 'init', `Merge Intervals: ${JSON.stringify(intervals)}`);
    for (let i = 1; i < intervals.length; i++) {
      const cur = intervals[i];
      const last = merged[merged.length - 1];
      const h = {}; merged.forEach((_, k) => h[k] = 'done'); h[merged.length - 1] = 'compare';
      rec.record({ array: intervals.map(iv => iv[0]), highlights: h, vars: { current: JSON.stringify(cur), last: JSON.stringify(last) } }, 'compare', `Check interval ${JSON.stringify(cur)} with last merged ${JSON.stringify(last)}`);
      if (cur[0] <= last[1]) {
        last[1] = Math.max(last[1], cur[1]);
        rec.record({ array: intervals.map(iv => iv[0]), highlights: { [merged.length-1]: 'done' }, vars: { merged: JSON.stringify(merged), action: 'overlap merged' } }, 'merge', `Overlap! Extend last to ${JSON.stringify(last)}`);
      } else {
        merged.push(cur.slice());
        rec.record({ array: intervals.map(iv => iv[0]), highlights: { [merged.length-1]: 'current' }, vars: { merged: JSON.stringify(merged), action: 'no overlap' } }, 'add', `No overlap. Add new interval ${JSON.stringify(cur)}`);
      }
    }
    rec.record({ array: intervals.map(iv => iv[0]), vars: { result: JSON.stringify(merged) } }, 'done', `Merged: ${JSON.stringify(merged)}`);
  }

  window.VizAlgoTrees = { inorderTraversal, levelOrderTraversal };
  window.VizAlgoGraphs = { bfsGraph, dfsGraph, numberOfIslands };
  window.VizAlgoDP = { coinChange, climbingStairs, longestCommonSubsequence };
  window.VizAlgoHashing = { groupAnagrams };
  window.VizAlgoBit = { singleNumber, countSetBits };
  window.VizAlgoGreedy = { jumpGame, mergeIntervals };
})();

