/* CodeMate AI – Stack, Queue, and Recursion Algorithms */
(() => {

  /* ── Stack: Push / Pop ── */
  function stackOperations(input, rec) {
    const ops = input.operations || [['push',3],['push',7],['push',1],['pop'],['push',5],['peek']];
    const stack = [];
    rec.record({ stack: [], highlights: {} }, 'init', 'Stack Operations: start with empty stack');
    for (const [op, val] of ops) {
      if (op === 'push') {
        stack.push(val);
        rec.record({ stack: stack.slice(), highlights: { [stack.length-1]: 'current' }, vars: { operation: `push(${val})`, top: stack[stack.length-1] } }, 'push', `PUSH ${val} → stack: [${stack}]`);
      } else if (op === 'pop') {
        if (!stack.length) { rec.record({ stack: [], highlights: {} }, 'error', 'POP on empty stack!'); continue; }
        const popped = stack.pop();
        rec.record({ stack: stack.slice(), highlights: stack.length ? { [stack.length-1]: 'current' } : {}, vars: { operation: `pop()`, popped, top: stack[stack.length-1] } }, 'pop', `POP ${popped} → stack: [${stack}]`);
      } else if (op === 'peek') {
        const top = stack[stack.length-1];
        rec.record({ stack: stack.slice(), highlights: { [stack.length-1]: 'compare' }, vars: { operation: 'peek()', top } }, 'peek', `PEEK → top = ${top}`);
      }
    }
    rec.record({ stack: stack.slice(), vars: { finalStack: `[${stack}]` } }, 'done', `Final stack: [${stack}]`);
  }

  /* ── Next Greater Element ── */
  function nextGreaterElement(input, rec) {
    const raw = input.nums || input.array || [4, 5, 2, 25];
    const arr = (Array.isArray(raw) ? raw : [4, 5, 2, 25]).slice();
    const n = arr.length;
    const result = new Array(n).fill(-1);
    const stack = []; // stores indices
    rec.record({ array: arr, stack: [], vars: { result: result.slice() } }, 'init', `Next Greater Element: [${arr}]`);
    for (let i = 0; i < n; i++) {
      const h = { [i]: 'current' };
      rec.record({ array: arr, highlights: h, stack: stack.map(k => arr[k]), vars: { i, val: arr[i], stack: `[${stack.map(k=>arr[k])}]` } }, 'check', `Process arr[${i}]=${arr[i]}`);
      while (stack.length && arr[stack[stack.length-1]] < arr[i]) {
        const idx = stack.pop();
        result[idx] = arr[i];
        const h2 = { [idx]: 'done', [i]: 'current' };
        rec.record({ array: arr, highlights: h2, stack: stack.map(k=>arr[k]), vars: { result: result.slice(), found: `NGE of arr[${idx}]=${arr[idx]} is ${arr[i]}` } }, 'found', `NGE of arr[${idx}]=${arr[idx]} is ${arr[i]}`);
      }
      stack.push(i);
    }
    rec.record({ array: arr, vars: { result: result.slice() }, actualOutput: result.slice() }, 'done', `Next Greater Element: [${result}]`);
  }

  /* ── Min Stack ── */
  function minStack(input, rec) {
    const ops = input.operations || [['push',5],['push',3],['push',7],['getMin'],['pop'],['getMin']];
    const stack = [], minSt = [];
    rec.record({ stack: [], highlights: {} }, 'init', 'Min Stack: start empty');
    for (const [op, val] of ops) {
      if (op === 'push') {
        stack.push(val);
        minSt.push(Math.min(val, minSt.length ? minSt[minSt.length-1] : val));
        rec.record({ stack: stack.slice(), highlights: { [stack.length-1]: 'current' }, vars: { op: `push(${val})`, currentMin: minSt[minSt.length-1] } }, 'push', `PUSH ${val}. Min stack top: ${minSt[minSt.length-1]}`);
      } else if (op === 'pop') {
        const p = stack.pop(); minSt.pop();
        rec.record({ stack: stack.slice(), highlights: stack.length ? { [stack.length-1]: 'compare' } : {}, vars: { op: `pop()→${p}`, currentMin: minSt[minSt.length-1] } }, 'pop', `POP ${p}. New min: ${minSt[minSt.length-1]}`);
      } else if (op === 'getMin') {
        const m = minSt[minSt.length-1];
        rec.record({ stack: stack.slice(), highlights: {}, vars: { op: 'getMin()', minimum: m } }, 'getmin', `getMin() = ${m} (O(1))`);
      }
    }
    rec.record({ stack: stack.slice(), vars: {} }, 'done', 'Min Stack operations complete.');
  }

  /* ── Recursion: Factorial ── */
  function factorial(input, rec) {
    const n = Math.min(input.n || 5, 10);
    const callStack = [];
    rec.record({ stack: [], vars: { n, computing: `${n}!` } }, 'init', `Factorial(${n}): recursive descent`);
    function fact(k) {
      callStack.push(`fact(${k})`);
      rec.record({ stack: callStack.slice(), highlights: { [callStack.length-1]: 'current' }, vars: { call: `fact(${k})`, depth: callStack.length } }, 'call', `Calling fact(${k})`);
      if (k <= 1) {
        rec.record({ stack: callStack.slice(), highlights: { [callStack.length-1]: 'done' }, vars: { base: `fact(${k})=1` } }, 'base', `Base case: fact(${k}) = 1`);
        callStack.pop();
        return 1;
      }
      const sub = fact(k - 1);
      const result = k * sub;
      callStack.push(`fact(${k})=${result}`);
      rec.record({ stack: callStack.slice(), highlights: { [callStack.length-1]: 'done' }, vars: { returning: `fact(${k}) = ${k} × ${sub} = ${result}` } }, 'return', `Return: ${k} × ${sub} = ${result}`);
      callStack.pop(); callStack.pop();
      return result;
    }
    const answer = fact(n);
    rec.record({ stack: [], vars: { result: `${n}! = ${answer}` } }, 'done', `${n}! = ${answer}`);
  }

  /* ── Recursion: Fibonacci ── */
  function fibonacci(input, rec) {
    const n = Math.min(input.n || 6, 12);
    const memo = {};
    const callStack = [];
    rec.record({ stack: [], vars: { n } }, 'init', `Fibonacci(${n}) with memoization`);
    function fib(k) {
      if (memo[k] !== undefined) {
        rec.record({ stack: callStack.slice(), highlights: { [callStack.length-1]: 'done' }, vars: { cache_hit: `fib(${k})=${memo[k]}` } }, 'memo', `Cache hit: fib(${k}) = ${memo[k]}`);
        return memo[k];
      }
      callStack.push(`fib(${k})`);
      rec.record({ stack: callStack.slice(), highlights: { [callStack.length-1]: 'current' }, vars: { call: `fib(${k})` } }, 'call', `Call fib(${k})`);
      if (k <= 1) {
        memo[k] = k;
        rec.record({ stack: callStack.slice(), highlights: { [callStack.length-1]: 'done' }, vars: { base: `fib(${k})=${k}` } }, 'base', `Base case: fib(${k}) = ${k}`);
        callStack.pop(); return k;
      }
      const a = fib(k-1), b = fib(k-2);
      memo[k] = a + b;
      rec.record({ stack: callStack.slice(), highlights: { [callStack.length-1]: 'done' }, vars: { returning: `fib(${k})=${a}+${b}=${memo[k]}` } }, 'return', `fib(${k}) = fib(${k-1})+fib(${k-2}) = ${a}+${b} = ${memo[k]}`);
      callStack.pop(); return memo[k];
    }
    const answer = fib(n);
    rec.record({ stack: [], vars: { result: `fib(${n}) = ${answer}`, memo: JSON.stringify(memo) } }, 'done', `fib(${n}) = ${answer}`);
  }

  /* ── Generate Subsets ── */
  function generateSubsets(input, rec) {
    const raw = input.nums || input.array || [1, 2, 3];
    const arr = (Array.isArray(raw) ? raw : [1, 2, 3]).slice(0, 5); // max 5 for clarity
    const result = [];
    const callStack = [];
    rec.record({ array: arr, stack: [], vars: { subsets: [] } }, 'init', `Generate all subsets of [${arr}]`);
    function backtrack(start, current) {
      result.push(current.slice());
      callStack.push(`[${current}]`);
      rec.record({ array: arr, stack: callStack.slice(), highlights: current.reduce((h, _, i) => { h[i] = 'done'; return h; }, {}), vars: { current: `[${current}]`, subsets: result.length } }, 'subset', `Add subset: [${current}]`);
      for (let i = start; i < arr.length; i++) {
        current.push(arr[i]);
        rec.record({ array: arr, stack: callStack.slice(), highlights: { [i]: 'current' }, vars: { choose: arr[i], current: `[${current}]` } }, 'choose', `Choose arr[${i}]=${arr[i]}`);
        backtrack(i + 1, current);
        const removed = current.pop();
        callStack.pop();
        rec.record({ array: arr, stack: callStack.slice(), highlights: { [i]: 'rejected' }, vars: { backtrack: removed, current: `[${current}]` } }, 'backtrack', `Backtrack: remove ${removed}`);
      }
    }
    backtrack(0, []);
    rec.record({ array: arr, vars: { totalSubsets: result.length, all: result.map(s => `[${s}]`).join(', ') } }, 'done', `${result.length} subsets generated`);
  }

  window.VizAlgoStack = { stackOperations, nextGreaterElement, minStack };
  window.VizAlgoRecursion = { factorial, fibonacci, generateSubsets };
})();

