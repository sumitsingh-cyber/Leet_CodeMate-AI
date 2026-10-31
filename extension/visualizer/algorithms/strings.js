/* CodeMate AI – String Algorithms */
(() => {
  /* ── Palindrome Check (LeetCode 125) ── */
  function isPalindrome(input, rec) {
    const raw = input.s !== undefined ? input.s : (input.string || 'racecar');
    // LeetCode 125 checks alphanumeric only, case-insensitive
    const cleaned = String(raw).toLowerCase().replace(/[^a-z0-9]/g, '');
    const chars = cleaned.split('');
    let l = 0, r = chars.length - 1;
    rec.record({ chars: chars.slice(), highlights: { [l]: 'slow', [r]: 'fast' }, vars: { rawString: `"${raw}"`, cleaned: `"${cleaned}"`, left: l, right: r } }, 'init', `Palindrome check for "${raw}" (cleaned: "${cleaned}")`);
    if (!chars.length) {
      rec.record({ chars: [], vars: { isPalindrome: true }, actualOutput: true }, 'done', 'Empty cleaned string is a palindrome (true).');
      return;
    }
    while (l < r) {
      const h = { [l]: 'compare', [r]: 'compare' };
      rec.record({ chars: chars.slice(), highlights: h, vars: { leftIndex: l, rightIndex: r, leftChar: chars[l], rightChar: chars[r] } }, 'compare', `Compare chars[${l}]='${chars[l]}' with chars[${r}]='${chars[r]}'`);
      if (chars[l] !== chars[r]) {
        h[l] = 'rejected'; h[r] = 'rejected';
        rec.record({ chars: chars.slice(), highlights: h, vars: { result: false, mismatch: `'${chars[l]}' ≠ '${chars[r]}'` }, actualOutput: false }, 'fail', `Mismatch! '${chars[l]}' ≠ '${chars[r]}'. NOT a palindrome.`);
        return;
      }
      h[l] = 'done'; h[r] = 'done';
      rec.record({ chars: chars.slice(), highlights: { ...h }, vars: { left: l + 1, right: r - 1 } }, 'match', `Match! Move pointers inward.`);
      l++; r--;
    }
    const allDone = {}; chars.forEach((_, i) => allDone[i] = 'done');
    rec.record({ chars: chars.slice(), highlights: allDone, vars: { isPalindrome: true }, actualOutput: true }, 'done', `"${raw}" IS a valid palindrome! (returns true)`);
  }

  /* ── Anagram Check (LeetCode 242) ── */
  function isAnagram(input, rec) {
    const s = String(input.s !== undefined ? input.s : (input.string || 'anagram'));
    const t = String(input.t !== undefined ? input.t : (input.target || 'nagaram'));
    const charsS = s.split(''), charsT = t.split('');
    rec.record({ chars: charsS, vars: { s: `"${s}"`, t: `"${t}"`, result: '?' } }, 'init', `Anagram check: "${s}" vs "${t}"`);
    if (s.length !== t.length) {
      rec.record({ chars: charsS, vars: { result: false, reason: `Length mismatch (${s.length} vs ${t.length})` }, actualOutput: false }, 'done', `Different lengths (${s.length} vs ${t.length}) → NOT anagrams.`);
      return;
    }
    const freq = {};
    for (let i = 0; i < charsS.length; i++) {
      freq[charsS[i]] = (freq[charsS[i]] || 0) + 1;
      rec.record({ chars: charsS, highlights: { [i]: 'current' }, vars: { processing: charsS[i], freq: JSON.stringify(freq) } }, 'count', `Count '${charsS[i]}' in s → freq: ${JSON.stringify(freq)}`);
    }
    for (let i = 0; i < charsT.length; i++) {
      freq[charsT[i]] = (freq[charsT[i]] || 0) - 1;
      const h = { [i]: freq[charsT[i]] < 0 ? 'rejected' : 'compare' };
      rec.record({ chars: charsT, highlights: h, vars: { processing: charsT[i], freq: JSON.stringify(freq) } }, 'decount', `Subtract '${charsT[i]}' from t → freq: ${JSON.stringify(freq)}`);
      if (freq[charsT[i]] < 0) {
        rec.record({ chars: charsT, vars: { result: false }, actualOutput: false }, 'done', `'${charsT[i]}' appears more times in t than in s → NOT anagrams (false).`);
        return;
      }
    }
    const allDone = {}; charsS.forEach((_, i) => allDone[i] = 'done');
    rec.record({ chars: charsS, highlights: allDone, vars: { isAnagram: true }, actualOutput: true }, 'done', `"${s}" and "${t}" ARE anagrams! (returns true)`);
  }

  /* ── Longest Substring Without Repeating Characters (LeetCode 3) ── */
  function lengthOfLongestSubstring(input, rec) {
    const raw = input.s !== undefined ? input.s : (input.string || 'abcabcbb');
    const chars = String(raw).split('');
    const n = chars.length;
    let l = 0, maxLen = 0, maxStart = 0;
    const seen = {};
    rec.record({ chars: chars.slice(), vars: { left: 0, right: 0, maxLen: 0, currentWindow: '""' } }, 'init', `Longest Unique Substring for "${raw}"`);
    for (let r = 0; r < n; r++) {
      const ch = chars[r];
      rec.record({ chars: chars.slice(), highlights: { [r]: 'current', [l]: 'compare' }, vars: { left: l, right: r, char: ch, seen: JSON.stringify(seen) } }, 'check', `Add '${ch}' at r=${r}. Check for duplicate in current window.`);
      if (seen[ch] !== undefined && seen[ch] >= l) {
        rec.record({ chars: chars.slice(), highlights: { [seen[ch]]: 'rejected', [r]: 'compare' }, vars: { left: seen[ch] + 1, duplicateChar: ch } }, 'shrink', `Duplicate '${ch}' at index ${seen[ch]}. Advance left pointer to ${seen[ch] + 1}.`);
        l = seen[ch] + 1;
      }
      seen[ch] = r;
      const winLen = r - l + 1;
      const h = {}; for (let k = l; k <= r; k++) h[k] = winLen > maxLen ? 'done' : 'compare';
      if (winLen > maxLen) { maxLen = winLen; maxStart = l; }
      rec.record({ chars: chars.slice(), highlights: h, vars: { left: l, right: r, window: `"${chars.slice(l, r + 1).join('')}"`, currentLen: winLen, maxLen } }, 'window', `Window "${chars.slice(l, r + 1).join('')}" (length ${winLen}). Current maxLen = ${maxLen}`);
    }
    const hf = {}; for (let k = maxStart; k < maxStart + maxLen; k++) hf[k] = 'done';
    const resultSubstr = chars.slice(maxStart, maxStart + maxLen).join('');
    rec.record({ chars: chars.slice(), highlights: hf, vars: { resultSubstring: `"${resultSubstr}"`, maxLen }, actualOutput: maxLen }, 'done', `Longest unique substring is "${resultSubstr}" with length ${maxLen}.`);
  }

  /* ── Valid Parentheses (LeetCode 20) ── */
  function validParentheses(input, rec) {
    const raw = input.s !== undefined ? input.s : (input.string || '()[]{}');
    const chars = String(raw).split('');
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    rec.record({ chars: chars.slice(), stack: stack.slice(), vars: { inputString: `"${raw}"`, stack: '[]' } }, 'init', `Valid Parentheses check for "${raw}"`);

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const h = { [i]: 'current' };
      if ('([{'.includes(ch)) {
        stack.push(ch);
        rec.record({ chars: chars.slice(), highlights: h, stack: stack.slice(), vars: { char: ch, action: `Push '${ch}' to stack`, stack: `[${stack.join(', ')}]` } }, 'push', `Opening bracket '${ch}' → push onto stack`);
      } else {
        const top = stack[stack.length - 1];
        if (map[ch] !== top) {
          h[i] = 'rejected';
          rec.record({
            chars: chars.slice(),
            highlights: h,
            stack: stack.slice(),
            vars: { char: ch, expected: map[ch], actualTop: top || 'empty', result: false },
            actualOutput: false
          }, 'fail', `Mismatch! '${ch}' expects matching '${map[ch]}' but top is '${top || 'empty'}' → INVALID (false).`);
          return;
        }
        stack.pop();
        rec.record({ chars: chars.slice(), highlights: { [i]: 'done' }, stack: stack.slice(), vars: { matched: `${map[ch]}${ch}`, stack: `[${stack.join(', ')}]` } }, 'pop', `Matching bracket '${map[ch]}${ch}' → pop from stack`);
      }
    }
    const isValid = stack.length === 0;
    const finalH = {};
    chars.forEach((_, i) => finalH[i] = isValid ? 'done' : 'rejected');
    rec.record({
      chars: chars.slice(),
      highlights: finalH,
      stack: stack.slice(),
      vars: { result: isValid, stackEmpty: stack.length === 0 },
      actualOutput: isValid
    }, 'done', isValid ? 'All brackets matched correctly! Stack is empty → VALID (true).' : 'Unclosed brackets remain in stack → INVALID (false).');
  }

  /* ── Reverse String (LeetCode 344) ── */
  function reverseString(input, rec) {
    const raw = input.s !== undefined ? input.s : (input.string || 'hello');
    const chars = (Array.isArray(raw) ? raw : String(raw).split('')).slice();
    let l = 0, r = chars.length - 1;
    rec.record({ chars: chars.slice(), highlights: { [l]: 'slow', [r]: 'fast' }, vars: { left: l, right: r } }, 'init', `Reverse: [${chars.join(', ')}]`);
    while (l < r) {
      const h = { [l]: 'compare', [r]: 'compare' };
      rec.record({ chars: chars.slice(), highlights: h, vars: { left: l, right: r, swapping: `'${chars[l]}' ↔ '${chars[r]}'` } }, 'swap', `Swap chars[${l}]='${chars[l]}' and chars[${r}]='${chars[r]}'`);
      [chars[l], chars[r]] = [chars[r], chars[l]];
      const hd = { [l]: 'done', [r]: 'done' };
      rec.record({ chars: chars.slice(), highlights: hd, vars: { current: `[${chars.join(', ')}]` } }, 'swapped', `After swap: [${chars.join(', ')}]`);
      l++; r--;
    }
    const allDone = {}; chars.forEach((_, i) => allDone[i] = 'done');
    rec.record({ chars: chars.slice(), highlights: allDone, vars: { reversed: `[${chars.join(', ')}]` }, actualOutput: chars.slice() }, 'done', `Reversed: [${chars.join(', ')}]`);
  }

  window.VizAlgoStrings = { isPalindrome, isAnagram, lengthOfLongestSubstring, validParentheses, reverseString };
})();
