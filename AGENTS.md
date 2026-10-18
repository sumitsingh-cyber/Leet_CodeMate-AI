# CodeMate AI: project rules (for Codex or any coding agent)

- Folders: `/extension` (Chrome MV3 extension, plain JS/HTML/CSS) and `/server` (Node.js + Express backend).
- The Gemini API key lives ONLY in `server/.env` (local) and hosting env vars (production). Never in `/extension`, code, logs, git or chat.
- Use the official `@google/genai` SDK. Model name comes from `GEMINI_MODEL`. Never invent a model name.
- Minimum Chrome permissions. Host permission: `https://leetcode.com/*` only.
- Never bypass LeetCode login/paywall/CAPTCHA, never touch code submission, never call LeetCode private APIs.
- No AI call until the user clicks a section button.
- Do not log problem text or user code. Keep error messages free of stack traces and secrets.
- Be honest: separate "verified by tests" from "needs manual testing in Chrome". Never claim store approval.
- Before finishing any change run: `cd server && npm test`, `node scripts/scan-secrets.mjs`, and `cd tests && npm test`.
- Windows + VS Code + PowerShell is the user's environment.
