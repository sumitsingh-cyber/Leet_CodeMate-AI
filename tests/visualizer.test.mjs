import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extDir = path.resolve(__dirname, '..', 'extension');

function loadScript(filePath, context) {
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInContext(code, context);
}

test('DSA Visualizer – Automatic LeetCode Synchronization & Algorithms', async (t) => {
  const sandbox = {
    window: {},
    document: {
      createElement: () => ({ style: {}, appendChild: () => {}, querySelector: () => null }),
      createElementNS: () => ({ setAttribute: () => {}, appendChild: () => {} }),
    },
    setTimeout: (fn) => setTimeout(fn, 1),
    clearTimeout: (id) => clearTimeout(id),
    JSON,
    Math,
    Array,
    Object,
    Number,
    String,
    Set,
    Map,
    Infinity,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  // Load visualizer modules in order
  loadScript(path.join(extDir, 'visualizer', 'viz-engine.js'), sandbox);
  loadScript(path.join(extDir, 'visualizer', 'viz-renderer.js'), sandbox);
  loadScript(path.join(extDir, 'visualizer', 'viz-controls.js'), sandbox);
  loadScript(path.join(extDir, 'visualizer', 'algorithms', 'arrays.js'), sandbox);
  loadScript(path.join(extDir, 'visualizer', 'algorithms', 'strings.js'), sandbox);
  loadScript(path.join(extDir, 'visualizer', 'algorithms', 'linked-list.js'), sandbox);
  loadScript(path.join(extDir, 'visualizer', 'algorithms', 'stack-recursion.js'), sandbox);
  loadScript(path.join(extDir, 'visualizer', 'algorithms', 'trees-graphs-dp.js'), sandbox);
  loadScript(path.join(extDir, 'visualizer', 'problem-sync.js'), sandbox);
  loadScript(path.join(extDir, 'visualizer', 'viz-panel.js'), sandbox);

  const { createEngine } = sandbox.window.VizEngine;
  const { parseExampleInput, matchProblem, buildProblemContext } = sandbox.window.ProblemSync;

  /* ── 1. Example Parsing Tests ───────────────────────────────── */
  await t.test('Example Parser: parses array, target, string, and positional parameters', () => {
    // LeetCode 26: nums = [1,1,2]
    const p1 = parseExampleInput('nums = [1,1,2]');
    assert.deepEqual(p1.nums, [1, 1, 2]);

    // LeetCode 1: nums = [2,7,11,15], target = 9
    const p2 = parseExampleInput('nums = [2,7,11,15], target = 9');
    assert.deepEqual(p2.nums, [2, 7, 11, 15]);
    assert.equal(p2.target, 9);

    // LeetCode 20: s = "()[]{}"
    const p3 = parseExampleInput('s = "()[]{}"');
    assert.equal(p3.s, '()[]{}');

    // LeetCode 141: head = [3,2,0,-4], pos = 1
    const p4 = parseExampleInput('head = [3,2,0,-4], pos = 1');
    assert.deepEqual(p4.head, [3, 2, 0, -4]);
    assert.equal(p4.pos, 1);

    // LeetCode 102: root = [3,9,20,null,null,15,7]
    const p5 = parseExampleInput('root = [3,9,20,null,null,15,7]');
    assert.deepEqual(p5.root, [3, 9, 20, null, null, 15, 7]);
  });

  /* ── 2. Problem Matching Tests ──────────────────────────────── */
  await t.test('Problem Matcher: correctly identifies supported problems and flags unsupported without falling back to Two Sum', () => {
    // 26. Remove Duplicates
    const m26 = matchProblem({ number: 26, slug: 'remove-duplicates-from-sorted-array', title: 'Remove Duplicates from Sorted Array' });
    assert.equal(m26.id, 'arrays-remove-duplicates');
    assert.equal(m26.category, 'Arrays');
    assert.equal(m26.pattern, 'Two Pointers (In-place)');

    // 1. Two Sum
    const m1 = matchProblem({ number: 1, slug: 'two-sum', title: 'Two Sum' });
    assert.equal(m1.id, 'arrays-two-sum-hash');

    // 704. Binary Search
    const m704 = matchProblem({ number: 704, slug: 'binary-search', title: 'Binary Search' });
    assert.equal(m704.id, 'search-binary');

    // 121. Best Time to Buy and Sell Stock
    const m121 = matchProblem({ number: 121, slug: 'best-time-to-buy-and-sell-stock', title: 'Best Time to Buy and Sell Stock' });
    assert.equal(m121.id, 'arrays-buy-sell-stock');

    // Universal Classifier: ANY unknown/arbitrary LeetCode problem gets a working visualizer (never unsupported, never Two Sum)
    const mTree = matchProblem({ number: 226, slug: 'invert-binary-tree', title: 'Invert Binary Tree', tags: ['Tree', 'Binary Tree'] });
    assert.equal(mTree.renderer, 'tree');
    assert.ok(mTree.availablePatterns.length >= 2);

    const mGrid = matchProblem({ number: 733, slug: 'flood-fill', title: 'Flood Fill', tags: ['Matrix', 'DFS'] });
    assert.equal(mGrid.renderer, 'grid');

    const mUnknown = matchProblem({ number: 8888, slug: 'arbitrary-leetcode-problem', title: 'Arbitrary LeetCode Problem', tags: ['Two Pointers'] });
    assert.equal(mUnknown.category, 'Arrays');
    assert.notEqual(mUnknown.id, 'arrays-two-sum-hash', 'Must not hardcode Two Sum for unrelated problems');
    assert.ok(!mUnknown.unsupported, 'Must support all LeetCode problems');
    assert.ok(mUnknown.availablePatterns.length >= 2, 'Must provide available alternative patterns');
  });

  /* ── 2.1 Universal Approach Switcher Tests ────────────────── */
  await t.test('Approach Switcher: allows switching between applicable algorithm patterns', () => {
    const { findAlgorithmById } = sandbox.window.ProblemSync;
    const twoPointersAlgo = findAlgorithmById('arrays-two-pointers');
    assert.ok(twoPointersAlgo);
    assert.equal(twoPointersAlgo.pattern, 'Two Pointers');

    const slidingWindowAlgo = findAlgorithmById('arrays-sliding-window');
    assert.ok(slidingWindowAlgo);
    assert.equal(slidingWindowAlgo.pattern, 'Sliding Window');

    const dpAlgo = findAlgorithmById('dp-table');
    assert.ok(dpAlgo);
    assert.equal(dpAlgo.pattern, 'Tabulation (Bottom-Up)');
  });

  /* ── 3. Test Problem 1: 26. Remove Duplicates from Sorted Array ── */
  await t.test('Problem 26: Remove Duplicates from Sorted Array', () => {
    // Example 1: nums = [1, 1, 2]
    const steps1 = createEngine(sandbox.window.VizAlgoArrays.removeDuplicates, { nums: [1, 1, 2] });
    assert.ok(steps1.length >= 3);
    const last1 = steps1[steps1.length - 1];
    assert.equal(last1.state.vars.k, 2);
    assert.equal(last1.state.ignoredFrom, 2);
    assert.deepEqual(last1.state.actualOutput.unique, [1, 2]);

    // Example 2: nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]
    const steps2 = createEngine(sandbox.window.VizAlgoArrays.removeDuplicates, { nums: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4] });
    const last2 = steps2[steps2.length - 1];
    assert.equal(last2.state.vars.k, 5);
    assert.equal(last2.state.ignoredFrom, 5);
    assert.deepEqual(last2.state.actualOutput.unique, [0, 1, 2, 3, 4]);
  });

  /* ── 4. Test Problem 2: 1. Two Sum ──────────────────────────── */
  await t.test('Problem 1: Two Sum (Hash Map)', () => {
    const steps = createEngine(sandbox.window.VizAlgoArrays.twoSumHash, { nums: [2, 7, 11, 15], target: 9 });
    const last = steps[steps.length - 1];
    assert.equal(last.action, 'found');
    assert.deepEqual(last.state.actualOutput, [0, 1]);
  });

  /* ── 5. Test Problem 3: 704. Binary Search ──────────────────── */
  await t.test('Problem 704: Binary Search', () => {
    const steps = createEngine(sandbox.window.VizAlgoArrays.binarySearch, { nums: [-1, 0, 3, 5, 9, 12], target: 9 });
    const last = steps[steps.length - 1];
    assert.equal(last.action, 'found');
    assert.equal(last.state.actualOutput, 4);
  });

  /* ── 6. Test Problem 4: 206. Reverse Linked List ────────────── */
  await t.test('Problem 206: Reverse Linked List', () => {
    const steps = createEngine(sandbox.window.VizAlgoLinkedList.reverseList, { head: [1, 2, 3, 4, 5] });
    const last = steps[steps.length - 1];
    assert.deepEqual(last.state.actualOutput, [5, 4, 3, 2, 1]);
  });

  /* ── 7. Test Problem 5: 20. Valid Parentheses ───────────────── */
  await t.test('Problem 20: Valid Parentheses', () => {
    const stepsValid = createEngine(sandbox.window.VizAlgoStrings.validParentheses, { s: '()[]{}' });
    assert.equal(stepsValid[stepsValid.length - 1].state.actualOutput, true);

    const stepsInvalid = createEngine(sandbox.window.VizAlgoStrings.validParentheses, { s: '(]' });
    assert.equal(stepsInvalid[stepsInvalid.length - 1].state.actualOutput, false);
  });

  /* ── 8. Test Problem 6: 200. Number of Islands ──────────────── */
  await t.test('Problem 200: Number of Islands', () => {
    const grid = [
      ['1', '1', '1', '1', '0'],
      ['1', '1', '0', '1', '0'],
      ['1', '1', '0', '0', '0'],
      ['0', '0', '0', '0', '0']
    ];
    const steps = createEngine(sandbox.window.VizAlgoGraphs.numberOfIslands, { grid });
    const last = steps[steps.length - 1];
    assert.equal(last.state.actualOutput, 1);
  });

  /* ── 9. Test Problem 7: 70. Climbing Stairs ─────────────────── */
  await t.test('Problem 70: Climbing Stairs', () => {
    const steps = createEngine(sandbox.window.VizAlgoDP.climbingStairs, { n: 3 });
    const last = steps[steps.length - 1];
    assert.equal(last.state.actualOutput, 3);
  });

  /* ── 10. Test Problem 8: 121. Best Time to Buy and Sell Stock ── */
  await t.test('Problem 121: Best Time to Buy and Sell Stock', () => {
    const steps = createEngine(sandbox.window.VizAlgoArrays.maxProfit, { prices: [7, 1, 5, 3, 6, 4] });
    const last = steps[steps.length - 1];
    assert.equal(last.state.actualOutput.maxProfit, 5);
  });

  /* ── 11. Test Problem 9: 141. Linked List Cycle ─────────────── */
  await t.test('Problem 141: Linked List Cycle', () => {
    const stepsCycle = createEngine(sandbox.window.VizAlgoLinkedList.detectCycle, { head: [3, 2, 0, -4], pos: 1 });
    assert.equal(stepsCycle[stepsCycle.length - 1].state.actualOutput, true);

    const stepsNoCycle = createEngine(sandbox.window.VizAlgoLinkedList.detectCycle, { head: [1], pos: -1 });
    assert.equal(stepsNoCycle[stepsNoCycle.length - 1].state.actualOutput, false);
  });

  /* ── 12. Test Problem 10: 102. Binary Tree Level Order ──────── */
  await t.test('Problem 102: Binary Tree Level Order Traversal', () => {
    const steps = createEngine(sandbox.window.VizAlgoTrees.levelOrderTraversal, { root: [3, 9, 20, null, null, 15, 7] });
    const last = steps[steps.length - 1];
    assert.deepEqual(last.state.actualOutput, [[3], [9, 20], [15, 7]]);
  });

  /* ── 13. Test Universal Engines on Arbitrary Inputs ─────────── */
  await t.test('Universal Engines: execute without throwing on arbitrary LeetCode problem inputs', () => {
    // Universal Two Pointers
    const tpSteps = createEngine(sandbox.window.VizAlgoArrays.generalTwoPointers, { nums: [3, 8, 12, 19, 24] });
    assert.ok(tpSteps.length >= 2);

    // Universal Sliding Window
    const swSteps = createEngine(sandbox.window.VizAlgoArrays.generalSlidingWindow, { nums: [1, 4, 2, 10, 23, 3, 1, 0, 20], k: 4 });
    assert.ok(swSteps.length >= 2);

    // Universal DP Table
    const dpSteps = createEngine(sandbox.window.VizAlgoDP.generalDPTable, { nums: [2, 5, 10, 15], n: 4 });
    assert.ok(dpSteps.length >= 2);

    // Universal Grid Traversal
    const gridSteps = createEngine(sandbox.window.VizAlgoGraphs.generalGridTraversal, {
      grid: [[1, 2], [3, 4]]
    });
    assert.ok(gridSteps.length >= 2);
  });
});
