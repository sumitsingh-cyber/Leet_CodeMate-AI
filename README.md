# CodeMate AI

A Chrome extension that opens a **narrow side panel** next to a LeetCode problem. Ten buttons (Explain Problem, Hint, Approach, Solution Code, Dry Run, Complexity, Edge Cases, Review My Code, Optimize My Code, Ask Follow-up) generate **only that section** on demand through your backend and Google Gemini. Auto mode classifies visible algorithm, SQL, Pandas, and shell problems and selects a language from the editor or schema.

```
Chrome extension (side panel) --HTTPS--> your Express backend --> Google Gemini API
   no keys inside                        key + limits + kill switch live here
```

Not affiliated with LeetCode. The extension only reads the visible problem page; it does not use LeetCode private APIs or touch submissions.

## What is in this repo

| Path | Purpose |
|---|---|
| `extension/` | The Chrome extension (Manifest V3, side panel). Load this folder unpacked. |
| `server/` | Node.js + Express backend (Gemini calls, sessions, quotas, kill switch). |
| `tests/` | Headless end-to-end test (side panel + content script vs. the real backend with a mock AI). |
| `scripts/` | `scan-secrets.mjs` (finds leaked keys) and `package-extension.mjs` (builds the store ZIP). |
| `docs/PUBLISHING.md` | Chrome Web Store listing text, permission justifications, review steps. |
| `PRIVACY_POLICY.md` | Privacy policy template matching what the code actually does. |
| `render.yaml` | Optional Render blueprint. |

## What you need (accounts and tools)

| Need | Cost | Needed for |
|---|---|---|
| Node.js LTS (18.18 or newer) | Free | Running the backend |
| Google AI Studio account + API key (https://aistudio.google.com) | Free tier exists with limits; check current limits and terms | AI answers |
| GitHub account | Free | Hosting code and the privacy-policy page |
| Render account (or similar Node host) | Free instances may sleep when idle; check current terms | Public backend |
| Chrome Web Store developer account | One-time registration fee (about 5 USD; confirm in the dashboard) | Publishing |

You do **not** need any LeetCode API.

## 1. Run it locally (Windows PowerShell)

```powershell
cd codemate-ai\server
npm install
Copy-Item .env.example .env
notepad .env
```

In `.env` set:

```
GEMINI_API_KEY=<your NEW key from AI Studio>
GEMINI_MODEL=<exact model name shown in AI Studio that your key can use>
TOKEN_SECRET=<random 32+ chars>
```

Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

> Never paste your key into chat, into the extension, or into any file except `server/.env`. If a key was ever shared, delete it in AI Studio and create a new one.

Start the server and check it:

```powershell
npm start
# in a second PowerShell window:
Invoke-RestMethod http://localhost:3000/health
```

Try it without Chrome (two steps: get a session, then ask for an explanation):

```powershell
$s = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/session -ContentType 'application/json' -Body '{}'
$body = @{
  operation = 'explain'; language = 'cpp'; title = 'Two Sum'
  description = 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume exactly one solution.'
} | ConvertTo-Json
(Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/solve -Headers @{Authorization = "Bearer $($s.token)"} -ContentType 'application/json' -Body $body).text
```

No key yet? Set `MOCK_AI=true` in `.env` to get canned answers (refused in production).

## 2. Load the extension in Chrome

1. Open `chrome://extensions`, switch on **Developer mode**.
2. Click **Load unpacked** and pick the `extension` folder.
3. Pin CodeMate AI from the puzzle-piece menu.
4. Open a problem such as `https://leetcode.com/problems/4sum/`. **Reload the tab once** (scripts are injected on page load).
5. Click the CodeMate AI icon. The panel opens on the right. The problem title appears with a green dot.
6. Click a section button. Only that section is generated.

The configured HTTPS Render backend URL is kept in extension/config.js. For local development, temporarily set BACKEND_URL to http://localhost:3000 and restore the deployed URL before packaging. Reload the extension on chrome://extensions after edits.

## 3. Test checklist

Already verified by automated tests in this repo (run them yourself, see "Commands"):
- Backend: health, token required, all 10 operations, validation, daily quota, per-minute limit, kill switch, tampered tokens, CORS rules, body-size limit, prompt building, missing-key error.
- Side panel + content script in a simulated browser: title/code extraction with fallbacks, no API call before a click, caching, 4 progressive hints, follow-up chat, language switch, copy buttons, clear, error and offline states, XSS-safe Markdown.
- Secret scan, and ZIP packaging (manifest at ZIP root, refuses localhost config).

**Not yet verified (you must test):**
- [ ] Real Gemini answers (needs your key and model). Check quality for 5+ problems and all 10 sections, in C++, Python and Java.
- [ ] Real LeetCode DOM: title, statement and editor code on at least Two Sum, 4Sum, Add Two Numbers, and 3 more. LeetCode changes its markup often; if extraction fails, see Troubleshooting.
- [ ] Switching problems without reload (panel should update within about a second).
- [ ] Review/Optimize with code in the editor, and with an empty editor.
- [ ] Side panel at its narrowest width (drag the panel edge).
- [ ] Production backend from a fresh Chrome profile with your local server turned off.
- [ ] Limits: exceed the daily limit and confirm the message; set `AI_ENABLED=false` and confirm AI stops.

## 4. Security model (read this)

- The API key exists only on the server. `node scripts/scan-secrets.mjs` checks the repo and that `.env` is not tracked.
- **CORS is not authentication.** The server issues an anonymous, signed **install ID**, exchanged for a **1-hour token**. Every AI call needs a valid token and passes: per-install per-minute limit, per-install daily quota, per-IP daily quota, and a **global daily cap**. Kill switch: `AI_ENABLED=false`.
- Input is validated (operation, classification, examples, schema, language, and lengths). Structured code answers require statement evidence and matching hand-checks for every parsed example; failed verification may retry once when VERIFY_RETRY=true. Request body limit 60 KB. Output tokens capped. 90 s AI timeout.
- Logs contain only metadata (operation, language, timing, error code). Never problem text, code, or keys.

**Honest limits of anonymous access:** anyone can create a new install ID by clearing extension storage or calling `/api/session` with a script. Per-IP limits slow this down but shared networks (schools, offices) share a quota, and people with many IPs can get around it. The global daily cap is your real cost protection. Counters live in server memory: they reset on restart and are not shared across multiple instances. If abuse appears: lower the limits, set `AI_ENABLED=false`, or add real sign-in (for example Google sign-in) and a database or Redis for counters.

## 5. Deploy the backend on Render

1. In Render, create a **Blueprint** and connect this repository: `sumitsingh-cyber/Leet_CodeMate-AI`. The checked-in `render.yaml` sets the service root to `server`, uses `npm install` / `npm start`, and generates `TOKEN_SECRET`.
2. In the Render service's environment settings, set `GEMINI_API_KEY` and `GEMINI_MODEL` using the values from your local `server/.env`. Keep both only in Render's environment settings, never in Git.
3. The Blueprint is preconfigured with the unpacked extension ID. For a store release, add its permanent ID to `ALLOWED_EXTENSION_IDS`, comma separated. Production blocks other extension origins. The Blueprint already sets `NODE_ENV=production` and `AI_ENABLED=true`; it also provides the default request limits.
4. Deploy and check `https://<your-service>.onrender.com/health`; it should return JSON with `ok: true`.
The configured HTTPS Render backend URL is kept in extension/config.js. For local development, temporarily set BACKEND_URL to http://localhost:3000 and restore the deployed URL before packaging. Reload the extension on chrome://extensions after edits.

Render instances can restart. Usage counters are held in memory, so they reset on restart and are not shared between multiple instances; the global daily cap is not a durable billing limit.

**Cost control:** set a spending cap/budget alert in your Google Cloud / AI Studio project, keep `GLOBAL_DAILY_LIMIT` modest, and watch the Render logs. Pricing and free-tier limits change, so check Google's current pages.

## 6. Publish on the Chrome Web Store

See `docs/PUBLISHING.md` for the full listing text, permission justifications, screenshot plan and review steps. Short version:

```powershell
node scripts/package-extension.mjs   # scans for secrets, refuses localhost, writes dist\codemate-ai-<version>.zip
```

Upload the ZIP in the Chrome Web Store Developer Dashboard, fill the listing and privacy tabs, host `PRIVACY_POLICY.md` (GitHub Pages works), and submit. Approval is decided by Google; do not announce it as live before it is. To update: bump `version` in `manifest.json`, rebuild the ZIP, upload as a new version.

## Commands

```powershell
cd server;  npm install; npm test                 # backend tests (no key needed)
cd tests;   npm install; npm test                 # headless extension + backend test
node scripts/scan-secrets.mjs                     # secret scan (from repo root)
node scripts/package-extension.mjs                # store ZIP (from repo root)
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Panel says "Reload the LeetCode tab" | The page was open before the extension loaded. Reload the tab (Ctrl+R), then press the refresh icon in the panel. |
| "Problem text not found" | LeetCode may have changed its layout. Wait for the page to finish loading and refresh. If it persists, update the selectors in `extension/content.js` (`extractDescription`); several strategies already exist. |
| Review/Optimize says no code | Click inside the editor once, make sure code is present, click the section again. Only the visible lines are read if LeetCode hides its editor model. |
| "Cannot reach the CodeMate AI server" | Server not running, wrong `BACKEND_URL`, or Render is waking up. Check `/health`. |
| `SERVER_MISCONFIGURED` | Missing/invalid `GEMINI_API_KEY` or wrong `GEMINI_MODEL`. Check the server log (it prints the status code only). |
| CORS error in the panel console | In production add your extension ID to `ALLOWED_EXTENSION_IDS`. |
| 429 messages | Per-minute, daily, IP or global limits. Adjust env vars. Limits reset at 00:00 UTC. |
| Panel does not open on icon click | Update Chrome (side panel needs Chrome 114+; this extension requires 116+). Reload the extension. |
