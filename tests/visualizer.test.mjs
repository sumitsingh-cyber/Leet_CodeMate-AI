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

test('DSA Visualizer Engine & Algorithm Modules', async (t) => {
  const sandbox = {
    window: {},
    document: {
      createElement: () => ({ style: {}, appendChild: () => {} }),
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

  // Load modules
  loadScript(path.join(extDir, 'visualizer', 'viz-engine.js'), sandbox);
  loadScript(path.join(extDir, 'visualizer', 'algorithms', 'arrays.js'), sandbox);
  loadScript(path.join(extDir, 'visualizer', 'algorithms', 'strings.js'), sandbox);
  loadScript(path.join(extDir, 'visualizer', 'algorithms', 'linked-list.js'), sandbox);
  loadScript(path.join(extDir, 'visualizer', 'algorithms', 'stack-recursion.js'), sandbox);
  loadScript(path.join(extDir, 'visualizer', 'algorithms', 'trees-graphs-dp.js'), sandbox);

  const { createEngine } = sandbox.window.VizEngine;

  await t.test('Arrays: Two Sum Hash Map records valid steps', () => {
    const steps = createEngine(sandbox.window.VizAlgoArrays.twoSumHash, { array: [2, 7, 11, 15], target: 9 });
    assert.ok(steps.length >= 3, 'Should record at least init, checks, and found steps');
    const last = steps[steps.length - 1];
    assert.equal(last.action, 'found');
    assert.equal(last.state.vars.result, '[0, 1]');
  });

  await t.test('Arrays: Binary Search finds element in sorted array', () => {
    const steps = createEngine(sandbox.window.VizAlgoArrays.binarySearch, { array: [1, 3, 5, 7, 9, 11], target: 7 });
    assert.ok(steps.length >= 2);
    const last = steps[steps.length - 1];
    assert.equal(last.action, 'found');
    assert.equal(last.state.vars.result, 3);
  });

  await t.test('Arrays: Kadane Algorithm computes maximum subarray', () => {
    const steps = createEngine(sandbox.window.VizAlgoArrays.kadane, { array: [-2, 1, -3, 4, -1, 2, 1, -5, 4] });
    assert.ok(steps.length > 5);
    const last = steps[steps.length - 1];
    assert.equal(last.state.vars.maxSubarraySum, 6);
  });

  await t.test('Sorting: Bubble Sort sorts array deterministically', () => {
    const steps = createEngine(sandbox.window.VizAlgoArrays.bubbleSort, { array: [4, 3, 2, 1] });
    assert.ok(steps.length > 4);
    const last = steps[steps.length - 1];
    assert.deepEqual(last.state.array, [1, 2, 3, 4]);
  });

  await t.test('Strings: Palindrome check works for racecar and detects mismatch', () => {
    const stepsGood = createEngine(sandbox.window.VizAlgoStrings.isPalindrome, { string: 'racecar' });
    assert.equal(stepsGood[stepsGood.length - 1].state.vars.isPalindrome, true);

    const stepsBad = createEngine(sandbox.window.VizAlgoStrings.isPalindrome, { string: 'hello' });
    assert.equal(stepsBad[stepsBad.length - 1].state.vars.result, false);
  });

  await t.test('Strings: Valid Parentheses correctly validates brackets', () => {
    const valid = createEngine(sandbox.window.VizAlgoStrings.validParentheses, { string: '()[]{}' });
    assert.equal(valid[valid.length - 1].state.vars.result, true);

    const invalid = createEngine(sandbox.window.VizAlgoStrings.validParentheses, { string: '(]' });
    assert.equal(invalid[invalid.length - 1].action, 'fail');
  });

  await t.test('Linked List: Reverse list produces reversed order', () => {
    const steps = createEngine(sandbox.window.VizAlgoLinkedList.reverseList, { array: [1, 2, 3] });
    assert.ok(steps.length >= 3);
    const last = steps[steps.length - 1];
    assert.deepEqual(last.state.nodes, [3, 2, 1]);
  });

  await t.test('Recursion: Factorial and Fibonacci produce correct values', () => {
    const fact = createEngine(sandbox.window.VizAlgoRecursion.factorial, { n: 5 });
    assert.equal(fact[fact.length - 1].state.vars.result, '5! = 120');

    const fib = createEngine(sandbox.window.VizAlgoRecursion.fibonacci, { n: 6 });
    assert.equal(fib[fib.length - 1].state.vars.result, 'fib(6) = 8');
  });

  await t.test('DP: Coin Change finds minimum coins', () => {
    const steps = createEngine(sandbox.window.VizAlgoDP.coinChange, { coins: [1, 2, 5], amount: 11 });
    const last = steps[steps.length - 1];
    assert.equal(last.state.vars.result, 3);
  });

  await t.test('Bit Manipulation: Single Number finds unique via XOR', () => {
    const steps = createEngine(sandbox.window.VizAlgoBit.singleNumber, { array: [4, 1, 2, 1, 2] });
    const last = steps[steps.length - 1];
    assert.equal(last.state.vars.result, 4);
  });
});
