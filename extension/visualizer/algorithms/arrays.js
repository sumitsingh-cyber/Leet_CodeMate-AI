/* CodeMate AI – Array Algorithms */
(() => {
  /* ── Remove Duplicates from Sorted Array (LeetCode 26) ── */
  function removeDuplicates(input, rec) {
    const raw = input.nums || input.array || [1, 1, 2];
    const arr = raw.slice();
    const n = arr.length;
    if (n === 0) {
      rec.record({ array: [], vars: { k: 0 } }, 'done', 'Empty array → 0 unique elements');
      return;
    }

    let i = 0;
    rec.record({
      array: arr.slice(),
      highlights: { 0: 'done' },
      vars: { i: 0, j: 1, k: 1, 'nums[i]': arr[0], 'nums[j]': arr[1] !== undefined ? arr[1] : '-', unique: `[${arr[0]}]` },
      ignoredFrom: -1,
      actualOutput: { k: 1, unique: [arr[0]] }
    }, 'init', `Start with nums[0]=${arr[0]} at index 0 as unique (i=0)`);

    for (let j = 1; j < n; j++) {
      const h = { [i]: 'slow', [j]: 'compare' };
      for (let idx = 0; idx < i; idx++) h[idx] = 'done';

      rec.record({
        array: arr.slice(),
        highlights: h,
        vars: { i, j, 'nums[i]': arr[i], 'nums[j]': arr[j], comparing: `${arr[i]} vs ${arr[j]}` },
        ignoredFrom: -1
      }, 'compare', `Compare nums[i]=${arr[i]} and nums[j]=${arr[j]}`);

      if (arr[j] !== arr[i]) {
        i++;
        const prevVal = arr[i];
        arr[i] = arr[j];
        const h2 = { [i]: 'current', [j]: 'compare' };
        for (let idx = 0; idx < i; idx++) h2[idx] = 'done';

        rec.record({
          array: arr.slice(),
          highlights: h2,
          vars: { i, j, k: i + 1, 'nums[i]': arr[i], action: `nums[${i}] = nums[${j}] (${arr[j]})` },
          ignoredFrom: -1
        }, 'update', `Unique element ${arr[j]} found! Advance i to ${i} and set nums[${i}] = ${arr[j]}`);
      } else {
        const hDup = { [i]: 'slow', [j]: 'rejected' };
        for (let idx = 0; idx < i; idx++) hDup[idx] = 'done';
        rec.record({
          array: arr.slice(),
          highlights: hDup,
          vars: { i, j, 'nums[i]': arr[i], 'nums[j]': arr[j], duplicate: true },
          ignoredFrom: -1
        }, 'duplicate', `Duplicate value ${arr[j]} found at j=${j}. Move j forward.`);
      }
    }

    const k = i + 1;
    const finalHighlights = {};
    for (let idx = 0; idx < k; idx++) finalHighlights[idx] = 'done';
    for (let idx = k; idx < n; idx++) finalHighlights[idx] = 'inactive';

    const uniquePortion = arr.slice(0, k);
    rec.record({
      array: arr.slice(),
      highlights: finalHighlights,
      vars: { k, uniquePortion: `[${uniquePortion.join(', ')}]`, ignoredElements: n - k },
      ignoredFrom: k,
      actualOutput: { k, unique: uniquePortion }
    }, 'done', `Algorithm complete! k = ${k}. First ${k} elements [${uniquePortion.join(', ')}] are unique. Elements beyond index ${k - 1} are ignored.`);
  }

  /* ── Best Time to Buy and Sell Stock (LeetCode 121) ── */
  function maxProfit(input, rec) {
    const raw = input.prices || input.nums || input.array || [7, 1, 5, 3, 6, 4];
    const prices = raw.slice();
    if (!prices.length) {
      rec.record({ array: [], vars: { maxProfit: 0 } }, 'done', 'Empty prices → 0 profit');
      return;
    }
    let minPrice = prices[0];
    let maxProfitVal = 0;
    let buyDay = 0;
    let sellDay = 0;

    rec.record({
      array: prices.slice(),
      highlights: { 0: 'current' },
      vars: { day: 0, price: prices[0], minPrice, maxProfit: 0, buyDay: 0 }
    }, 'init', `Day 0: Initial buy price = ${prices[0]}`);

    for (let i = 1; i < prices.length; i++) {
      const price = prices[i];
      const h = { [buyDay]: 'done', [i]: 'compare' };
      const currentProfit = price - minPrice;

      rec.record({
        array: prices.slice(),
        highlights: h,
        vars: { day: i, currentPrice: price, minPrice, potentialProfit: currentProfit, maxProfit: maxProfitVal }
      }, 'check', `Day ${i}: price = ${price}. Profit if sold today: ${price} - ${minPrice} = ${currentProfit}`);

      if (price < minPrice) {
        minPrice = price;
        buyDay = i;
        rec.record({
          array: prices.slice(),
          highlights: { [i]: 'current' },
          vars: { day: i, newMinPrice: minPrice, buyDay: i, maxProfit: maxProfitVal }
        }, 'new_min', `Day ${i}: New lowest buying price = ${minPrice}! Update buyDay to ${i}`);
      } else if (currentProfit > maxProfitVal) {
        maxProfitVal = currentProfit;
        sellDay = i;
        rec.record({
          array: prices.slice(),
          highlights: { [buyDay]: 'done', [sellDay]: 'current' },
          vars: { buyDay, sellDay, buyPrice: prices[buyDay], sellPrice: price, maxProfit: maxProfitVal }
        }, 'new_max', `Day ${i}: New max profit = ${maxProfitVal}! (Buy day ${buyDay} at ${prices[buyDay]}, sell day ${sellDay} at ${price})`);
      }
    }

    const hFinal = {};
    if (maxProfitVal > 0) {
      hFinal[buyDay] = 'done';
      hFinal[sellDay] = 'done';
    }
    rec.record({
      array: prices.slice(),
      highlights: hFinal,
      vars: { maxProfit: maxProfitVal, buyDay, sellDay, buyPrice: prices[buyDay], sellPrice: prices[sellDay] },
      actualOutput: { maxProfit: maxProfitVal, buyDay, sellDay }
    }, 'done', maxProfitVal > 0
      ? `Maximum profit is ${maxProfitVal} (buy on day ${buyDay} at ${prices[buyDay]}, sell on day ${sellDay} at ${prices[sellDay]}).`
      : 'No profit possible. Max profit = 0.');
  }

  /* ── Two Sum – Brute Force ── */
  function twoSumBrute(input, rec) {
    const arr = (input.nums || input.array || [2, 7, 11, 15]).slice();
    const target = input.target !== undefined ? input.target : 9;
    const n = arr.length;
    rec.record({ array: arr, vars: { target, i: '-', j: '-', result: '?' } }, 'init', `Two Sum (brute force). Array: [${arr}], target: ${target}`);
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const h = {}; h[i] = 'current'; h[j] = 'compare';
        rec.record({ array: arr, highlights: h, vars: { target, i, j, sum: arr[i] + arr[j] } }, 'compare', `Checking arr[${i}]+arr[${j}] = ${arr[i]}+${arr[j]} = ${arr[i]+arr[j]}`);
        if (arr[i] + arr[j] === target) {
          const fh = {}; fh[i] = 'done'; fh[j] = 'done';
          rec.record({ array: arr, highlights: fh, vars: { target, result: `[${i}, ${j}]` }, actualOutput: [i, j] }, 'found', `Found! Indices [${i}, ${j}] → ${arr[i]} + ${arr[j]} = ${target}`);
          return;
        }
      }
    }
    rec.record({ array: arr, vars: { target, result: 'not found' } }, 'done', 'No two sum pair found.');
  }

  /* ── Two Sum – Hash Map (LeetCode 1) ── */
  function twoSumHash(input, rec) {
    const arr = (input.nums || input.array || [2, 7, 11, 15]).slice();
    const target = input.target !== undefined ? input.target : 9;
    const map = {};
    rec.record({ array: arr, vars: { target, map: '{}' } }, 'init', `Two Sum (hash map). Array: [${arr}], target: ${target}`);
    for (let i = 0; i < arr.length; i++) {
      const need = target - arr[i];
      const h = {}; h[i] = 'current';
      rec.record({ array: arr, highlights: h, vars: { target, i, val: arr[i], need, map: JSON.stringify(map) } }, 'check', `Index ${i}: arr[${i}]=${arr[i]}. Need complement ${target} - ${arr[i]} = ${need}`);
      if (map[need] !== undefined) {
        const fh = {}; fh[map[need]] = 'done'; fh[i] = 'done';
        rec.record({ array: arr, highlights: fh, vars: { result: `[${map[need]}, ${i}]` }, actualOutput: [map[need], i] }, 'found', `Found! Complement ${need} was stored at index ${map[need]}. Result: [${map[need]}, ${i}]`);
        return;
      }
      map[arr[i]] = i;
      rec.record({ array: arr, highlights: { [i]: 'compare' }, vars: { target, map: JSON.stringify(map) } }, 'store', `Store arr[${i}]=${arr[i]} → index ${i} in map`);
    }
    rec.record({ array: arr, vars: { result: 'not found' } }, 'done', 'No pair found.');
  }

  /* ── Two Sum – Two Pointers (LeetCode 167) ── */
  function twoSumTwoPointers(input, rec) {
    const raw = input.numbers || input.nums || input.array || [2, 7, 11, 15];
    const arr = raw.slice();
    const target = input.target !== undefined ? input.target : 9;
    let l = 0, r = arr.length - 1;
    rec.record({ array: arr, highlights: { [l]: 'slow', [r]: 'fast' }, vars: { target, left: l, right: r } }, 'init', `Two Sum II (Two Pointers on sorted array). Target = ${target}`);
    while (l < r) {
      const sum = arr[l] + arr[r];
      const h = { [l]: 'slow', [r]: 'fast' };
      rec.record({ array: arr, highlights: h, vars: { left: l, right: r, sum, target } }, 'compare', `arr[${l}]+arr[${r}] = ${arr[l]}+${arr[r]} = ${sum} vs target ${target}`);
      if (sum === target) {
        rec.record({ array: arr, highlights: { [l]: 'done', [r]: 'done' }, vars: { result: `[${l + 1}, ${r + 1}] (1-indexed)` }, actualOutput: [l + 1, r + 1] }, 'found', `Found! Indices [${l + 1}, ${r + 1}] (1-indexed) → ${arr[l]} + ${arr[r]} = ${target}`);
        return;
      } else if (sum < target) {
        rec.record({ array: arr, highlights: h, vars: { left: l + 1, right: r, action: 'Sum too small → move left pointer right' } }, 'move', `Sum ${sum} < target ${target} → move left pointer to ${l + 1}`);
        l++;
      } else {
        rec.record({ array: arr, highlights: h, vars: { left: l, right: r - 1, action: 'Sum too large → move right pointer left' } }, 'move', `Sum ${sum} > target ${target} → move right pointer to ${r - 1}`);
        r--;
      }
    }
    rec.record({ array: arr, vars: { result: 'not found' } }, 'done', 'No pair found.');
  }

  /* ── Binary Search (LeetCode 704 & 35) ── */
  function binarySearch(input, rec) {
    const raw = input.nums || input.array || [-1, 0, 3, 5, 9, 12];
    const arr = raw.slice();
    const target = input.target !== undefined ? input.target : 9;
    let lo = 0, hi = arr.length - 1;
    rec.record({ array: arr, vars: { target, lo, hi, mid: '-' } }, 'init', `Binary Search for target ${target} in sorted array`);
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const h = {};
      for (let i = lo; i <= hi; i++) h[i] = 'compare';
      h[mid] = 'current';
      rec.record({ array: arr, highlights: h, vars: { lo, hi, mid, val: arr[mid], target } }, 'compare', `mid = ${mid}, arr[${mid}] = ${arr[mid]}, target = ${target}`);
      if (arr[mid] === target) {
        rec.record({ array: arr, highlights: { [mid]: 'done' }, vars: { result: mid }, actualOutput: mid }, 'found', `Found target ${target} at index ${mid}!`);
        return;
      } else if (arr[mid] < target) {
        lo = mid + 1;
        rec.record({ array: arr, highlights: h, vars: { lo, hi, action: 'Search right half' } }, 'move', `arr[mid] (${arr[mid]}) < target (${target}) → move lo to ${lo}`);
      } else {
        hi = mid - 1;
        rec.record({ array: arr, highlights: h, vars: { lo, hi, action: 'Search left half' } }, 'move', `arr[mid] (${arr[mid]}) > target (${target}) → move hi to ${hi}`);
      }
    }
    rec.record({ array: arr, vars: { result: -1 }, actualOutput: -1 }, 'done', `Target ${target} not found in array (result = -1).`);
  }

  /* ── Bubble Sort ── */
  function bubbleSort(input, rec) {
    const arr = (input.nums || input.array || [5, 2, 8, 1, 9, 3]).slice();
    const n = arr.length;
    let swaps = 0, cmps = 0;
    rec.record({ array: arr.slice(), vars: { pass: 0, swaps, comparisons: cmps } }, 'init', `Bubble Sort: [${arr}]`);
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        cmps++;
        const h = { [j]: 'current', [j + 1]: 'compare' };
        for (let k = n - i; k < n; k++) h[k] = 'done';
        rec.record({ array: arr.slice(), highlights: h, vars: { pass: i + 1, j, comparing: `arr[${j}] vs arr[${j+1}]`, comparisons: cmps, swaps } }, 'compare', `Compare arr[${j}]=${arr[j]} with arr[${j+1}]=${arr[j+1]}`);
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          swaps++;
          const h2 = { [j]: 'compare', [j + 1]: 'current' };
          for (let k = n - i; k < n; k++) h2[k] = 'done';
          rec.record({ array: arr.slice(), highlights: h2, vars: { pass: i + 1, swapped: `${arr[j+1]}↔${arr[j]}`, comparisons: cmps, swaps } }, 'swap', `Swap → [${arr}]`);
        }
      }
      const hDone = {};
      for (let k = n - i - 1; k < n; k++) hDone[k] = 'done';
      rec.record({ array: arr.slice(), highlights: hDone, vars: { pass: i + 1, comparisons: cmps, swaps } }, 'pass', `Pass ${i + 1} done. Largest element bubbled to position ${n - i - 1}.`);
    }
    const allDone = {}; arr.forEach((_, i) => allDone[i] = 'done');
    rec.record({ array: arr.slice(), highlights: allDone, vars: { sorted: true, comparisons: cmps, swaps }, actualOutput: arr.slice() }, 'done', `Sorted! [${arr}] — ${cmps} comparisons, ${swaps} swaps`);
  }

  /* ── Selection Sort ── */
  function selectionSort(input, rec) {
    const arr = (input.nums || input.array || [64, 25, 12, 22, 11]).slice();
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
    rec.record({ array: arr.slice(), highlights: allDone, vars: { sorted: true }, actualOutput: arr.slice() }, 'done', `Selection Sort complete! [${arr}]`);
  }

  /* ── Insertion Sort ── */
  function insertionSort(input, rec) {
    const arr = (input.nums || input.array || [12, 11, 13, 5, 6]).slice();
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
      rec.record({ array: arr.slice(), highlights: hd, vars: { key, insertedAt: j + 1 } }, 'insert', `Insert ${key} at position ${j + 1} → [${arr}]`);
    }
    const allDone = {}; arr.forEach((_, i) => allDone[i] = 'done');
    rec.record({ array: arr.slice(), highlights: allDone, vars: { sorted: true }, actualOutput: arr.slice() }, 'done', `Insertion Sort complete! [${arr}]`);
  }

  /* ── Merge Sort ── */
  function mergeSortAlgo(input, rec) {
    const arr = (input.nums || input.array || [38, 27, 43, 3, 9, 82, 10]).slice();
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
    rec.record({ array: arr.slice(), highlights: allDone, vars: { sorted: true }, actualOutput: arr.slice() }, 'done', `Merge Sort complete! [${arr}]`);
  }

  /* ── Quick Sort ── */
  function quickSortAlgo(input, rec) {
    const arr = (input.nums || input.array || [10, 80, 30, 90, 40, 50, 70]).slice();
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
    rec.record({ array: arr.slice(), highlights: allDone, vars: { sorted: true }, actualOutput: arr.slice() }, 'done', `Quick Sort complete! [${arr}]`);
  }

  /* ── Sliding Window – Max Sum Subarray of size k ── */
  function slidingWindowMax(input, rec) {
    const arr = (input.nums || input.array || [2, 1, 5, 1, 3, 2]).slice();
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
    rec.record({ array: arr, vars: { maxSum, k }, actualOutput: maxSum }, 'done', `Max subarray sum of size ${k} = ${maxSum}`);
  }

  /* ── Prefix Sum ── */
  function prefixSum(input, rec) {
    const arr = (input.nums || input.array || [1, 2, 3, 4, 5]).slice();
    const prefix = new Array(arr.length + 1).fill(0);
    rec.record({ array: arr, vars: { prefix: prefix.slice() } }, 'init', `Computing prefix sum of [${arr}]`);
    for (let i = 0; i < arr.length; i++) {
      prefix[i + 1] = prefix[i] + arr[i];
      const h = {}; h[i] = 'current';
      rec.record({ array: arr, highlights: h, vars: { i, 'prefix[i+1]': prefix[i+1], formula: `prefix[${i}] + arr[${i}] = ${prefix[i]} + ${arr[i]}` } }, 'compute', `prefix[${i+1}] = ${prefix[i+1]}`);
    }
    rec.record({ array: prefix.slice(1), vars: { prefix: prefix.slice() }, actualOutput: prefix.slice(1) }, 'done', `Prefix sum array: [${prefix.slice(1)}]`);
  }

  /* ── Move Zeroes (LeetCode 283) ── */
  function moveZeroes(input, rec) {
    const arr = (input.nums || input.array || [0, 1, 0, 3, 12]).slice();
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
    rec.record({ array: arr.slice(), highlights: allDone, vars: { result: `[${arr}]` }, actualOutput: arr.slice() }, 'done', `Done! [${arr}]`);
  }

  /* ── Kadane's Algorithm (LeetCode 53) ── */
  function kadane(input, rec) {
    const arr = (input.nums || input.array || [-2, 1, -3, 4, -1, 2, 1, -5, 4]).slice();
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
    rec.record({ array: arr, highlights: hf, vars: { maxSubarraySum: maxSoFar, from: start, to: end }, actualOutput: maxSoFar }, 'done', `Max subarray sum = ${maxSoFar} from index ${start} to ${end}`);
  }

  window.VizAlgoArrays = {
    removeDuplicates,
    maxProfit,
    twoSumBrute, twoSumHash, twoSumTwoPointers,
    binarySearch,
    bubbleSort, selectionSort, insertionSort, mergeSortAlgo, quickSortAlgo,
    slidingWindowMax, prefixSum, moveZeroes, kadane
  };
})();
