# Publishing CodeMate AI on the Chrome Web Store

Nothing here means the extension is approved or live. Google reviews every submission.

## 0. Before you submit
- [ ] Backend deployed on HTTPS and tested from a fresh Chrome profile with your local server stopped.
- [ ] `extension/config.js` `BACKEND_URL` is your live `https://` URL.
- [ ] `ALLOWED_EXTENSION_IDS` on the server contains the store extension ID.
- [ ] `node scripts/scan-secrets.mjs` passes.
- [ ] Privacy policy hosted at a public URL (GitHub Pages: repo Settings, Pages, deploy from `main`; or publish `PRIVACY_POLICY.md` as a page). Fill in the bracketed parts first.
- [ ] Manual test checklist in README completed.

## 1. Register
1. Open the Chrome Web Store Developer Dashboard and sign in with a Google account.
2. Pay the one-time developer registration fee (confirm the current amount in the dashboard) and verify your contact email.

## 2. Build the ZIP
```powershell
node scripts/package-extension.mjs
```
Output: `dist\codemate-ai-<version>.zip`, with `manifest.json` at the ZIP root. The script refuses to run if secrets are found or `config.js` still points to localhost.

## 3. Create the item
Dashboard, **New item**, upload the ZIP. The dashboard now shows the permanent **extension ID**: add it to `ALLOWED_EXTENSION_IDS` on Render (comma separated with any dev ID) and redeploy.

## 4. Store listing text

**Name:** CodeMate AI

**Short description (max 132 characters):**
`Side-panel study helper for LeetCode: explanations, hints, approaches, dry runs and code review, only when you click.`

**Detailed description:**
```
CodeMate AI opens a compact side panel next to a LeetCode problem and helps you understand it. Pick one section and only that section is generated:

- Explain Problem: the question in plain English, with the examples explained
- Hint: progressive hints, one at a time, without spoiling the solution
- Approach: brute force vs. optimal, and why the optimal idea works
- Solution Code: C++, Python or Java in LeetCode format
- Dry Run: a step-by-step trace table on a sample input
- Complexity: time and space with reasons
- Edge Cases: what can go wrong and how to handle it
- Review My Code: finds logic errors in the code in your editor
- Optimize My Code: compares your code with a better approach
- Ask Follow-up: ask anything about the current problem

Privacy: nothing is sent when you just browse. Problem text (and your code, for Review/Optimize) is sent to the CodeMate AI server and Google Gemini only when you click a section. Free daily limits apply.

AI answers can be wrong. Always check the logic and test the code yourself. CodeMate AI is an independent tool and is not affiliated with or endorsed by LeetCode.
```

**Category:** Education (or Developer Tools). **Language:** English.

## 5. Privacy tab answers

**Single purpose:** "Help users understand and practise LeetCode problems by generating AI explanations, hints, dry runs and code reviews in a side panel for the problem the user is viewing."

**Permission justifications**
| Permission | Justification |
|---|---|
| `sidePanel` | Shows the assistant in Chrome's side panel next to the problem page. |
| `storage` | Saves an anonymous install ID, a short-lived session token and the user's language preference locally. |
| Host `https://leetcode.com/*` (and content scripts on `/problems/*`) | Reads the title, statement and editor code of the problem the user is viewing. The `MAIN`-world helper only reads the editor text when the side panel asks for it. |

**Remote code:** No. All code is in the package. The extension sends data to the developer's backend but does not load or execute remote scripts.

**Data usage disclosure (verify against the dashboard's current options):**
- Website content: yes (problem text and the user's editor code, sent only when a section is clicked).
- Not collected: personally identifiable information, health, financial, authentication, location, web history, user activity (keystrokes, clicks), personal communications.
- Certify: data is not sold, not used for unrelated purposes, not used for creditworthiness or lending.
- Link the privacy policy URL.

## 6. Graphics
- Icon 128x128 (included: `extension/icons/icon128.png`).
- Screenshots 1280x800, 1 to 5. Suggested: (1) panel beside a problem with the 10 buttons; (2) Explain Problem result; (3) Dry Run table; (4) Solution Code with copy button; (5) Hint progression. Use a free problem and capture real output from your own server. Do not use LeetCode logos as your own branding.
- Optional small promo tile 440x280.

## 7. Submit and review
Click **Submit for review**. Review can take from a day to several weeks. In the **test instructions** field write: "Open https://leetcode.com/problems/two-sum/ (no login needed), reload the tab, click the CodeMate AI toolbar icon, then click 'Explain Problem'. Requests go to https://<your-service>.onrender.com. The first request may take up to a minute if the free server is waking up."

If rejected, read the email, fix the specific policy cited (commonly: missing/unclear privacy disclosure, over-broad permissions, listing claims), update the listing or ZIP, and resubmit with a short reply explaining the change.

## 8. Updates
1. Bump `version` in `extension/manifest.json` (for example 1.0.1).
2. Rebuild the ZIP, then Dashboard, your item, **Package**, **Upload new package**, submit.
3. Server-side changes (prompts, limits) need no store review. Redeploy on Render.
