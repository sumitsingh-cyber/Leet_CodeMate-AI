/* CodeMate AI – Problem Synchronizer & Universal Algorithm Engine
   Extracts problem context, parses actual LeetCode example inputs/outputs,
   and maps ALL LeetCode problems dynamically to their exact DSA algorithms. */

(() => {
  /* ── LeetCode Value Parser ─────────────────────────────────── */
  function parseValue(rawStr) {
    if (!rawStr) return '';
    const s = String(rawStr).trim();

    // Check array or JSON structure
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
      try {
        return JSON.parse(s);
      } catch {
        // Try replacing single quotes with double quotes
        try {
          const validJson = s.replace(/'/g, '"').replace(/\bnull\b/g, 'null');
          return JSON.parse(validJson);
        } catch {
          // Parse simple comma-separated numbers inside brackets e.g. [1, 2, _]
          const inner = s.slice(1, -1).trim();
          if (!inner) return [];
          return inner.split(',').map(item => {
            const trimmed = item.trim().replace(/^['"]|['"]$/g, '');
            if (trimmed === 'null') return null;
            if (trimmed === 'true') return true;
            if (trimmed === 'false') return false;
            if (trimmed === '_' || trimmed === '') return '_';
            const num = Number(trimmed);
            return isNaN(num) ? trimmed : num;
          });
        }
      }
    }

    // Quoted string
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1);
    }

    // Booleans
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (s === 'null') return null;

    // Number
    const num = Number(s);
    if (!isNaN(num) && s !== '') return num;

    return s;
  }

  /* ── Parse LeetCode Example Input String ────────────────────── */
  function parseExampleInput(inputStr) {
    if (!inputStr) return {};
    const text = String(inputStr).trim().replace(/^Input\s*:\s*/i, '');
    const result = {};

    // Find all "varName = " boundaries
    const varRegex = /([a-zA-Z_][\w]*)\s*=\s*/g;
    const matches = Array.from(text.matchAll(varRegex));

    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        const key = matches[i][1];
        const valStart = matches[i].index + matches[i][0].length;
        let valEnd = (i + 1 < matches.length) ? matches[i + 1].index : text.length;

        let rawVal = text.slice(valStart, valEnd).trim();
        // Remove trailing comma if present before the next variable
        if (rawVal.endsWith(',')) rawVal = rawVal.slice(0, -1).trim();

        result[key] = parseValue(rawVal);
      }
      return result;
    }

    // Single value fallback without variable name
    return { value: parseValue(text) };
  }

  /* ── Parse LeetCode Example Output String ───────────────────── */
  function parseExampleOutput(outputStr) {
    if (!outputStr) return '';
    return String(outputStr).trim().replace(/^Output\s*:\s*/i, '');
  }

  /* ── Extract Complete Problem Context ──────────────────────── */
  function buildProblemContext(problem) {
    if (!problem) return null;

    const rawExamples = Array.isArray(problem.examples) ? problem.examples : [];
    const parsedExamples = rawExamples.map((ex, idx) => {
      const rawIn = ex.input || '';
      const rawOut = ex.output || '';
      return {
        index: idx,
        label: `Example ${idx + 1}`,
        rawInput: rawIn,
        rawOutput: rawOut,
        parsedInput: parseExampleInput(rawIn),
        expectedOutput: parseExampleOutput(rawOut),
        explanation: ex.explanation || ''
      };
    });

    const numMatch = (problem.number || '').toString().match(/\d+/)
      || (problem.title || '').match(/^(\d+)\./);
    const problemId = numMatch ? numMatch[1] : '';
    const cleanTitle = (problem.title || '').replace(/^\d+\.\s*/, '').trim();

    return {
      platform: 'leetcode',
      problemId,
      slug: (problem.slug || '').toLowerCase(),
      title: cleanTitle || (problem.slug ? problem.slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') : 'LeetCode Problem'),
      difficulty: problem.difficulty || '',
      tags: Array.isArray(problem.tags) ? problem.tags : [],
      statement: problem.statement || '',
      examples: parsedExamples,
      constraints: Array.isArray(problem.constraints) ? problem.constraints : [],
      editorLanguage: problem.editorLanguageLabel || problem.editorLanguageKey || 'C++',
      selectedExample: 0
    };
  }

  /* ── Universal Algorithm Dictionary (Available for All Problems) ── */
  const UNIVERSAL_ALGORITHMS = {
    'arrays-remove-duplicates': {
      id: 'arrays-remove-duplicates',
      name: 'Remove Duplicates from Sorted Array',
      category: 'Arrays',
      pattern: 'Two Pointers (In-place)',
      algorithmName: 'Two Pointers (i = slow, j = fast)',
      renderer: 'array',
      fn: window.VizAlgoArrays.removeDuplicates,
      primaryParam: 'nums',
      defaultInput: { nums: [1, 1, 2] },
      schema: [
        { key: 'nums', label: 'Sorted Array (nums)', type: 'array' }
      ],
      availablePatterns: [
        { id: 'arrays-remove-duplicates', name: 'Two Pointers (In-place)' },
        { id: 'arrays-two-pointers', name: 'Two Pointers (Inward)' },
        { id: 'arrays-hash-map', name: 'Hash Map Lookup' },
        { id: 'search-binary', name: 'Binary Search' }
      ]
    },

    'arrays-two-pointers': {
      id: 'arrays-two-pointers',
      name: 'Two Pointers (Left & Right)',
      category: 'Arrays',
      pattern: 'Two Pointers',
      algorithmName: 'Two Pointers Inward Scan',
      renderer: 'array',
      fn: window.VizAlgoArrays.generalTwoPointers,
      primaryParam: 'nums',
      defaultInput: { nums: [1, 2, 3, 4, 6], target: 6 },
      schema: [
        { key: 'nums', label: 'Array (nums)', type: 'array' },
        { key: 'target', label: 'Target / Condition (optional)', type: 'number' }
      ],
      availablePatterns: [
        { id: 'arrays-two-pointers', name: 'Two Pointers (Inward)' },
        { id: 'arrays-remove-duplicates', name: 'In-place Fast/Slow' },
        { id: 'arrays-sliding-window', name: 'Sliding Window' },
        { id: 'arrays-hash-map', name: 'Hash Map Lookup' },
        { id: 'search-binary', name: 'Binary Search' }
      ]
    },

    'arrays-two-sum-hash': {
      id: 'arrays-two-sum-hash',
      name: 'Two Sum (Hash Map)',
      category: 'Arrays',
      pattern: 'Hash Map Lookup',
      algorithmName: 'One-pass Hash Map',
      renderer: 'array',
      fn: window.VizAlgoArrays.twoSumHash,
      primaryParam: 'nums',
      defaultInput: { nums: [2, 7, 11, 15], target: 9 },
      schema: [
        { key: 'nums', label: 'Array (nums)', type: 'array' },
        { key: 'target', label: 'Target Sum', type: 'number' }
      ],
      availablePatterns: [
        { id: 'arrays-two-sum-hash', name: 'One-pass Hash Map' },
        { id: 'arrays-two-sum-pointers', name: 'Two Pointers (Sorted)' },
        { id: 'arrays-two-sum-brute', name: 'Brute Force' }
      ]
    },

    'arrays-two-sum-pointers': {
      id: 'arrays-two-sum-pointers',
      name: 'Two Sum II (Two Pointers)',
      category: 'Arrays',
      pattern: 'Two Pointers',
      algorithmName: 'Two Pointers (Left & Right)',
      renderer: 'array',
      fn: window.VizAlgoArrays.twoSumTwoPointers,
      primaryParam: 'numbers',
      defaultInput: { numbers: [2, 7, 11, 15], target: 9 },
      schema: [
        { key: 'numbers', label: 'Sorted Array', type: 'array' },
        { key: 'target', label: 'Target Sum', type: 'number' }
      ],
      availablePatterns: [
        { id: 'arrays-two-sum-pointers', name: 'Two Pointers' },
        { id: 'arrays-two-sum-hash', name: 'Hash Map' },
        { id: 'search-binary', name: 'Binary Search' }
      ]
    },

    'arrays-two-sum-brute': {
      id: 'arrays-two-sum-brute',
      name: 'Two Sum (Brute Force)',
      category: 'Arrays',
      pattern: 'Nested Loops',
      algorithmName: 'O(N^2) Brute Force',
      renderer: 'array',
      fn: window.VizAlgoArrays.twoSumBrute,
      primaryParam: 'nums',
      defaultInput: { nums: [2, 7, 11, 15], target: 9 },
      schema: [
        { key: 'nums', label: 'Array (nums)', type: 'array' },
        { key: 'target', label: 'Target Sum', type: 'number' }
      ],
      availablePatterns: [
        { id: 'arrays-two-sum-hash', name: 'Hash Map (Optimal)' },
        { id: 'arrays-two-sum-brute', name: 'Brute Force' }
      ]
    },

    'arrays-sliding-window': {
      id: 'arrays-sliding-window',
      name: 'Sliding Window',
      category: 'Arrays',
      pattern: 'Sliding Window',
      algorithmName: 'Dynamic Sliding Window',
      renderer: 'array',
      fn: window.VizAlgoArrays.generalSlidingWindow,
      primaryParam: 'nums',
      defaultInput: { nums: [2, 1, 5, 1, 3, 2], k: 3 },
      schema: [
        { key: 'nums', label: 'Array (nums)', type: 'array' },
        { key: 'k', label: 'Window Size / Condition (k)', type: 'number' }
      ],
      availablePatterns: [
        { id: 'arrays-sliding-window', name: 'Sliding Window' },
        { id: 'arrays-two-pointers', name: 'Two Pointers' },
        { id: 'arrays-hash-map', name: 'Hash Map' }
      ]
    },

    'arrays-hash-map': {
      id: 'arrays-hash-map',
      name: 'Hash Map Lookup / Frequencies',
      category: 'Arrays',
      pattern: 'Hash Map',
      algorithmName: 'One-Pass Hash Map Lookup & Frequencies',
      renderer: 'array',
      fn: window.VizAlgoArrays.generalHashMap,
      primaryParam: 'nums',
      defaultInput: { nums: [2, 7, 11, 15], target: 9 },
      schema: [
        { key: 'nums', label: 'Array (nums)', type: 'array' },
        { key: 'target', label: 'Target Value (optional)', type: 'number' }
      ],
      availablePatterns: [
        { id: 'arrays-hash-map', name: 'Hash Map Lookup' },
        { id: 'arrays-two-pointers', name: 'Two Pointers' },
        { id: 'arrays-sliding-window', name: 'Sliding Window' }
      ]
    },

    'search-binary': {
      id: 'search-binary',
      name: 'Binary Search',
      category: 'Searching',
      pattern: 'Binary Search',
      algorithmName: 'Iterative Binary Search (lo, mid, hi)',
      renderer: 'array',
      fn: window.VizAlgoArrays.binarySearch,
      primaryParam: 'nums',
      defaultInput: { nums: [-1, 0, 3, 5, 9, 12], target: 9 },
      schema: [
        { key: 'nums', label: 'Sorted Array (nums)', type: 'array' },
        { key: 'target', label: 'Target Value', type: 'number' }
      ],
      availablePatterns: [
        { id: 'search-binary', name: 'Binary Search' },
        { id: 'arrays-two-pointers', name: 'Two Pointers' }
      ]
    },

    'arrays-kadane': {
      id: 'arrays-kadane',
      name: 'Maximum Subarray (Kadane)',
      category: 'Arrays',
      pattern: "Kadane's Algorithm",
      algorithmName: "Kadane's Dynamic Programming",
      renderer: 'array',
      fn: window.VizAlgoArrays.kadane,
      primaryParam: 'nums',
      defaultInput: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
      schema: [
        { key: 'nums', label: 'Array (nums)', type: 'array' }
      ],
      availablePatterns: [
        { id: 'arrays-kadane', name: "Kadane's DP" },
        { id: 'arrays-sliding-window', name: 'Sliding Window' }
      ]
    },

    'arrays-buy-sell-stock': {
      id: 'arrays-buy-sell-stock',
      name: 'Best Time to Buy and Sell Stock',
      category: 'Arrays',
      pattern: 'Sliding Window / Greedy',
      algorithmName: 'Single Pass Minimum Price Tracking',
      renderer: 'array',
      fn: window.VizAlgoArrays.maxProfit,
      primaryParam: 'prices',
      defaultInput: { prices: [7, 1, 5, 3, 6, 4] },
      schema: [
        { key: 'prices', label: 'Daily Stock Prices', type: 'array' }
      ],
      availablePatterns: [
        { id: 'arrays-buy-sell-stock', name: 'Greedy One-Pass' },
        { id: 'arrays-two-pointers', name: 'Two Pointers' }
      ]
    },

    'arrays-move-zeroes': {
      id: 'arrays-move-zeroes',
      name: 'Move Zeroes',
      category: 'Arrays',
      pattern: 'Two Pointers (In-place Partition)',
      algorithmName: 'In-place Non-zero Shifting',
      renderer: 'array',
      fn: window.VizAlgoArrays.moveZeroes,
      primaryParam: 'nums',
      defaultInput: { nums: [0, 1, 0, 3, 12] },
      schema: [
        { key: 'nums', label: 'Array (nums)', type: 'array' }
      ],
      availablePatterns: [
        { id: 'arrays-move-zeroes', name: 'In-place Shifting' },
        { id: 'arrays-two-pointers', name: 'Two Pointers' }
      ]
    },

    'string-palindrome': {
      id: 'string-palindrome',
      name: 'Valid Palindrome',
      category: 'Strings',
      pattern: 'Two Pointers',
      algorithmName: 'Two Pointers Inward Check',
      renderer: 'string',
      fn: window.VizAlgoStrings.isPalindrome,
      primaryParam: 's',
      defaultInput: { s: 'A man, a plan, a canal: Panama' },
      schema: [
        { key: 's', label: 'String (s)', type: 'string' }
      ],
      availablePatterns: [
        { id: 'string-palindrome', name: 'Two Pointers Palindrome' },
        { id: 'string-longest-unique', name: 'Sliding Window Substring' }
      ]
    },

    'string-longest-unique': {
      id: 'string-longest-unique',
      name: 'Longest Substring Without Repeating Characters',
      category: 'Strings',
      pattern: 'Sliding Window + Hash Set',
      algorithmName: 'Variable Sliding Window',
      renderer: 'string',
      fn: window.VizAlgoStrings.lengthOfLongestSubstring,
      primaryParam: 's',
      defaultInput: { s: 'abcabcbb' },
      schema: [
        { key: 's', label: 'String (s)', type: 'string' }
      ],
      availablePatterns: [
        { id: 'string-longest-unique', name: 'Sliding Window Substring' },
        { id: 'string-palindrome', name: 'Two Pointers Palindrome' }
      ]
    },

    'string-parentheses': {
      id: 'string-parentheses',
      name: 'Valid Parentheses',
      category: 'Stack',
      pattern: 'Stack Matching',
      algorithmName: 'Stack-based Bracket Matcher',
      renderer: 'string',
      fn: window.VizAlgoStrings.validParentheses,
      primaryParam: 's',
      defaultInput: { s: '()[]{}' },
      schema: [
        { key: 's', label: 'String of brackets (s)', type: 'string' }
      ],
      availablePatterns: [
        { id: 'string-parentheses', name: 'Stack Matching' },
        { id: 'stack-nge', name: 'Monotonic Stack' }
      ]
    },

    'string-anagram': {
      id: 'string-anagram',
      name: 'Valid Anagram',
      category: 'Strings',
      pattern: 'Hash Map / Frequency Counter',
      algorithmName: 'Character Frequency Counting',
      renderer: 'string',
      fn: window.VizAlgoStrings.isAnagram,
      primaryParam: 's',
      defaultInput: { s: 'anagram', t: 'nagaram' },
      schema: [
        { key: 's', label: 'String s', type: 'string' },
        { key: 't', label: 'String t', type: 'string' }
      ],
      availablePatterns: [
        { id: 'string-anagram', name: 'Frequency Counter' },
        { id: 'string-palindrome', name: 'Two Pointers' }
      ]
    },

    'll-reverse': {
      id: 'll-reverse',
      name: 'Reverse Linked List',
      category: 'Linked List',
      pattern: 'Pointer Manipulation',
      algorithmName: 'Iterative 3-Pointer Reversal',
      renderer: 'linked-list',
      fn: window.VizAlgoLinkedList.reverseList,
      primaryParam: 'head',
      defaultInput: { head: [1, 2, 3, 4, 5] },
      schema: [
        { key: 'head', label: 'Linked List Nodes (head)', type: 'array' }
      ],
      availablePatterns: [
        { id: 'll-reverse', name: 'Pointer Reversal' },
        { id: 'll-middle', name: 'Fast & Slow Middle' },
        { id: 'll-cycle', name: 'Cycle Detection' }
      ]
    },

    'll-middle': {
      id: 'll-middle',
      name: 'Middle of the Linked List',
      category: 'Linked List',
      pattern: 'Fast and Slow Pointers',
      algorithmName: 'Tortoise and Hare (Middle Node)',
      renderer: 'linked-list',
      fn: window.VizAlgoLinkedList.middleNode,
      primaryParam: 'head',
      defaultInput: { head: [1, 2, 3, 4, 5] },
      schema: [
        { key: 'head', label: 'Nodes (head)', type: 'array' }
      ],
      availablePatterns: [
        { id: 'll-middle', name: 'Fast & Slow Middle' },
        { id: 'll-reverse', name: 'Pointer Reversal' }
      ]
    },

    'll-cycle': {
      id: 'll-cycle',
      name: 'Linked List Cycle',
      category: 'Linked List',
      pattern: "Floyd's Fast & Slow Pointers",
      algorithmName: 'Tortoise and Hare (Cycle Detection)',
      renderer: 'linked-list',
      fn: window.VizAlgoLinkedList.detectCycle,
      primaryParam: 'head',
      defaultInput: { head: [3, 2, 0, -4], pos: 1 },
      schema: [
        { key: 'head', label: 'Nodes (head)', type: 'array' },
        { key: 'pos', label: 'Cycle Position (pos)', type: 'number' }
      ],
      availablePatterns: [
        { id: 'll-cycle', name: 'Cycle Detection' },
        { id: 'll-middle', name: 'Middle Node' },
        { id: 'll-reverse', name: 'Pointer Reversal' }
      ]
    },

    'll-merge': {
      id: 'll-merge',
      name: 'Merge Two Sorted Lists',
      category: 'Linked List',
      pattern: 'Two Pointers',
      algorithmName: 'Two Pointers Sorted Merge',
      renderer: 'linked-list',
      fn: window.VizAlgoLinkedList.mergeTwoLists,
      primaryParam: 'list1',
      defaultInput: { list1: [1, 2, 4], list2: [1, 3, 4] },
      schema: [
        { key: 'list1', label: 'List 1 (head)', type: 'array' },
        { key: 'list2', label: 'List 2 (head)', type: 'array' }
      ],
      availablePatterns: [
        { id: 'll-merge', name: 'Two Pointers Merge' },
        { id: 'll-reverse', name: 'Pointer Reversal' }
      ]
    },

    'tree-level-order': {
      id: 'tree-level-order',
      name: 'Binary Tree Level Order Traversal',
      category: 'Trees',
      pattern: 'Breadth-First Search (BFS)',
      algorithmName: 'Queue-based Level Order Traversal',
      renderer: 'tree',
      fn: window.VizAlgoTrees.levelOrderTraversal,
      primaryParam: 'root',
      defaultInput: { root: [3, 9, 20, null, null, 15, 7] },
      schema: [
        { key: 'root', label: 'Level-order Tree Values', type: 'array' }
      ],
      availablePatterns: [
        { id: 'tree-level-order', name: 'BFS Level Order' },
        { id: 'tree-inorder', name: 'DFS Inorder' }
      ]
    },

    'tree-inorder': {
      id: 'tree-inorder',
      name: 'Binary Tree Inorder Traversal',
      category: 'Trees',
      pattern: 'Depth-First Search (DFS)',
      algorithmName: 'Inorder Traversal (Left → Root → Right)',
      renderer: 'tree',
      fn: window.VizAlgoTrees.inorderTraversal,
      primaryParam: 'root',
      defaultInput: { root: [1, null, 2, 3] },
      schema: [
        { key: 'root', label: 'Tree Values (root)', type: 'array' }
      ],
      availablePatterns: [
        { id: 'tree-inorder', name: 'DFS Inorder' },
        { id: 'tree-level-order', name: 'BFS Level Order' }
      ]
    },

    'graph-grid-traversal': {
      id: 'graph-grid-traversal',
      name: 'Grid Traversal (DFS / BFS)',
      category: 'Graphs & Matrices',
      pattern: '2D Grid Traversal',
      algorithmName: 'Universal 2D Grid DFS / BFS',
      renderer: 'grid',
      fn: window.VizAlgoGraphs.generalGridTraversal,
      primaryParam: 'grid',
      defaultInput: { grid: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] },
      schema: [
        { key: 'grid', label: '2D Grid / Matrix', type: 'grid' }
      ],
      availablePatterns: [
        { id: 'graph-grid-traversal', name: '2D Grid Traversal' },
        { id: 'graph-islands', name: 'Connected Islands DFS' }
      ]
    },

    'graph-islands': {
      id: 'graph-islands',
      name: 'Number of Islands',
      category: 'Graphs',
      pattern: 'Grid DFS / Connected Components',
      algorithmName: 'Sink Connected Land (DFS)',
      renderer: 'grid',
      fn: window.VizAlgoGraphs.numberOfIslands,
      primaryParam: 'grid',
      defaultInput: {
        grid: [
          ['1', '1', '1', '1', '0'],
          ['1', '1', '0', '1', '0'],
          ['1', '1', '0', '0', '0'],
          ['0', '0', '0', '0', '0']
        ]
      },
      schema: [],
      availablePatterns: [
        { id: 'graph-islands', name: 'Sink Islands DFS' },
        { id: 'graph-grid-traversal', name: '2D Grid Traversal' }
      ]
    },

    'dp-table': {
      id: 'dp-table',
      name: 'Dynamic Programming Tabulation',
      category: 'Dynamic Programming',
      pattern: 'Tabulation (Bottom-Up)',
      algorithmName: '1D / 2D DP State Table',
      renderer: 'dp',
      fn: window.VizAlgoDP.generalDPTable,
      primaryParam: 'nums',
      defaultInput: { nums: [1, 2, 3, 4, 5], n: 5 },
      schema: [
        { key: 'nums', label: 'States / Values', type: 'array' }
      ],
      availablePatterns: [
        { id: 'dp-table', name: '1D / 2D DP Table' },
        { id: 'dp-climb-stairs', name: 'State Recurrence' },
        { id: 'dp-coin-change', name: 'Coin Change Knapsack' }
      ]
    },

    'dp-climb-stairs': {
      id: 'dp-climb-stairs',
      name: 'Climbing Stairs',
      category: 'Dynamic Programming',
      pattern: 'Fibonacci Sequence / Tabulation',
      algorithmName: '1D DP Tabulation',
      renderer: 'dp',
      fn: window.VizAlgoDP.climbingStairs,
      primaryParam: 'n',
      defaultInput: { n: 3 },
      schema: [
        { key: 'n', label: 'Steps (n)', type: 'number' }
      ],
      availablePatterns: [
        { id: 'dp-climb-stairs', name: 'State Recurrence' },
        { id: 'dp-table', name: '1D / 2D DP Table' },
        { id: 'dp-coin-change', name: 'Coin Change Knapsack' }
      ]
    },

    'dp-coin-change': {
      id: 'dp-coin-change',
      name: 'Coin Change',
      category: 'Dynamic Programming',
      pattern: 'Unbounded Knapsack',
      algorithmName: 'Bottom-Up Tabulation',
      renderer: 'dp',
      fn: window.VizAlgoDP.coinChange,
      primaryParam: 'coins',
      defaultInput: { coins: [1, 2, 5], amount: 11 },
      schema: [
        { key: 'coins', label: 'Coin Denominations', type: 'array' },
        { key: 'amount', label: 'Target Amount', type: 'number' }
      ],
      availablePatterns: [
        { id: 'dp-coin-change', name: 'Coin Change Knapsack' },
        { id: 'dp-table', name: '1D / 2D DP Table' },
        { id: 'dp-climb-stairs', name: 'State Recurrence' }
      ]
    },

    'greedy-merge-intervals': {
      id: 'greedy-merge-intervals',
      name: 'Merge Intervals',
      category: 'Greedy',
      pattern: 'Sorting + Interval Merge',
      algorithmName: 'Greedy Overlapping Interval Merge',
      renderer: 'array',
      fn: window.VizAlgoGreedy.mergeIntervals,
      primaryParam: 'intervals',
      defaultInput: { intervals: [[1, 3], [2, 6], [8, 10], [15, 18]] },
      schema: [],
      availablePatterns: [
        { id: 'greedy-merge-intervals', name: 'Interval Merge' },
        { id: 'arrays-buy-sell-stock', name: 'Greedy One-Pass' }
      ]
    },

    'bit-single-number': {
      id: 'bit-single-number',
      name: 'Single Number',
      category: 'Bit Manipulation',
      pattern: 'Bitwise XOR',
      algorithmName: 'XOR Cancellation Property',
      renderer: 'array',
      fn: window.VizAlgoBit.singleNumber,
      primaryParam: 'nums',
      defaultInput: { nums: [4, 1, 2, 1, 2] },
      schema: [
        { key: 'nums', label: 'Array (nums)', type: 'array' }
      ],
      availablePatterns: [
        { id: 'bit-single-number', name: 'Bitwise XOR' },
        { id: 'arrays-hash-map', name: 'Hash Map Count' }
      ]
    },

    'stack-nge': {
      id: 'stack-nge',
      name: 'Next Greater Element',
      category: 'Stack',
      pattern: 'Monotonic Stack',
      algorithmName: 'Monotonic Decreasing Stack',
      renderer: 'array',
      fn: window.VizAlgoStack.nextGreaterElement,
      primaryParam: 'nums',
      defaultInput: { nums: [4, 5, 2, 25] },
      schema: [
        { key: 'nums', label: 'Array (nums)', type: 'array' }
      ],
      availablePatterns: [
        { id: 'stack-nge', name: 'Monotonic Stack' },
        { id: 'string-parentheses', name: 'Stack Matching' }
      ]
    }
  };

  /* ── Problem Registry for Specific Iconic Problems ─────────── */
  const PROBLEM_REGISTRY = [
    // 26. Remove Duplicates from Sorted Array
    {
      ...UNIVERSAL_ALGORITHMS['arrays-remove-duplicates'],
      problemNumbers: ['26'],
      slugs: ['remove-duplicates-from-sorted-array']
    },

    // 1. Two Sum
    {
      ...UNIVERSAL_ALGORITHMS['arrays-two-sum-hash'],
      problemNumbers: ['1'],
      slugs: ['two-sum']
    },

    // 167. Two Sum II - Input Array Is Sorted
    {
      ...UNIVERSAL_ALGORITHMS['arrays-two-sum-pointers'],
      problemNumbers: ['167'],
      slugs: ['two-sum-ii-input-array-is-sorted']
    },

    // 704. Binary Search & 35. Search Insert Position
    {
      ...UNIVERSAL_ALGORITHMS['search-binary'],
      problemNumbers: ['704', '35'],
      slugs: ['binary-search', 'search-insert-position']
    },

    // 206. Reverse Linked List
    {
      ...UNIVERSAL_ALGORITHMS['ll-reverse'],
      problemNumbers: ['206'],
      slugs: ['reverse-linked-list']
    },

    // 141. Linked List Cycle
    {
      ...UNIVERSAL_ALGORITHMS['ll-cycle'],
      problemNumbers: ['141'],
      slugs: ['linked-list-cycle']
    },

    // 21. Merge Two Sorted Lists
    {
      ...UNIVERSAL_ALGORITHMS['ll-merge'],
      problemNumbers: ['21'],
      slugs: ['merge-two-sorted-lists']
    },

    // 876. Middle of the Linked List
    {
      ...UNIVERSAL_ALGORITHMS['ll-middle'],
      problemNumbers: ['876'],
      slugs: ['middle-of-the-linked-list']
    },

    // 20. Valid Parentheses
    {
      ...UNIVERSAL_ALGORITHMS['string-parentheses'],
      problemNumbers: ['20'],
      slugs: ['valid-parentheses']
    },

    // 200. Number of Islands
    {
      ...UNIVERSAL_ALGORITHMS['graph-islands'],
      problemNumbers: ['200'],
      slugs: ['number-of-islands']
    },

    // 70. Climbing Stairs
    {
      ...UNIVERSAL_ALGORITHMS['dp-climb-stairs'],
      problemNumbers: ['70'],
      slugs: ['climbing-stairs']
    },

    // 121. Best Time to Buy and Sell Stock
    {
      ...UNIVERSAL_ALGORITHMS['arrays-buy-sell-stock'],
      problemNumbers: ['121'],
      slugs: ['best-time-to-buy-and-sell-stock']
    },

    // 102. Binary Tree Level Order Traversal
    {
      ...UNIVERSAL_ALGORITHMS['tree-level-order'],
      problemNumbers: ['102'],
      slugs: ['binary-tree-level-order-traversal']
    },

    // 94. Binary Tree Inorder Traversal
    {
      ...UNIVERSAL_ALGORITHMS['tree-inorder'],
      problemNumbers: ['94'],
      slugs: ['binary-tree-inorder-traversal']
    },

    // 53. Maximum Subarray
    {
      ...UNIVERSAL_ALGORITHMS['arrays-kadane'],
      problemNumbers: ['53'],
      slugs: ['maximum-subarray']
    },

    // 283. Move Zeroes
    {
      ...UNIVERSAL_ALGORITHMS['arrays-move-zeroes'],
      problemNumbers: ['283'],
      slugs: ['move-zeroes']
    },

    // 125. Valid Palindrome
    {
      ...UNIVERSAL_ALGORITHMS['string-palindrome'],
      problemNumbers: ['125'],
      slugs: ['valid-palindrome', 'valid-palindrome-ii']
    },

    // 242. Valid Anagram
    {
      ...UNIVERSAL_ALGORITHMS['string-anagram'],
      problemNumbers: ['242'],
      slugs: ['valid-anagram']
    },

    // 3. Longest Substring Without Repeating Characters
    {
      ...UNIVERSAL_ALGORITHMS['string-longest-unique'],
      problemNumbers: ['3'],
      slugs: ['longest-substring-without-repeating-characters']
    },

    // 136. Single Number
    {
      ...UNIVERSAL_ALGORITHMS['bit-single-number'],
      problemNumbers: ['136'],
      slugs: ['single-number']
    },

    // 322. Coin Change
    {
      ...UNIVERSAL_ALGORITHMS['dp-coin-change'],
      problemNumbers: ['322'],
      slugs: ['coin-change']
    },

    // 56. Merge Intervals
    {
      ...UNIVERSAL_ALGORITHMS['greedy-merge-intervals'],
      problemNumbers: ['56'],
      slugs: ['merge-intervals']
    }
  ];

  /* ── Universal Pattern Classifier (Handles ANY LeetCode Problem) ── */
  function classifyProblemUniversally(problem) {
    if (!problem) return { ...UNIVERSAL_ALGORITHMS['arrays-two-pointers'] };

    const slug = (problem.slug || '').toLowerCase();
    const title = (problem.title || '').toLowerCase();
    const statement = (problem.statement || '').toLowerCase();
    const tags = Array.isArray(problem.tags) ? problem.tags.map(t => t.toLowerCase()) : [];
    const examples = Array.isArray(problem.examples) ? problem.examples : [];
    const firstExInput = examples[0]?.parsedInput || {};
    const inputKeys = Object.keys(firstExInput).map(k => k.toLowerCase());

    // 1. Grid / Matrix / 2D Graph problems
    const isGrid = tags.some(t => t.includes('matrix') || t.includes('grid'))
      || inputKeys.some(k => ['grid', 'matrix', 'board'].includes(k))
      || (firstExInput[inputKeys[0]] && Array.isArray(firstExInput[inputKeys[0]]) && Array.isArray(firstExInput[inputKeys[0]][0]))
      || title.includes('matrix') || title.includes('island') || title.includes('grid');

    if (isGrid) {
      return {
        ...UNIVERSAL_ALGORITHMS['graph-grid-traversal'],
        confidence: 0.9,
        matchedBy: 'universal-grid'
      };
    }

    // 2. Binary Tree / Tree problems
    const isTree = tags.some(t => t.includes('tree'))
      || inputKeys.includes('root') || inputKeys.includes('tree')
      || title.includes('tree') || title.includes('bst');

    if (isTree) {
      return {
        ...UNIVERSAL_ALGORITHMS['tree-level-order'],
        confidence: 0.9,
        matchedBy: 'universal-tree'
      };
    }

    // 3. Linked List problems
    const isLinkedList = tags.some(t => t.includes('linked list'))
      || inputKeys.includes('head') || inputKeys.includes('list1') || inputKeys.includes('list2')
      || title.includes('linked list') || title.includes('node');

    if (isLinkedList) {
      return {
        ...UNIVERSAL_ALGORITHMS['ll-reverse'],
        confidence: 0.9,
        matchedBy: 'universal-linked-list'
      };
    }

    // 4. Dynamic Programming problems
    const isDP = tags.some(t => t.includes('dynamic programming'))
      || title.includes('climbing stairs') || title.includes('coin change') || title.includes('subsequence')
      || statement.includes('dynamic programming') || statement.includes('dp table') || statement.includes('minimum cost') || statement.includes('maximum profit');

    if (isDP) {
      return {
        ...UNIVERSAL_ALGORITHMS['dp-table'],
        confidence: 0.9,
        matchedBy: 'universal-dp'
      };
    }

    // 5. Binary Search problems
    const isBinarySearch = tags.some(t => t.includes('binary search'))
      || title.includes('binary search') || title.includes('search in')
      || statement.includes('binary search') || (statement.includes('sorted') && statement.includes('search'));

    if (isBinarySearch) {
      return {
        ...UNIVERSAL_ALGORITHMS['search-binary'],
        confidence: 0.9,
        matchedBy: 'universal-binary-search'
      };
    }

    // 6. Stack problems
    const isStack = tags.some(t => t.includes('stack'))
      || title.includes('parentheses') || title.includes('bracket') || statement.includes('stack')
      || (inputKeys.includes('s') && (statement.includes('valid') || statement.includes('parentheses')));

    if (isStack) {
      return {
        ...UNIVERSAL_ALGORITHMS['string-parentheses'],
        confidence: 0.9,
        matchedBy: 'universal-stack'
      };
    }

    // 7. Sliding Window problems
    const isSlidingWindow = tags.some(t => t.includes('sliding window'))
      || title.includes('sliding window') || title.includes('longest substring') || statement.includes('sliding window');

    if (isSlidingWindow) {
      const isString = inputKeys.includes('s') || tags.some(t => t.includes('string'));
      if (isString) {
        return {
          ...UNIVERSAL_ALGORITHMS['string-longest-unique'],
          confidence: 0.9,
          matchedBy: 'universal-sliding-window-string'
        };
      }
      return {
        ...UNIVERSAL_ALGORITHMS['arrays-sliding-window'],
        confidence: 0.9,
        matchedBy: 'universal-sliding-window-array'
      };
    }

    // 8. String problems
    const isString = tags.some(t => t.includes('string')) || (inputKeys.includes('s') && typeof firstExInput.s === 'string');
    if (isString) {
      return {
        ...UNIVERSAL_ALGORITHMS['string-palindrome'],
        confidence: 0.9,
        matchedBy: 'universal-string'
      };
    }

    // 9. Greedy / Intervals
    const isGreedy = tags.some(t => t.includes('greedy') || t.includes('intervals')) || inputKeys.includes('intervals');
    if (isGreedy) {
      return {
        ...UNIVERSAL_ALGORITHMS['greedy-merge-intervals'],
        confidence: 0.9,
        matchedBy: 'universal-greedy'
      };
    }

    // 10. Bit Manipulation
    const isBit = tags.some(t => t.includes('bit manipulation'));
    if (isBit) {
      return {
        ...UNIVERSAL_ALGORITHMS['bit-single-number'],
        confidence: 0.9,
        matchedBy: 'universal-bit'
      };
    }

    // 11. Array problem heuristics (Two Pointers, In-place, Hash Map)
    if (title.includes('remove') || title.includes('duplicate') || statement.includes('in-place')) {
      return {
        ...UNIVERSAL_ALGORITHMS['arrays-remove-duplicates'],
        confidence: 0.92,
        matchedBy: 'universal-array-inplace'
      };
    }

    if (title.includes('two sum') || title.includes('target') || statement.includes('complement')) {
      return {
        ...UNIVERSAL_ALGORITHMS['arrays-two-sum-hash'],
        confidence: 0.92,
        matchedBy: 'universal-array-hash'
      };
    }

    // 12. Universal Array Fallback (Never returns unsupported!)
    return {
      ...UNIVERSAL_ALGORITHMS['arrays-two-pointers'],
      confidence: 0.85,
      matchedBy: 'universal-fallback'
    };
  }

  /* ── Match Problem to Exact or Universal Algorithm ─────────── */
  function matchProblem(problem) {
    if (!problem) return null;

    const slug = (problem.slug || '').toLowerCase();
    const num = (problem.number || '').toString().trim();
    const title = (problem.title || '').toLowerCase();

    // 1. Exact problem number match (highest confidence)
    if (num) {
      const matchByNum = PROBLEM_REGISTRY.find(item => item.problemNumbers.includes(num));
      if (matchByNum) return { ...matchByNum, confidence: 1.0, matchedBy: 'number' };
    }

    // 2. Exact slug match
    if (slug) {
      const matchBySlug = PROBLEM_REGISTRY.find(item => item.slugs.includes(slug));
      if (matchBySlug) return { ...matchBySlug, confidence: 1.0, matchedBy: 'slug' };
    }

    // 3. Title heuristics for iconic names
    if (title.includes('remove duplicates')) {
      return { ...UNIVERSAL_ALGORITHMS['arrays-remove-duplicates'], confidence: 0.98, matchedBy: 'title' };
    }
    if (title.includes('two sum')) {
      return { ...UNIVERSAL_ALGORITHMS['arrays-two-sum-hash'], confidence: 0.98, matchedBy: 'title' };
    }
    if (title.includes('binary search')) {
      return { ...UNIVERSAL_ALGORITHMS['search-binary'], confidence: 0.98, matchedBy: 'title' };
    }
    if (title.includes('reverse linked list')) {
      return { ...UNIVERSAL_ALGORITHMS['ll-reverse'], confidence: 0.98, matchedBy: 'title' };
    }
    if (title.includes('valid parentheses')) {
      return { ...UNIVERSAL_ALGORITHMS['string-parentheses'], confidence: 0.98, matchedBy: 'title' };
    }
    if (title.includes('number of islands')) {
      return { ...UNIVERSAL_ALGORITHMS['graph-islands'], confidence: 0.98, matchedBy: 'title' };
    }
    if (title.includes('climbing stairs')) {
      return { ...UNIVERSAL_ALGORITHMS['dp-climb-stairs'], confidence: 0.98, matchedBy: 'title' };
    }
    if (title.includes('buy and sell stock')) {
      return { ...UNIVERSAL_ALGORITHMS['arrays-buy-sell-stock'], confidence: 0.98, matchedBy: 'title' };
    }
    if (title.includes('linked list cycle')) {
      return { ...UNIVERSAL_ALGORITHMS['ll-cycle'], confidence: 0.98, matchedBy: 'title' };
    }
    if (title.includes('level order')) {
      return { ...UNIVERSAL_ALGORITHMS['tree-level-order'], confidence: 0.98, matchedBy: 'title' };
    }
    if (title.includes('coin change')) {
      return { ...UNIVERSAL_ALGORITHMS['dp-coin-change'], confidence: 0.98, matchedBy: 'title' };
    }
    if (title.includes('single number')) {
      return { ...UNIVERSAL_ALGORITHMS['bit-single-number'], confidence: 0.98, matchedBy: 'title' };
    }

    // 4. Universal Pattern Classification for ALL other LeetCode problems
    return classifyProblemUniversally(problem);
  }

  /* ── Find Algorithm by ID (for Approach / Pattern Switcher) ── */
  function findAlgorithmById(id) {
    if (!id) return null;
    if (UNIVERSAL_ALGORITHMS[id]) return { ...UNIVERSAL_ALGORITHMS[id] };
    const fromReg = PROBLEM_REGISTRY.find(r => r.id === id);
    if (fromReg) return { ...fromReg };
    return null;
  }

  window.ProblemSync = {
    parseValue,
    parseExampleInput,
    parseExampleOutput,
    buildProblemContext,
    matchProblem,
    findAlgorithmById,
    classifyProblemUniversally,
    UNIVERSAL_ALGORITHMS,
    PROBLEM_REGISTRY
  };
})();
