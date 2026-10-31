/* CodeMate AI – String Algorithms */
(() => {
  /* ── Palindrome Check ── */
  function isPalindrome(input, rec) {
    const chars = input.string.split('');
    let l = 0, r = chars.length - 1;
    rec.record({ chars: chars.slice(), highlights: { [l]: 'slow', [r]: 'fast' }, vars: { l, r, isPalindrome: '?' } }, 'init', `Palindrome check: "${input.string}"`);
    while (l < r) {
      const h = { [l]: 'compare', [r]: 'compare' };
      rec.record({ chars: chars.slice(), highlights: h, vars: { l, r, left: chars[l], right: chars[r] } }, 'compare', `Compare chars[${l}]='${chars[l]}' with chars[${r}]='${chars[r]}'`);
      if (chars[l] !== chars[r]) {
        h[l] = 'rejected'; h[r] = 'rejected';
        rec.record({ chars: chars.slice(), highlights: h, vars: { result: false, mismatch: `'${chars[l]}' ≠ '${chars[r]}'` } }, 'fail', `Mismatch! '${chars[l]}' ≠ '${chars[r]}'. NOT a palindrome.`);
        return;
      }
      h[l] = 'done'; h[r] = 'done';
      rec.record({ chars: chars.slice(), highlights: { ...h }, vars: { l: l+1, r: r-1 } }, 'match', `Match! Move pointers inward.`);
      l++; r--;
    }
    const allDone = {}; chars.forEach((_, i) => allDone[i] = 'done');
    rec.record({ chars: chars.slice(), highlights: allDone, vars: { isPalindrome: true } }, 'done', `"${input.string}" IS a palindrome!`);
  }

  /* ── Anagram Check ── */
  function isAnagram(input, rec) {
    const s = input.string, t = input.target || '';
    const charsS = s.split(''), charsT = t.split('');
    rec.record({ chars: charsS, vars: { s, t, result: '?' } }, 'init', `Anagram check: "${s}" vs "${t}"`);
    if (s.length !== t.length) {
      rec.record({ chars: charsS, vars: { result: false, reason: 'Different lengths' } }, 'done', `Different lengths (${s.length} vs ${t.length}) → NOT anagrams`);
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
        rec.record({ chars: charsT, vars: { result: false } }, 'done', `'${charsT[i]}' appears more in t → NOT anagrams`);
        return;
      }
    }
    const allDone = {}; charsS.forEach((_, i) => allDone[i] = 'done');
    rec.record({ chars: charsS, highlights: allDone, vars: { isAnagram: true } }, 'done', `"${s}" and "${t}" ARE anagrams!`);
  }

  /* ── Longest Substring Without Repeating Characters ── */
  function lengthOfLongestSubstring(input, rec) {
    const chars = input.string.split('');
    const n = chars.length;
    let l = 0, maxLen = 0, maxStart = 0;
    const seen = {};
    rec.record({ chars: chars.slice(), vars: { l, r: 0, maxLen, seen: '{}' } }, 'init', `Longest Unique Substring: "${input.string}"`);
    for (let r = 0; r < n; r++) {
      const ch = chars[r];
      rec.record({ chars: chars.slice(), highlights: { [r]: 'current', [l]: 'compare' }, vars: { l, r, char: ch, seen: JSON.stringify(seen) } }, 'check', `Add '${ch}' at r=${r}, checking for duplicate`);
      if (seen[ch] !== undefined && seen[ch] >= l) {
        rec.record({ chars: chars.slice(), highlights: { [seen[ch]]: 'rejected', [r]: 'compare' }, vars: { l: seen[ch]+1, duplicate: ch } }, 'shrink', `Duplicate '${ch}' found. Move l to ${seen[ch]+1}`);
        l = seen[ch] + 1;
      }
      seen[ch] = r;
      const winLen = r - l + 1;
      const h = {}; for (let k = l; k <= r; k++) h[k] = winLen > maxLen ? 'done' : 'compare';
      if (winLen > maxLen) { maxLen = winLen; maxStart = l; }
      rec.record({ chars: chars.slice(), highlights: h, vars: { l, r, window: chars.slice(l, r+1).join(''), length: winLen, maxLen } }, 'window', `Window "${chars.slice(l, r+1).join('')}" len=${winLen}, maxLen=${maxLen}`);
    }
    const hf = {}; for (let k = maxStart; k < maxStart + maxLen; k++) hf[k] = 'done';
    rec.record({ chars: chars.slice(), highlights: hf, vars: { result: chars.slice(maxStart, maxStart+maxLen).join(''), maxLen } }, 'done', `Longest unique substring: "${chars.slice(maxStart, maxStart+maxLen).join('')}" (length=${maxLen})`);
  }

  /* ── Valid Parentheses ── */
  function validParentheses(input, rec) {
    const chars = input.string.split('');
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    rec.record({ chars: chars.slice(), stack: stack.slice(), vars: { result: '?' } }, 'init', `Valid Parentheses: "${input.string}"`);
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const h = { [i]: 'current' };
      if ('([{'.includes(ch)) {
        stack.push(ch);
        rec.record({ chars: chars.slice(), highlights: h, stack: stack.slice(), vars: { pushed: ch } }, 'push', `Open bracket '${ch}' → push to stack`);
      } else {
        const top = stack[stack.length - 1];
        if (map[ch] !== top) {
          h[i] = 'rejected';
          rec.record({ chars: chars.slice(), highlights: h, stack: stack.slice(), vars: { expected: map[ch], got: top } }, 'fail', `'${ch}' expects '${map[ch]}' but top is '${top}' → INVALID`);
          return;
        }
        stack.pop();
        rec.record({ chars: chars.slice(), highlights: { [i]: 'done' }, stack: stack.slice(), vars: { matched: `${map[ch]}${ch}` } }, 'pop', `Matched '${map[ch]}${ch}' → pop from stack`);
      }
    }
    const isValid = stack.length === 0;
    rec.record({ chars: chars.slice(), highlights: chars.reduce((h, _, i) => { h[i] = isValid ? 'done' : 'rejected'; return h; }, {}), stack: stack.slice(), vars: { result: isValid } }, 'done', isValid ? '✓ Valid parentheses!' : '✗ Stack not empty → Invalid');
  }

  /* ── Reverse String ── */
  function reverseString(input, rec) {
    const chars = input.string.split('');
    let l = 0, r = chars.length - 1;
    rec.record({ chars: chars.slice(), highlights: { [l]: 'slow', [r]: 'fast' }, vars: { l, r } }, 'init', `Reverse: "${input.string}"`);
    while (l < r) {
      const h = { [l]: 'compare', [r]: 'compare' };
      rec.record({ chars: chars.slice(), highlights: h, vars: { l, r, swapping: `'${chars[l]}' ↔ '${chars[r]}'` } }, 'swap', `Swap chars[${l}]='${chars[l]}' and chars[${r}]='${chars[r]}'`);
      [chars[l], chars[r]] = [chars[r], chars[l]];
      const hd = { [l]: 'done', [r]: 'done' };
      rec.record({ chars: chars.slice(), highlights: hd, vars: { result: chars.join('') } }, 'swapped', `After swap: "${chars.join('')}"`);
      l++; r--;
    }
    const allDone = {}; chars.forEach((_, i) => allDone[i] = 'done');
    rec.record({ chars: chars.slice(), highlights: allDone, vars: { reversed: chars.join('') } }, 'done', `Reversed: "${chars.join('')}"`);
  }

  window.VizAlgoStrings = { isPalindrome, isAnagram, lengthOfLongestSubstring, validParentheses, reverseString };
})();

