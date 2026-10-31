/* CodeMate AI – Array Algorithms */
(() => {
  const { StepRecorder } = window.VizEngine;

  /* ── Two Sum – Brute Force ── */
  function twoSumBrute(input, rec) {
    const arr = input.array.slice();
    const target = input.target;
    const n = arr.length;
    rec.record({ array: arr, vars: { target, i: '-', j: '-', result: '?' } }, 'init', `Two Sum (brute force). Array: [${arr}], target: ${target}`);
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const h = {}; h[i] = 'current'; h[j] = 'compare';
        rec.record({ array: arr, highlights: h, vars: { target, i, j, sum: arr[i] + arr[j] } }, 'compare', `Checking arr[${i}]+arr[${j}] = ${arr[i]}+${arr[j]} = ${arr[i]+arr[j]}`);
        if (arr[i] + arr[j] === target) {
          const fh = {}; fh[i] = 'done'; fh[j] = 'done';
          rec.record({ array: arr, highlights: fh, vars: { target, result: `[${i}, ${j}]` } }, 'found', `Found! Indices [${i}, ${j}] → ${arr[i]} + ${arr[j]} = ${target}`);
          return;
        }
      }
    }
    rec.record({ array: arr, vars: { target, result: 'not found' } }, 'done', 'No two sum pair found.');
  }

  /* ── Two Sum – Hash Map ── */
  function twoSumHash(input, rec) {
    const arr = input.array.slice();
    const target = input.target;
    const map = {};
    rec.record({ array: arr, vars: { target, map: '{}' } }, 'init', `Two Sum (hash map). Array: [${arr}], target: ${target}`);
    for (let i = 0; i < arr.length; i++) {
      const need = target - arr[i];
      const h = {}; h[i] = 'current';
      rec.record({ array: arr, highlights: h, vars: { target, i, val: arr[i], need, map: JSON.stringify(map) } }, 'check', `Looking for complement ${need} in map`);
      if (map[need] !== undefined) {
        const fh = {}; fh[map[need]] = 'done'; fh[i] = 'done';
        rec.record({ array: arr, highlights: fh, vars: { result: `[${map[need]}, ${i}]` } }, 'found', `Found! ${need} was at index ${map[need]}. Answer: [${map[need]}, ${i}]`);
        return;
      }
      map[arr[i]] = i;
      rec.record({ array: arr, highlights: { [i]: 'compare' }, vars: { target, map: JSON.stringify(map) } }, 'store', `Store arr[${i}]=${arr[i]} → index ${i} in map`);
    }
    rec.record({ array: arr, vars: { result: 'not found' } }, 'done', 'No pair found.');
  }

  /* ── Two Sum – Two Pointers (sorted) ── */
  function twoSumTwoPointers(input, rec) {
    const arr = input.array.slice().sort((a, b) => a - b);
    const target = input.target;
    let l = 0, r = arr.length - 1;
    rec.record({ array: arr, highlights: { [l]: 'slow', [r]: 'fast' }, vars: { target, l, r } }, 'init', `Two Sum (two pointers on sorted array). target: ${target}`);
    while (l < r) {
      const sum = arr[l] + arr[r];
      const h = { [l]: 'slow', [r]: 'fast' };
      rec.record({ array: arr, highlights: h, vars: { l, r, sum, target } }, 'compare', `arr[${l}]+arr[${r}] = ${sum} vs target ${target}`);
      if (sum === target) {
        rec.record({ array: arr, highlights: { [l]: 'done', [r]: 'done' }, vars: { result: `[${l}, ${r}]` } }, 'found', `Found! [${l}, ${r}] → ${arr[l]}+${arr[r]}=${target}`);
        return;
      } else if (sum < target) {
        rec.record({ array: arr, highlights: h, vars: { l: l+1, r, action: 'move l right' } }, 'move', `Sum too small, move left pointer right`);
        l++;
      } else {
        rec.record({ array: arr, highlights: h, vars: { l, r: r-1, action: 'move r left' } }, 'move', `Sum too large, move right pointer left`);
        r--;
      }
    }
    rec.record({ array: arr, vars: { result: 'not found' } }, 'done', 'No pair found.');
  }

  /* ── Binary Search ── */
  function binarySearch(input, rec) {
    const arr = input.array.slice().sort((a, b) => a - b);
    const target = input.target;
    let lo = 0, hi = arr.length - 1;
    rec.record({ array: arr, vars: { target, lo, hi, mid: '-' } }, 'init', `Binary Search for ${target} in [${arr}]`);
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const h = {};
      for (let i = lo; i <= hi; i++) h[i] = 'compare';
      h[mid] = 'current';
      rec.record({ array: arr, highlights: h, vars: { lo, hi, mid, val: arr[mid], target } }, 'compare', `mid=${mid}, arr[mid]=${arr[mid]}, target=${target}`);
      if (arr[mid] === target) {
        rec.record({ array: arr, highlights: { [mid]: 'done' }, vars: { result: mid } }, 'found', `Found ${target} at index ${mid}!`);
        return;
      } else if (arr[mid] < target) {
        lo = mid + 1;
        rec.record({ array: arr, highlights: h, vars: { lo, hi, action: 'search right half' } }, 'move', `arr[mid] < target, move lo to ${lo}`);
      } else {
        hi = mid - 1;
        rec.record({ array: arr, highlights: h, vars: { lo, hi, action: 'search left half' } }, 'move', `arr[mid] > target, move hi to ${hi}`);
      }
    }
    rec.record({ array: arr, vars: { result: -1 } }, 'done', `${target} not found in array.`);
  }

  /* ── Bubble Sort ── */
  function bubbleSort(input, rec) {
    const arr = input.array.slice();
    const n = arr.length;
    let swaps = 0, cmps = 0;
    rec.record({ array: arr.slice(), vars: { pass: 0, swaps, comparisons: cmps } }, 'init', `Bubble Sort. Array: [${arr}]`);
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        cmps++;
        const h = { [j]: 'current', [j+1]: 'compare' };
        for (let k = n - i; k < n; k++) h[k] = 'done';
        rec.record({ array: arr.slice(), highlights: h, vars: { pass: i+1, j, comparing: `arr[${j}] vs arr[${j+1}]`, comparisons: cmps, swaps } }, 'compare', `Compare arr[${j}]=${arr[j]} with arr[${j+1}]=${arr[j+1]}`);
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
          swaps++;
          const h2 = { [j]: 'compare', [j+1]: 'current' };
          for (let k = n - i; k < n; k++) h2[k] = 'done';
          rec.record({ array: arr.slice(), highlights: h2, vars: { pass: i+1, swapped: `${arr[j+1]}↔${arr[j]}`, comparisons: cmps, swaps } }, 'swap', `Swap → [${arr}]`);
        }
      }
      const hDone = {};
      for (let k = n - i - 1; k < n; k++) hDone[k] = 'done';
      rec.record({ array: arr.slice(), highlights: hDone, vars: { pass: i+1, comparisons: cmps, swaps } }, 'pass', `Pass ${i+1} done. Largest element bubbled to position ${n-i-1}.`);
    }
    const allDone = {}; arr.forEach((_, i) => allDone[i] = 'done');
    rec.record({ array: arr.slice(), highlights: allDone, vars: { sorted: true, comparisons: cmps, swaps } }, 'done', `Sorted! [${arr}] — ${cmps} comparisons, ${swaps} swaps`);
  }

  /* ── Selection Sort ── */
  function selectionSort(input, rec) {
    const arr = input.array.slice();
    const n = arr.length;
    rec.record({ array: arr.slice(), vars: { pass: 0 } }, 'init', `Selection Sort: [${arr}]`);
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      const h = {}; for (let k = 0; k < i; k++) h[k] = 'done'; h[i] = 'current';
      rec.record({ array: arr.slice(), highlights: { ...h }, vars: { i, minIdx, minVal: arr[minIdx] } }, 'pass', `Pass ${i+1}: assume min at index ${i} (val=${arr[i]})`);
      for (let j = i + 1; j < n; j++) {
        const h2 = { ...h, [j]: 'compare' }; if (minIdx !== i) h2[minIdx] = 'pivot';
        rec.record({ array: arr.slice(), highlights: h2, vars: { i, j, minIdx, minVal: arr[minIdx], checking: arr[j] } }, 'compare', `Compare arr[${j}]=${arr[j]} with current min ${arr[minIdx]}`);
        if (arr[j] < arr[minIdx]) {
          if (minIdx !== i) h2[minIdx] = 'inactive';
          minIdx = j; h2[j] = 'pivot';
          rec.record({ array: arr.slice(), highlights: h2, vars: { i, minIdx, minVal: arr[minIdx] } }, 'update', `New min: arr[${minIdx}]=${arr[minIdx]}`);
        }
      }
      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        const hs = {}; for (let k = 0; k < i; k++) hs[k] = 'done'; hs[i] = 'done'; hs[minIdx] = 'compare';
        rec.record({ array: arr.slice(), highlights: hs, vars: { swapped: `index ${i} ↔ ${minIdx}` } }, 'swap', `Swap indices ${i} and ${minIdx} → [${arr}]`);
      }
    }
    const allDone = {}; arr.forEach((_, i) => allDone[i] = 'done');
    rec.record({ array: arr.slice(), highlights: allDone, vars: { sorted: true } }, 'done', `Selection Sort complete! [${arr}]`);
  }

  /* ── Insertion Sort ── */
  function insertionSort(input, rec) {
    const arr = input.array.slice();
    const n = arr.length;
    rec.record({ array: arr.slice(), highlights: { 0: 'done' }, vars: {} }, 'init', `Insertion Sort: [${arr}]`);
    for (let i = 1; i < n; i++) {
      const key = arr[i];
      let j = i - 1;
      const h = {}; for (let k = 0; k < i; k++) h[k] = 'done'; h[i] = 'current';
      rec.record({ array: arr.slice(), highlights: { ...h }, vars: { i, key, j } }, 'pick', `Pick arr[${i}]=${key} to insert`);
      while (j >= 0 && arr[j] > key) {
        arr[j + 1] = arr[j];
        const h2 = {}; for (let k = 0; k <= i; k++) h2[k] = k <= j ? 'compare' : 'current';
        rec.record({ array: arr.slice(), highlights: h2, vars: { key, j, shifted: arr[j] } }, 'shift', `Shift arr[${j}]=${arr[j]} right`);
        j--;
      }
      arr[j + 1] = key;
      const hd = {}; for (let k = 0; k <= i; k++) hd[k] = 'done';
      rec.record({ array: arr.slice(), highlights: hd, vars: { key, insertedAt: j+1 } }, 'insert', `Insert ${key} at position ${j+1} → [${arr}]`);
    }
    const allDone = {}; arr.forEach((_, i) => allDone[i] = 'done');
    rec.record({ array: arr.slice(), highlights: allDone, vars: { sorted: true } }, 'done', `Insertion Sort complete! [${arr}]`);
  }

  /* ── Merge Sort ── */
  function mergeSortAlgo(input, rec) {
    const arr = input.array.slice();
    rec.record({ array: arr.slice(), vars: {} }, 'init', `Merge Sort: [${arr}]`);
    function merge(a, lo, mid, hi) {
      const left = a.slice(lo, mid + 1), right = a.slice(mid + 1, hi + 1);
      const h = {}; for (let k = lo; k <= hi; k++) h[k] = 'compare';
      rec.record({ array: a.slice(), highlights: { ...h }, vars: { merging: `[${lo}..${mid}] + [${mid+1}..${hi}]`, left: `[${left}]`, right: `[${right}]` } }, 'merge', `Merging [${lo}..${mid}] and [${mid+1}..${hi}]`);
      let i = 0, j = 0, k = lo;
      while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) { a[k++] = left[i++]; } else { a[k++] = right[j++]; }
      }
      while (i < left.length) a[k++] = left[i++];
      while (j < right.length) a[k++] = right[j++];
      const hd = {}; for (let x = lo; x <= hi; x++) hd[x] = 'done';
      rec.record({ array: a.slice(), highlights: hd, vars: { merged: `[${a.slice(lo, hi+1)}]` } }, 'merged', `Merged segment [${lo}..${hi}]: [${a.slice(lo, hi+1)}]`);
    }
    function mergeSort(a, lo, hi) {
      if (lo >= hi) {
        rec.record({ array: a.slice(), highlights: { [lo]: 'done' }, vars: { base: `single element at ${lo}` } }, 'base', `Base case: single element arr[${lo}]=${a[lo]}`);
        return;
      }
      const mid = Math.floor((lo + hi) / 2);
      const h = {}; for (let k = lo; k <= hi; k++) h[k] = 'current';
      rec.record({ array: a.slice(), highlights: h, vars: { lo, mid, hi } }, 'divide', `Divide [${lo}..${hi}] at mid=${mid}`);
      mergeSort(a, lo, mid);
      mergeSort(a, mid + 1, hi);
      merge(a, lo, mid, hi);
    }
    mergeSort(arr, 0, arr.length - 1);
    const allDone = {}; arr.forEach((_, i) => allDone[i] = 'done');
    rec.record({ array: arr.slice(), highlights: allDone, vars: { sorted: true } }, 'done', `Merge Sort complete! [${arr}]`);
  }

  /* ── Quick Sort ── */
  function quickSortAlgo(input, rec) {
    const arr = input.array.slice();
    rec.record({ array: arr.slice(), vars: {} }, 'init', `Quick Sort: [${arr}]`);
    function partition(a, lo, hi) {
      const pivot = a[hi];
      let i = lo - 1;
      const h = {}; for (let k = lo; k <= hi; k++) h[k] = 'compare'; h[hi] = 'pivot';
      rec.record({ array: a.slice(), highlights: { ...h }, vars: { pivot, lo, hi, i } }, 'pivot', `Pivot = ${pivot} at index ${hi}`);
      for (let j = lo; j < hi; j++) {
        const h2 = {}; for (let k = lo; k <= hi; k++) h2[k] = 'compare'; h2[hi] = 'pivot'; h2[j] = 'current'; if (i >= lo) h2[i] = 'done';
        rec.record({ array: a.slice(), highlights: h2, vars: { pivot, j, val: a[j], i } }, 'compare', `Compare arr[${j}]=${a[j]} with pivot ${pivot}`);
        if (a[j] <= pivot) {
          i++;
          [a[i], a[j]] = [a[j], a[i]];
          const h3 = { ...h2, [i]: 'done', [j]: 'compare' };
          rec.record({ array: a.slice(), highlights: h3, vars: { swapped: `${i}↔${j}` } }, 'swap', `arr[${j}] ≤ pivot → swap with i=${i}`);
        }
      }
      [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
      const pIdx = i + 1;
      const hf = {}; for (let k = lo; k <= hi; k++) hf[k] = 'compare'; hf[pIdx] = 'done';
      rec.record({ array: a.slice(), highlights: hf, vars: { pivotAt: pIdx } }, 'place', `Pivot ${pivot} placed at index ${pIdx}`);
      return pIdx;
    }
    function quickSort(a, lo, hi) {
      if (lo >= hi) {
        if (lo === hi) { const h = {}; h[lo] = 'done'; rec.record({ array: a.slice(), highlights: h, vars: {} }, 'base', `Base: single element ${a[lo]}`); }
        return;
      }
      const p = partition(a, lo, hi);
      quickSort(a, lo, p - 1);
      quickSort(a, p + 1, hi);
    }
    quickSort(arr, 0, arr.length - 1);
    const allDone = {}; arr.forEach((_, i) => allDone[i] = 'done');
    rec.record({ array: arr.slice(), highlights: allDone, vars: { sorted: true } }, 'done', `Quick Sort complete! [${arr}]`);
  }

  /* ── Sliding Window – Max Sum Subarray of size k ── */
  function slidingWindowMax(input, rec) {
    const arr = input.array.slice();
    const k = input.k || 3;
    const n = arr.length;
    if (k > n) { rec.record({ array: arr, vars: { error: 'k > n' } }, 'error', 'k must be ≤ array length'); return; }
    let windowSum = 0;
    for (let i = 0; i < k; i++) windowSum += arr[i];
    let maxSum = windowSum;
    const h = {}; for (let i = 0; i < k; i++) h[i] = 'compare';
    rec.record({ array: arr, highlights: { ...h }, vars: { window: `[0..${k-1}]`, windowSum, maxSum } }, 'init', `Initial window [0..${k-1}] sum=${windowSum}`);
    for (let i = k; i < n; i++) {
      windowSum += arr[i] - arr[i - k];
      const h2 = {}; for (let j = i - k + 1; j <= i; j++) h2[j] = 'current'; h2[i - k] = 'rejected';
      if (windowSum > maxSum) { maxSum = windowSum; for (let j = i - k + 1; j <= i; j++) h2[j] = 'done'; }
      rec.record({ array: arr, highlights: h2, vars: { window: `[${i-k+1}..${i}]`, windowSum, maxSum, added: arr[i], removed: arr[i-k] } }, 'slide', `Slide window: add arr[${i}]=${arr[i]}, remove arr[${i-k}]=${arr[i-k]}. Sum=${windowSum}`);
    }
    rec.record({ array: arr, vars: { maxSum, k } }, 'done', `Max subarray sum of size ${k} = ${maxSum}`);
  }

  /* ── Prefix Sum ── */
  function prefixSum(input, rec) {
    const arr = input.array.slice();
    const prefix = new Array(arr.length + 1).fill(0);
    rec.record({ array: arr, vars: { prefix: prefix.slice() } }, 'init', `Computing prefix sum of [${arr}]`);
    for (let i = 0; i < arr.length; i++) {
      prefix[i + 1] = prefix[i] + arr[i];
      const h = {}; h[i] = 'current';
      rec.record({ array: arr, highlights: h, vars: { i, 'prefix[i+1]': prefix[i+1], formula: `prefix[${i}] + arr[${i}] = ${prefix[i]} + ${arr[i]}` } }, 'compute', `prefix[${i+1}] = ${prefix[i+1]}`);
    }
    rec.record({ array: prefix.slice(1), vars: { prefix: prefix.slice() } }, 'done', `Prefix sum array: [${prefix.slice(1)}]`);
  }

  /* ── Move Zeroes ── */
  function moveZeroes(input, rec) {
    const arr = input.array.slice();
    let pos = 0;
    rec.record({ array: arr.slice(), vars: { pos } }, 'init', `Move Zeroes: [${arr}]`);
    for (let i = 0; i < arr.length; i++) {
      const h = { [i]: 'current', [pos]: 'compare' };
      rec.record({ array: arr.slice(), highlights: h, vars: { i, pos, val: arr[i] } }, 'check', `Check arr[${i}]=${arr[i]}`);
      if (arr[i] !== 0) {
        if (i !== pos) {
          [arr[pos], arr[i]] = [arr[i], arr[pos]];
          rec.record({ array: arr.slice(), highlights: { [pos]: 'done', [i]: 'compare' }, vars: { swapped: `pos=${pos} ↔ i=${i}` } }, 'swap', `Non-zero: swap arr[${pos}]↔arr[${i}] → [${arr}]`);
        }
        pos++;
      }
    }
    const allDone = {}; arr.forEach((_, i) => allDone[i] = i < pos ? 'done' : 'inactive');
    rec.record({ array: arr.slice(), highlights: allDone, vars: { result: `[${arr}]` } }, 'done', `Done! [${arr}]`);
  }

  /* ── Kadane's Algorithm (Max Subarray) ── */
  function kadane(input, rec) {
    const arr = input.array.slice();
    let maxSoFar = arr[0], maxEndingHere = arr[0], start = 0, end = 0, tempStart = 0;
    rec.record({ array: arr, highlights: { 0: 'current' }, vars: { maxSoFar, maxEndingHere, start, end } }, 'init', `Kadane's Algorithm: [${arr}]`);
    for (let i = 1; i < arr.length; i++) {
      const h = { [i]: 'current' };
      for (let k = start; k <= end; k++) h[k] = 'done';
      if (arr[i] > maxEndingHere + arr[i]) {
        maxEndingHere = arr[i]; tempStart = i;
        rec.record({ array: arr, highlights: h, vars: { i, maxEndingHere, action: 'start fresh' } }, 'reset', `arr[${i}]=${arr[i]} better alone — start new subarray`);
      } else {
        maxEndingHere = maxEndingHere + arr[i];
        rec.record({ array: arr, highlights: h, vars: { i, maxEndingHere, action: 'extend' } }, 'extend', `Extend subarray: maxEndingHere=${maxEndingHere}`);
      }
      if (maxEndingHere > maxSoFar) {
        maxSoFar = maxEndingHere; start = tempStart; end = i;
        const hd = {}; for (let k = start; k <= end; k++) hd[k] = 'done';
        rec.record({ array: arr, highlights: hd, vars: { maxSoFar, start, end } }, 'update', `New max: ${maxSoFar} at [${start}..${end}]`);
      }
    }
    const hf = {}; for (let k = start; k <= end; k++) hf[k] = 'done';
    rec.record({ array: arr, highlights: hf, vars: { maxSubarraySum: maxSoFar, from: start, to: end } }, 'done', `Max subarray sum = ${maxSoFar} from index ${start} to ${end}`);
  }

  window.VizAlgoArrays = {
    twoSumBrute, twoSumHash, twoSumTwoPointers,
    binarySearch,
    bubbleSort, selectionSort, insertionSort, mergeSortAlgo, quickSortAlgo,
    slidingWindowMax, prefixSum, moveZeroes, kadane
  };
})();

