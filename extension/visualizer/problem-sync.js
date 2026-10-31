/* CodeMate AI – Problem Synchronizer & Example Parser
   Extracts problem context, parses actual LeetCode example inputs/outputs,
   and maps problems to their exact DSA algorithms. */

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

    return {
      platform: 'leetcode',
      problemId,
      slug: (problem.slug || '').toLowerCase(),
      title: problem.title || '',
      difficulty: problem.difficulty || '',
      tags: Array.isArray(problem.tags) ? problem.tags : [],
      statement: problem.statement || '',
      examples: parsedExamples,
      constraints: Array.isArray(problem.constraints) ? problem.constraints : [],
      editorLanguage: problem.editorLanguageLabel || problem.editorLanguageKey || 'C++',
      selectedExample: 0
    };
  }

  /* ── Problem Registry & Matcher ────────────────────────────── */
  const PROBLEM_REGISTRY = [
    // 26. Remove Duplicates from Sorted Array
    {
      id: 'arrays-remove-duplicates',
      name: 'Remove Duplicates from Sorted Array',
      problemNumbers: ['26'],
      slugs: ['remove-duplicates-from-sorted-array'],
      category: 'Arrays',
      pattern: 'Two Pointers (In-place)',
      algorithmName: 'Two Pointers (i = slow, j = fast)',
      renderer: 'array',
      fn: window.VizAlgoArrays.removeDuplicates,
      primaryParam: 'nums',
      defaultInput: { nums: [1, 1, 2] },
      schema: [
        { key: 'nums', label: 'Sorted Array (nums)', type: 'array' }
      ]
    },

    // 1. Two Sum
    {
      id: 'arrays-two-sum-hash',
      name: 'Two Sum',
      problemNumbers: ['1'],
      slugs: ['two-sum'],
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
      ]
    },

    // 167. Two Sum II - Input Array Is Sorted
    {
      id: 'arrays-two-sum-pointers',
      name: 'Two Sum II (Input Array Is Sorted)',
      problemNumbers: ['167'],
      slugs: ['two-sum-ii-input-array-is-sorted'],
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
      ]
    },

    // 704. Binary Search & 35. Search Insert Position
    {
      id: 'search-binary',
      name: 'Binary Search',
      problemNumbers: ['704', '35'],
      slugs: ['binary-search', 'search-insert-position'],
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
      ]
    },

    // 206. Reverse Linked List
    {
      id: 'll-reverse',
      name: 'Reverse Linked List',
      problemNumbers: ['206'],
      slugs: ['reverse-linked-list'],
      category: 'Linked List',
      pattern: 'Pointer Manipulation',
      algorithmName: 'Iterative 3-Pointer Reversal (prev, curr, next)',
      renderer: 'linked-list',
      fn: window.VizAlgoLinkedList.reverseList,
      primaryParam: 'head',
      defaultInput: { head: [1, 2, 3, 4, 5] },
      schema: [
        { key: 'head', label: 'Linked List Nodes (head)', type: 'array' }
      ]
    },

    // 141. Linked List Cycle
    {
      id: 'll-cycle',
      name: 'Linked List Cycle',
      problemNumbers: ['141'],
      slugs: ['linked-list-cycle'],
      category: 'Linked List',
      pattern: "Floyd's Fast & Slow Pointers",
      algorithmName: 'Tortoise and Hare (Cycle Detection)',
      renderer: 'linked-list',
      fn: window.VizAlgoLinkedList.detectCycle,
      primaryParam: 'head',
      defaultInput: { head: [3, 2, 0, -4], pos: 1 },
      schema: [
        { key: 'head', label: 'Nodes (head)', type: 'array' },
        { key: 'pos', label: 'Cycle Position (pos, -1 if none)', type: 'number' }
      ]
    },

    // 20. Valid Parentheses
    {
      id: 'string-parentheses',
      name: 'Valid Parentheses',
      problemNumbers: ['20'],
      slugs: ['valid-parentheses'],
      category: 'Stack',
      pattern: 'Stack Matching',
      algorithmName: 'Stack-based Bracket Matcher',
      renderer: 'string',
      fn: window.VizAlgoStrings.validParentheses,
      primaryParam: 's',
      defaultInput: { s: '()[]{}' },
      schema: [
        { key: 's', label: 'String of brackets (s)', type: 'string' }
      ]
    },

    // 200. Number of Islands
    {
      id: 'graph-islands',
      name: 'Number of Islands',
      problemNumbers: ['200'],
      slugs: ['number-of-islands'],
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
      schema: []
    },

    // 70. Climbing Stairs
    {
      id: 'dp-climb-stairs',
      name: 'Climbing Stairs',
      problemNumbers: ['70'],
      slugs: ['climbing-stairs'],
      category: 'Dynamic Programming',
      pattern: 'Fibonacci Sequence / Tabulation',
      algorithmName: '1D DP Tabulation (dp[i] = dp[i-1] + dp[i-2])',
      renderer: 'dp',
      fn: window.VizAlgoDP.climbingStairs,
      primaryParam: 'n',
      defaultInput: { n: 3 },
      schema: [
        { key: 'n', label: 'Steps (n)', type: 'number' }
      ]
    },

    // 121. Best Time to Buy and Sell Stock
    {
      id: 'arrays-buy-sell-stock',
      name: 'Best Time to Buy and Sell Stock',
      problemNumbers: ['121'],
      slugs: ['best-time-to-buy-and-sell-stock'],
      category: 'Arrays',
      pattern: 'Sliding Window / Greedy',
      algorithmName: 'Single Pass Minimum Price Tracking',
      renderer: 'array',
      fn: window.VizAlgoArrays.maxProfit,
      primaryParam: 'prices',
      defaultInput: { prices: [7, 1, 5, 3, 6, 4] },
      schema: [
        { key: 'prices', label: 'Daily Stock Prices', type: 'array' }
      ]
    },

    // 102. Binary Tree Level Order Traversal
    {
      id: 'tree-level-order',
      name: 'Binary Tree Level Order Traversal',
      problemNumbers: ['102'],
      slugs: ['binary-tree-level-order-traversal'],
      category: 'Trees',
      pattern: 'Breadth-First Search (BFS)',
      algorithmName: 'Queue-based Level Order Traversal',
      renderer: 'tree',
      fn: window.VizAlgoTrees.levelOrderTraversal,
      primaryParam: 'root',
      defaultInput: { root: [3, 9, 20, null, null, 15, 7] },
      schema: [
        { key: 'root', label: 'Level-order Tree Values', type: 'array' }
      ]
    },

    // 94. Binary Tree Inorder Traversal
    {
      id: 'tree-inorder',
      name: 'Binary Tree Inorder Traversal',
      problemNumbers: ['94'],
      slugs: ['binary-tree-inorder-traversal'],
      category: 'Trees',
      pattern: 'Depth-First Search (DFS)',
      algorithmName: 'Inorder Traversal (Left → Root → Right)',
      renderer: 'tree',
      fn: window.VizAlgoTrees.inorderTraversal,
      primaryParam: 'root',
      defaultInput: { root: [1, null, 2, 3] },
      schema: [
        { key: 'root', label: 'Tree Values (root)', type: 'array' }
      ]
    },

    // 53. Maximum Subarray
    {
      id: 'arrays-kadane',
      name: 'Maximum Subarray',
      problemNumbers: ['53'],
      slugs: ['maximum-subarray'],
      category: 'Arrays',
      pattern: "Kadane's Algorithm",
      algorithmName: "Kadane's Dynamic Programming",
      renderer: 'array',
      fn: window.VizAlgoArrays.kadane,
      primaryParam: 'nums',
      defaultInput: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
      schema: [
        { key: 'nums', label: 'Array (nums)', type: 'array' }
      ]
    },

    // 283. Move Zeroes
    {
      id: 'arrays-move-zeroes',
      name: 'Move Zeroes',
      problemNumbers: ['283'],
      slugs: ['move-zeroes'],
      category: 'Arrays',
      pattern: 'Two Pointers (In-place Partition)',
      algorithmName: 'In-place Non-zero Shifting',
      renderer: 'array',
      fn: window.VizAlgoArrays.moveZeroes,
      primaryParam: 'nums',
      defaultInput: { nums: [0, 1, 0, 3, 12] },
      schema: [
        { key: 'nums', label: 'Array (nums)', type: 'array' }
      ]
    },

    // 125. Valid Palindrome
    {
      id: 'string-palindrome',
      name: 'Valid Palindrome',
      problemNumbers: ['125'],
      slugs: ['valid-palindrome', 'valid-palindrome-ii'],
      category: 'Strings',
      pattern: 'Two Pointers',
      algorithmName: 'Two Pointers Inward Check',
      renderer: 'string',
      fn: window.VizAlgoStrings.isPalindrome,
      primaryParam: 's',
      defaultInput: { s: 'A man, a plan, a canal: Panama' },
      schema: [
        { key: 's', label: 'String (s)', type: 'string' }
      ]
    },

    // 242. Valid Anagram
    {
      id: 'string-anagram',
      name: 'Valid Anagram',
      problemNumbers: ['242'],
      slugs: ['valid-anagram'],
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
      ]
    },

    // 3. Longest Substring Without Repeating Characters
    {
      id: 'string-longest-unique',
      name: 'Longest Substring Without Repeating Characters',
      problemNumbers: ['3'],
      slugs: ['longest-substring-without-repeating-characters'],
      category: 'Strings',
      pattern: 'Sliding Window + Hash Set',
      algorithmName: 'Variable Sliding Window',
      renderer: 'string',
      fn: window.VizAlgoStrings.lengthOfLongestSubstring,
      primaryParam: 's',
      defaultInput: { s: 'abcabcbb' },
      schema: [
        { key: 's', label: 'String (s)', type: 'string' }
      ]
    },

    // 136. Single Number
    {
      id: 'bit-single-number',
      name: 'Single Number',
      problemNumbers: ['136'],
      slugs: ['single-number'],
      category: 'Bit Manipulation',
      pattern: 'Bitwise XOR',
      algorithmName: 'XOR Cancellation Property',
      renderer: 'array',
      fn: window.VizAlgoBit.singleNumber,
      primaryParam: 'nums',
      defaultInput: { nums: [4, 1, 2, 1, 2] },
      schema: [
        { key: 'nums', label: 'Array (nums)', type: 'array' }
      ]
    },

    // 322. Coin Change
    {
      id: 'dp-coin-change',
      name: 'Coin Change',
      problemNumbers: ['322'],
      slugs: ['coin-change'],
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
      ]
    },

    // 55. Jump Game
    {
      id: 'greedy-jump-game',
      name: 'Jump Game',
      problemNumbers: ['55'],
      slugs: ['jump-game'],
      category: 'Greedy',
      pattern: 'Greedy Interval Tracking',
      algorithmName: 'Max Reachable Index Tracking',
      renderer: 'array',
      fn: window.VizAlgoGreedy.jumpGame,
      primaryParam: 'nums',
      defaultInput: { nums: [2, 3, 1, 1, 4] },
      schema: [
        { key: 'nums', label: 'Jump Array (nums)', type: 'array' }
      ]
    },

    // 56. Merge Intervals
    {
      id: 'greedy-merge-intervals',
      name: 'Merge Intervals',
      problemNumbers: ['56'],
      slugs: ['merge-intervals'],
      category: 'Greedy',
      pattern: 'Sorting + Interval Merge',
      algorithmName: 'Greedy Overlapping Interval Merge',
      renderer: 'array',
      fn: window.VizAlgoGreedy.mergeIntervals,
      primaryParam: 'intervals',
      defaultInput: { intervals: [[1, 3], [2, 6], [8, 10], [15, 18]] },
      schema: []
    },

    // 21. Merge Two Sorted Lists
    {
      id: 'll-merge',
      name: 'Merge Two Sorted Lists',
      problemNumbers: ['21'],
      slugs: ['merge-two-sorted-lists'],
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
      ]
    },

    // 876. Middle of the Linked List
    {
      id: 'll-middle',
      name: 'Middle of the Linked List',
      problemNumbers: ['876'],
      slugs: ['middle-of-the-linked-list'],
      category: 'Linked List',
      pattern: 'Fast and Slow Pointers',
      algorithmName: 'Tortoise and Hare (Middle Node)',
      renderer: 'linked-list',
      fn: window.VizAlgoLinkedList.middleNode,
      primaryParam: 'head',
      defaultInput: { head: [1, 2, 3, 4, 5] },
      schema: [
        { key: 'head', label: 'Nodes (head)', type: 'array' }
      ]
    }
  ];

  /* ── Match Problem to Exact Registered Algorithm ───────────── */
  function matchProblem(problem) {
    if (!problem) return null;

    const slug = (problem.slug || '').toLowerCase();
    const num = (problem.number || '').toString().trim();
    const title = (problem.title || '').toLowerCase();
    const tags = Array.isArray(problem.tags) ? problem.tags.map(t => t.toLowerCase()) : [];

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

    // 3. Title / Tags heuristics
    if (title.includes('remove duplicates') && title.includes('sorted array')) {
      return { ...PROBLEM_REGISTRY.find(i => i.id === 'arrays-remove-duplicates'), confidence: 0.95, matchedBy: 'title' };
    }
    if (title.includes('two sum')) {
      return { ...PROBLEM_REGISTRY.find(i => i.id === 'arrays-two-sum-hash'), confidence: 0.95, matchedBy: 'title' };
    }
    if (title.includes('binary search')) {
      return { ...PROBLEM_REGISTRY.find(i => i.id === 'search-binary'), confidence: 0.95, matchedBy: 'title' };
    }
    if (title.includes('reverse linked list')) {
      return { ...PROBLEM_REGISTRY.find(i => i.id === 'll-reverse'), confidence: 0.95, matchedBy: 'title' };
    }
    if (title.includes('valid parentheses')) {
      return { ...PROBLEM_REGISTRY.find(i => i.id === 'string-parentheses'), confidence: 0.95, matchedBy: 'title' };
    }
    if (title.includes('number of islands')) {
      return { ...PROBLEM_REGISTRY.find(i => i.id === 'graph-islands'), confidence: 0.95, matchedBy: 'title' };
    }
    if (title.includes('climbing stairs')) {
      return { ...PROBLEM_REGISTRY.find(i => i.id === 'dp-climb-stairs'), confidence: 0.95, matchedBy: 'title' };
    }
    if (title.includes('buy and sell stock')) {
      return { ...PROBLEM_REGISTRY.find(i => i.id === 'arrays-buy-sell-stock'), confidence: 0.95, matchedBy: 'title' };
    }
    if (title.includes('linked list cycle')) {
      return { ...PROBLEM_REGISTRY.find(i => i.id === 'll-cycle'), confidence: 0.95, matchedBy: 'title' };
    }
    if (title.includes('level order')) {
      return { ...PROBLEM_REGISTRY.find(i => i.id === 'tree-level-order'), confidence: 0.95, matchedBy: 'title' };
    }
    if (title.includes('coin change')) {
      return { ...PROBLEM_REGISTRY.find(i => i.id === 'dp-coin-change'), confidence: 0.95, matchedBy: 'title' };
    }
    if (title.includes('single number')) {
      return { ...PROBLEM_REGISTRY.find(i => i.id === 'bit-single-number'), confidence: 0.95, matchedBy: 'title' };
    }

    // Return unsupported indicator rather than silently showing Two Sum!
    return {
      unsupported: true,
      problemTitle: problem.title || slug,
      category: 'Uncategorized',
      pattern: 'Custom / Unsupported'
    };
  }

  window.ProblemSync = {
    parseValue,
    parseExampleInput,
    parseExampleOutput,
    buildProblemContext,
    matchProblem,
    PROBLEM_REGISTRY
  };
})();
