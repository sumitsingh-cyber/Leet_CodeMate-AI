/* CodeMate AI – DSA Visualizer Panel Orchestrator
   Connects problem detection, algorithm catalog, custom inputs,
   and visualizer engine. */

(() => {
  const { createEngine, AnimationPlayer } = window.VizEngine;
  const { renderStep } = window.VizRenderer;
  const { buildControls } = window.VizControls;

  /* ── Algorithm Catalog ───────────────────────────────────── */
  const CATALOG = [
    // 1. Arrays & Two Pointers
    {
      id: 'arrays-two-sum-hash',
      name: 'Two Sum (Hash Map)',
      category: 'Arrays',
      renderer: 'array',
      fn: window.VizAlgoArrays.twoSumHash,
      defaultInput: { array: [2, 7, 11, 15], target: 9 },
      schema: [
        { key: 'array', label: 'Array (comma-separated)', type: 'array' },
        { key: 'target', label: 'Target Sum', type: 'number' },
      ],
      slugs: ['two-sum'],
    },
    {
      id: 'arrays-two-sum-pointers',
      name: 'Two Sum II (Two Pointers)',
      category: 'Arrays',
      renderer: 'array',
      fn: window.VizAlgoArrays.twoSumTwoPointers,
      defaultInput: { array: [2, 3, 4, 7, 11, 15], target: 9 },
      schema: [
        { key: 'array', label: 'Sorted Array (comma-separated)', type: 'array' },
        { key: 'target', label: 'Target Sum', type: 'number' },
      ],
      slugs: ['two-sum-ii-input-array-is-sorted'],
    },
    {
      id: 'arrays-two-sum-brute',
      name: 'Two Sum (Brute Force)',
      category: 'Arrays',
      renderer: 'array',
      fn: window.VizAlgoArrays.twoSumBrute,
      defaultInput: { array: [2, 7, 11, 15], target: 9 },
      schema: [
        { key: 'array', label: 'Array (comma-separated)', type: 'array' },
        { key: 'target', label: 'Target Sum', type: 'number' },
      ],
      slugs: [],
    },
    {
      id: 'arrays-kadane',
      name: 'Maximum Subarray (Kadane)',
      category: 'Arrays',
      renderer: 'array',
      fn: window.VizAlgoArrays.kadane,
      defaultInput: { array: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
      schema: [
        { key: 'array', label: 'Array (comma-separated)', type: 'array' },
      ],
      slugs: ['maximum-subarray'],
    },
    {
      id: 'arrays-sliding-window',
      name: 'Sliding Window (Max Sum of Size K)',
      category: 'Arrays',
      renderer: 'array',
      fn: window.VizAlgoArrays.slidingWindowMax,
      defaultInput: { array: [2, 1, 5, 1, 3, 2], k: 3 },
      schema: [
        { key: 'array', label: 'Array (comma-separated)', type: 'array' },
        { key: 'k', label: 'Window Size (k)', type: 'number' },
      ],
      slugs: ['sliding-window-maximum'],
    },
    {
      id: 'arrays-move-zeroes',
      name: 'Move Zeroes',
      category: 'Arrays',
      renderer: 'array',
      fn: window.VizAlgoArrays.moveZeroes,
      defaultInput: { array: [0, 1, 0, 3, 12] },
      schema: [
        { key: 'array', label: 'Array (comma-separated)', type: 'array' },
      ],
      slugs: ['move-zeroes'],
    },
    {
      id: 'arrays-prefix-sum',
      name: 'Prefix Sum Array',
      category: 'Arrays',
      renderer: 'array',
      fn: window.VizAlgoArrays.prefixSum,
      defaultInput: { array: [1, 2, 3, 4, 5] },
      schema: [
        { key: 'array', label: 'Array (comma-separated)', type: 'array' },
      ],
      slugs: ['running-sum-of-1d-array', 'range-sum-query-immutable'],
    },

    // 2. Searching
    {
      id: 'search-binary',
      name: 'Binary Search',
      category: 'Searching',
      renderer: 'array',
      fn: window.VizAlgoArrays.binarySearch,
      defaultInput: { array: [-1, 0, 3, 5, 9, 12], target: 9 },
      schema: [
        { key: 'array', label: 'Sorted Array (comma-separated)', type: 'array' },
        { key: 'target', label: 'Target Value', type: 'number' },
      ],
      slugs: ['binary-search', 'search-insert-position'],
    },

    // 3. Sorting
    {
      id: 'sort-bubble',
      name: 'Bubble Sort',
      category: 'Sorting',
      renderer: 'bars',
      fn: window.VizAlgoArrays.bubbleSort,
      defaultInput: { array: [5, 2, 8, 1, 9, 3] },
      schema: [
        { key: 'array', label: 'Array (comma-separated)', type: 'array' },
      ],
      slugs: ['sort-an-array', 'sort-colors'],
    },
    {
      id: 'sort-selection',
      name: 'Selection Sort',
      category: 'Sorting',
      renderer: 'bars',
      fn: window.VizAlgoArrays.selectionSort,
      defaultInput: { array: [64, 25, 12, 22, 11] },
      schema: [
        { key: 'array', label: 'Array (comma-separated)', type: 'array' },
      ],
      slugs: [],
    },
    {
      id: 'sort-insertion',
      name: 'Insertion Sort',
      category: 'Sorting',
      renderer: 'bars',
      fn: window.VizAlgoArrays.insertionSort,
      defaultInput: { array: [12, 11, 13, 5, 6] },
      schema: [
        { key: 'array', label: 'Array (comma-separated)', type: 'array' },
      ],
      slugs: ['insertion-sort-list'],
    },
    {
      id: 'sort-merge',
      name: 'Merge Sort',
      category: 'Sorting',
      renderer: 'bars',
      fn: window.VizAlgoArrays.mergeSortAlgo,
      defaultInput: { array: [38, 27, 43, 3, 9, 82, 10] },
      schema: [
        { key: 'array', label: 'Array (comma-separated)', type: 'array' },
      ],
      slugs: [],
    },
    {
      id: 'sort-quick',
      name: 'Quick Sort',
      category: 'Sorting',
      renderer: 'bars',
      fn: window.VizAlgoArrays.quickSortAlgo,
      defaultInput: { array: [10, 80, 30, 90, 40, 50, 70] },
      schema: [
        { key: 'array', label: 'Array (comma-separated)', type: 'array' },
      ],
      slugs: [],
    },

    // 4. Strings
    {
      id: 'string-palindrome',
      name: 'Valid Palindrome',
      category: 'Strings',
      renderer: 'string',
      fn: window.VizAlgoStrings.isPalindrome,
      defaultInput: { string: 'racecar' },
      schema: [
        { key: 'string', label: 'String to check', type: 'string' },
      ],
      slugs: ['valid-palindrome', 'valid-palindrome-ii'],
    },
    {
      id: 'string-longest-unique',
      name: 'Longest Substring Without Repeating',
      category: 'Strings',
      renderer: 'string',
      fn: window.VizAlgoStrings.lengthOfLongestSubstring,
      defaultInput: { string: 'abcabcbb' },
      schema: [
        { key: 'string', label: 'Input String', type: 'string' },
      ],
      slugs: ['longest-substring-without-repeating-characters'],
    },
    {
      id: 'string-anagram',
      name: 'Valid Anagram',
      category: 'Strings',
      renderer: 'string',
      fn: window.VizAlgoStrings.isAnagram,
      defaultInput: { string: 'anagram', target: 'nagaram' },
      schema: [
        { key: 'string', label: 'String s', type: 'string' },
        { key: 'target', label: 'String t', type: 'string' },
      ],
      slugs: ['valid-anagram'],
    },
    {
      id: 'string-parentheses',
      name: 'Valid Parentheses',
      category: 'Strings',
      renderer: 'string',
      fn: window.VizAlgoStrings.validParentheses,
      defaultInput: { string: '()[]{}' },
      schema: [
        { key: 'string', label: 'Brackets string', type: 'string' },
      ],
      slugs: ['valid-parentheses'],
    },
    {
      id: 'string-reverse',
      name: 'Reverse String',
      category: 'Strings',
      renderer: 'string',
      fn: window.VizAlgoStrings.reverseString,
      defaultInput: { string: 'hello' },
      schema: [
        { key: 'string', label: 'Input String', type: 'string' },
      ],
      slugs: ['reverse-string'],
    },

    // 5. Linked Lists
    {
      id: 'll-reverse',
      name: 'Reverse Linked List',
      category: 'Linked List',
      renderer: 'linked-list',
      fn: window.VizAlgoLinkedList.reverseList,
      defaultInput: { array: [1, 2, 3, 4, 5] },
      schema: [
        { key: 'array', label: 'Node Values (comma-separated)', type: 'array' },
      ],
      slugs: ['reverse-linked-list', 'reverse-linked-list-ii'],
    },
    {
      id: 'll-cycle',
      name: 'Detect Cycle (Floyd)',
      category: 'Linked List',
      renderer: 'linked-list',
      fn: window.VizAlgoLinkedList.detectCycle,
      defaultInput: { array: [3, 2, 0, -4], cycleAt: 1 },
      schema: [
        { key: 'array', label: 'Node Values', type: 'array' },
        { key: 'cycleAt', label: 'Cycle back to index (-1 for none)', type: 'number' },
      ],
      slugs: ['linked-list-cycle', 'linked-list-cycle-ii'],
    },
    {
      id: 'll-middle',
      name: 'Middle of the Linked List',
      category: 'Linked List',
      renderer: 'linked-list',
      fn: window.VizAlgoLinkedList.middleNode,
      defaultInput: { array: [1, 2, 3, 4, 5] },
      schema: [
        { key: 'array', label: 'Node Values', type: 'array' },
      ],
      slugs: ['middle-of-the-linked-list'],
    },
    {
      id: 'll-merge',
      name: 'Merge Two Sorted Lists',
      category: 'Linked List',
      renderer: 'linked-list',
      fn: window.VizAlgoLinkedList.mergeTwoLists,
      defaultInput: { array: [1, 2, 4], target_array: [1, 3, 4] },
      schema: [
        { key: 'array', label: 'List 1 Values', type: 'array' },
        { key: 'target_array', label: 'List 2 Values', type: 'array' },
      ],
      slugs: ['merge-two-sorted-lists'],
    },

    // 6. Stack & Queue
    {
      id: 'stack-ops',
      name: 'Stack Push/Pop/Peek',
      category: 'Stack',
      renderer: 'stack',
      fn: window.VizAlgoStack.stackOperations,
      defaultInput: {},
      schema: [],
      slugs: ['implement-stack-using-queues', 'implement-queue-using-stacks'],
    },
    {
      id: 'stack-nge',
      name: 'Next Greater Element',
      category: 'Stack',
      renderer: 'array',
      fn: window.VizAlgoStack.nextGreaterElement,
      defaultInput: { array: [4, 5, 2, 25] },
      schema: [
        { key: 'array', label: 'Array (comma-separated)', type: 'array' },
      ],
      slugs: ['next-greater-element-i', 'daily-temperatures'],
    },
    {
      id: 'stack-min',
      name: 'Min Stack',
      category: 'Stack',
      renderer: 'stack',
      fn: window.VizAlgoStack.minStack,
      defaultInput: {},
      schema: [],
      slugs: ['min-stack'],
    },

    // 7. Recursion & Backtracking
    {
      id: 'rec-factorial',
      name: 'Factorial (Recursion)',
      category: 'Recursion',
      renderer: 'stack',
      fn: window.VizAlgoRecursion.factorial,
      defaultInput: { n: 5 },
      schema: [
        { key: 'n', label: 'Number n (≤ 8)', type: 'number' },
      ],
      slugs: [],
    },
    {
      id: 'rec-fibonacci',
      name: 'Fibonacci (Recursion & Memo)',
      category: 'Recursion',
      renderer: 'stack',
      fn: window.VizAlgoRecursion.fibonacci,
      defaultInput: { n: 6 },
      schema: [
        { key: 'n', label: 'Number n (≤ 10)', type: 'number' },
      ],
      slugs: ['fibonacci-number'],
    },
    {
      id: 'rec-subsets',
      name: 'Generate Subsets (Backtracking)',
      category: 'Recursion',
      renderer: 'array',
      fn: window.VizAlgoRecursion.generateSubsets,
      defaultInput: { array: [1, 2, 3] },
      schema: [
        { key: 'array', label: 'Elements (max 4)', type: 'array' },
      ],
      slugs: ['subsets', 'subsets-ii', 'combinations'],
    },

    // 8. Trees
    {
      id: 'tree-inorder',
      name: 'Binary Tree Inorder Traversal',
      category: 'Trees',
      renderer: 'tree',
      fn: window.VizAlgoTrees.inorderTraversal,
      defaultInput: { tree: [4, 2, 6, 1, 3, 5, 7] },
      schema: [
        { key: 'tree', label: 'Level-order values (use null for empty)', type: 'array' },
      ],
      slugs: ['binary-tree-inorder-traversal'],
    },
    {
      id: 'tree-level-order',
      name: 'Level Order Traversal (BFS)',
      category: 'Trees',
      renderer: 'tree',
      fn: window.VizAlgoTrees.levelOrderTraversal,
      defaultInput: { tree: [3, 9, 20, null, null, 15, 7] },
      schema: [
        { key: 'tree', label: 'Level-order values', type: 'array' },
      ],
      slugs: ['binary-tree-level-order-traversal'],
    },

    // 9. Graphs
    {
      id: 'graph-bfs',
      name: 'Breadth First Search (BFS)',
      category: 'Graphs',
      renderer: 'graph',
      fn: window.VizAlgoGraphs.bfsGraph,
      defaultInput: { n: 6, edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]] },
      schema: [
        { key: 'n', label: 'Number of nodes', type: 'number' },
      ],
      slugs: ['clone-graph'],
    },
    {
      id: 'graph-dfs',
      name: 'Depth First Search (DFS)',
      category: 'Graphs',
      renderer: 'graph',
      fn: window.VizAlgoGraphs.dfsGraph,
      defaultInput: { n: 6, edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]] },
      schema: [
        { key: 'n', label: 'Number of nodes', type: 'number' },
      ],
      slugs: ['all-paths-from-source-to-target'],
    },
    {
      id: 'graph-islands',
      name: 'Number of Islands (Grid BFS/DFS)',
      category: 'Graphs',
      renderer: 'grid',
      fn: window.VizAlgoGraphs.numberOfIslands,
      defaultInput: {
        grid: [
          ['1', '1', '0', '0'],
          ['1', '1', '0', '0'],
          ['0', '0', '1', '0'],
          ['0', '0', '0', '1'],
        ],
      },
      schema: [],
      slugs: ['number-of-islands', 'max-area-of-island'],
    },

    // 10. Dynamic Programming
    {
      id: 'dp-climb-stairs',
      name: 'Climbing Stairs',
      category: 'Dynamic Programming',
      renderer: 'dp',
      fn: window.VizAlgoDP.climbingStairs,
      defaultInput: { n: 6 },
      schema: [
        { key: 'n', label: 'Number of steps (n)', type: 'number' },
      ],
      slugs: ['climbing-stairs'],
    },
    {
      id: 'dp-coin-change',
      name: 'Coin Change',
      category: 'Dynamic Programming',
      renderer: 'dp',
      fn: window.VizAlgoDP.coinChange,
      defaultInput: { coins: [1, 2, 5], amount: 11 },
      schema: [
        { key: 'coins', label: 'Coins (comma-separated)', type: 'array' },
        { key: 'amount', label: 'Target Amount', type: 'number' },
      ],
      slugs: ['coin-change'],
    },
    {
      id: 'dp-lcs',
      name: 'Longest Common Subsequence',
      category: 'Dynamic Programming',
      renderer: 'dp',
      fn: window.VizAlgoDP.longestCommonSubsequence,
      defaultInput: { string: 'ABCBDAB', target: 'BDCAB' },
      schema: [
        { key: 'string', label: 'String 1', type: 'string' },
        { key: 'target', label: 'String 2', type: 'string' },
      ],
      slugs: ['longest-common-subsequence'],
    },

    // 11. Hashing
    {
      id: 'hash-group-anagrams',
      name: 'Group Anagrams',
      category: 'Hashing',
      renderer: 'array',
      fn: window.VizAlgoHashing.groupAnagrams,
      defaultInput: { words: ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'] },
      schema: [],
      slugs: ['group-anagrams'],
    },

    // 12. Bit Manipulation
    {
      id: 'bit-single-number',
      name: 'Single Number (XOR)',
      category: 'Bit Manipulation',
      renderer: 'array',
      fn: window.VizAlgoBit.singleNumber,
      defaultInput: { array: [4, 1, 2, 1, 2] },
      schema: [
        { key: 'array', label: 'Array (comma-separated)', type: 'array' },
      ],
      slugs: ['single-number'],
    },
    {
      id: 'bit-count-bits',
      name: 'Count Set Bits (Hamming Weight)',
      category: 'Bit Manipulation',
      renderer: 'array',
      fn: window.VizAlgoBit.countSetBits,
      defaultInput: { n: 13 },
      schema: [
        { key: 'n', label: 'Integer n', type: 'number' },
      ],
      slugs: ['number-of-1-bits', 'counting-bits'],
    },

    // 13. Greedy
    {
      id: 'greedy-jump-game',
      name: 'Jump Game',
      category: 'Greedy',
      renderer: 'array',
      fn: window.VizAlgoGreedy.jumpGame,
      defaultInput: { array: [2, 3, 1, 1, 4] },
      schema: [
        { key: 'array', label: 'Jump Array (comma-separated)', type: 'array' },
      ],
      slugs: ['jump-game', 'jump-game-ii'],
    },
    {
      id: 'greedy-merge-intervals',
      name: 'Merge Intervals',
      category: 'Greedy',
      renderer: 'array',
      fn: window.VizAlgoGreedy.mergeIntervals,
      defaultInput: { intervals: [[1, 3], [2, 6], [8, 10], [15, 18]] },
      schema: [],
      slugs: ['merge-intervals'],
    },
  ];

  /* ── Match Problem to Algorithm ──────────────────────────── */
  function findBestAlgorithm(problem) {
    if (!problem) return CATALOG[0];
    const slug = (problem.slug || '').toLowerCase();
    // 1. Direct slug match
    for (const item of CATALOG) {
      if (item.slugs.includes(slug)) return item;
    }
    // 2. Title/Tags match
    const text = `${problem.title || ''} ${(problem.tags || []).join(' ')} ${problem.statement || ''}`.toLowerCase();
    if (text.includes('binary search') || text.includes('search a 2d matrix')) return CATALOG.find(a => a.id === 'search-binary');
    if (text.includes('palindrome')) return CATALOG.find(a => a.id === 'string-palindrome');
    if (text.includes('linked list') && (text.includes('reverse') || text.includes('invert'))) return CATALOG.find(a => a.id === 'll-reverse');
    if (text.includes('cycle') && text.includes('list')) return CATALOG.find(a => a.id === 'll-cycle');
    if (text.includes('parenthes') || text.includes('bracket')) return CATALOG.find(a => a.id === 'string-parentheses');
    if (text.includes('island')) return CATALOG.find(a => a.id === 'graph-islands');
    if (text.includes('tree') && text.includes('traversal')) return CATALOG.find(a => a.id === 'tree-inorder');
    if (text.includes('coin change')) return CATALOG.find(a => a.id === 'dp-coin-change');
    if (text.includes('single number')) return CATALOG.find(a => a.id === 'bit-single-number');
    if (text.includes('jump game')) return CATALOG.find(a => a.id === 'greedy-jump-game');
    if (text.includes('sliding window') || text.includes('subarray')) return CATALOG.find(a => a.id === 'arrays-kadane');

    return CATALOG[0];
  }

  /* ── Visualizer Panel View Builder ───────────────────────── */
  class VizPanel {
    constructor({ container, onBack }) {
      this.container = container;
      this.onBack = onBack;
      this.selectedAlgo = CATALOG[0];
      this.currentInput = JSON.parse(JSON.stringify(this.selectedAlgo.defaultInput));
      this.player = null;
    }

    render(problem = null) {
      if (problem) {
        this.selectedAlgo = findBestAlgorithm(problem);
        this.currentInput = JSON.parse(JSON.stringify(this.selectedAlgo.defaultInput));
      }

      this.container.innerHTML = `
        <div class="viz-view">
          <div class="viz-header">
            <div class="viz-header-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
              </svg>
              <span>Live DSA Visualizer</span>
            </div>
            <button type="button" class="viz-back-btn" id="vizBackBtn">
              &#8592; Back to AI
            </button>
          </div>

          <!-- Configuration Card -->
          <div class="viz-card">
            <div class="viz-card-title">
              <span>Algorithm</span>
              <span class="viz-badge" id="vizCategoryBadge">${this.selectedAlgo.category}</span>
            </div>

            <div class="viz-select-row">
              <select id="vizAlgoSelect" class="viz-select">
                ${CATALOG.map(a => `<option value="${a.id}" ${a.id === this.selectedAlgo.id ? 'selected' : ''}>[${a.category}] ${a.name}</option>`).join('')}
              </select>
            </div>

            <!-- Dynamic Input Fields -->
            <div class="viz-inputs" id="vizInputsContainer"></div>

            <div class="viz-actions">
              <button type="button" class="viz-run-btn" id="vizRunBtn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Visualize
              </button>
              <button type="button" class="viz-random-btn" id="vizRandomBtn" title="Generate random sample values">
                Randomize
              </button>
            </div>
          </div>

          <!-- Stage / Animation Canvas Card -->
          <div class="viz-card">
            <div class="viz-card-title">
              <span>Execution Stage</span>
            </div>

            <!-- Legend -->
            <div class="viz-legend">
              <span class="viz-legend-item"><span class="viz-legend-dot current"></span> Active</span>
              <span class="viz-legend-item"><span class="viz-legend-dot compare"></span> Compare / Visited</span>
              <span class="viz-legend-item"><span class="viz-legend-dot done"></span> Done / Sorted / Found</span>
              <span class="viz-legend-item"><span class="viz-legend-dot reject"></span> Rejected / Mismatch</span>
            </div>

            <!-- Variables & State -->
            <div class="viz-vars-panel"></div>

            <!-- Canvas Container -->
            <div class="viz-stage">
              <div class="viz-canvas"></div>
            </div>

            <!-- Animation Controls Panel -->
            <div class="viz-controls-panel"></div>
          </div>
        </div>
      `;

      this._bindEvents();
      this._renderInputFields();
      this.runAnimation();
    }

    _bindEvents() {
      const backBtn = this.container.querySelector('#vizBackBtn');
      if (backBtn && this.onBack) {
        backBtn.addEventListener('click', () => {
          if (this.player) this.player.pause();
          this.onBack();
        });
      }

      const select = this.container.querySelector('#vizAlgoSelect');
      if (select) {
        select.addEventListener('change', (e) => {
          const chosen = CATALOG.find(a => a.id === e.target.value);
          if (chosen) {
            this.selectedAlgo = chosen;
            this.currentInput = JSON.parse(JSON.stringify(chosen.defaultInput));
            this.container.querySelector('#vizCategoryBadge').textContent = chosen.category;
            this._renderInputFields();
            this.runAnimation();
          }
        });
      }

      const runBtn = this.container.querySelector('#vizRunBtn');
      if (runBtn) {
        runBtn.addEventListener('click', () => {
          this._collectInputs();
          this.runAnimation();
        });
      }

      const randomBtn = this.container.querySelector('#vizRandomBtn');
      if (randomBtn) {
        randomBtn.addEventListener('click', () => {
          this._randomizeInputs();
          this._renderInputFields();
          this.runAnimation();
        });
      }
    }

    _renderInputFields() {
      const box = this.container.querySelector('#vizInputsContainer');
      if (!box) return;
      if (!this.selectedAlgo.schema.length) {
        box.innerHTML = '<span style="font-size:11.5px;color:var(--muted)">Using built-in demo data.</span>';
        return;
      }
      box.innerHTML = this.selectedAlgo.schema.map(f => {
        let val = this.currentInput[f.key];
        if (Array.isArray(val)) val = val.join(', ');
        return `
          <div class="viz-input-group">
            <label>${f.label}</label>
            <input type="text" class="viz-input" data-key="${f.key}" data-type="${f.type}" value="${val !== undefined ? val : ''}">
          </div>
        `;
      }).join('');
    }

    _collectInputs() {
      const inputs = this.container.querySelectorAll('.viz-input');
      inputs.forEach(input => {
        const key = input.dataset.key;
        const type = input.dataset.type;
        const val = input.value.trim();
        if (type === 'array') {
          this.currentInput[key] = val.split(',').map(s => {
            const num = Number(s.trim());
            return isNaN(num) ? s.trim() : num;
          }).filter(x => x !== '');
        } else if (type === 'number') {
          this.currentInput[key] = Number(val);
        } else {
          this.currentInput[key] = val;
        }
      });
    }

    _randomizeInputs() {
      this.selectedAlgo.schema.forEach(f => {
        if (f.type === 'array') {
          const len = 5 + Math.floor(Math.random() * 4);
          const randArr = Array.from({ length: len }, () => 1 + Math.floor(Math.random() * 50));
          if (this.selectedAlgo.id.includes('binary') || this.selectedAlgo.id.includes('two-pointers')) {
            randArr.sort((a, b) => a - b);
          }
          this.currentInput[f.key] = randArr;
        } else if (f.type === 'number') {
          if (f.key === 'target' && Array.isArray(this.currentInput.array)) {
            const arr = this.currentInput.array;
            if (arr.length >= 2) {
              const i = Math.floor(Math.random() * arr.length);
              let j = Math.floor(Math.random() * arr.length);
              if (i === j) j = (j + 1) % arr.length;
              this.currentInput[f.key] = arr[i] + arr[j];
            } else {
              this.currentInput[f.key] = 10 + Math.floor(Math.random() * 20);
            }
          } else {
            this.currentInput[f.key] = 1 + Math.floor(Math.random() * 10);
          }
        } else if (f.type === 'string') {
          const samples = ['racecar', 'deified', 'algorithm', 'leetcode', 'visualizer'];
          this.currentInput[f.key] = samples[Math.floor(Math.random() * samples.length)];
        }
      });
    }

    runAnimation() {
      if (this.player) this.player.destroy();

      // Execute algorithm and record steps
      const steps = createEngine(this.selectedAlgo.fn, this.currentInput);
      const stageCard = this.container.querySelector('.viz-stage');
      const controlsBox = this.container.querySelector('.viz-controls-panel');

      this.player = new AnimationPlayer(steps, (step) => {
        renderStep(this.container, step, this.selectedAlgo.renderer);
      });

      buildControls(controlsBox, this.player, (step) => {
        renderStep(this.container, step, this.selectedAlgo.renderer);
      });

      // auto start play
      this.player.play();
    }

    destroy() {
      if (this.player) {
        this.player.destroy();
        this.player = null;
      }
    }
  }

  window.VizPanel = VizPanel;
})();
