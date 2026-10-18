# CodeMate AI Privacy Policy

_Last updated: [DATE]. Operator: [YOUR NAME OR ORGANISATION]. Contact: [YOUR EMAIL]._
_Template: fill the bracketed parts and re-check the third-party statements against the providers' current terms before publishing._

CodeMate AI is a Chrome extension that helps you study LeetCode problems with AI. It is not affiliated with LeetCode.

## What the extension reads
On a LeetCode problem page, the extension reads visible page content when the side panel opens and again before each action. It reads the title, visible statement, examples, constraints, table schemas, tags, difficulty, editor language, starter code, and current editor code. It does not read hidden problem data or interact with submissions.

## What is sent, and when
Nothing is sent just by opening a page. When you request an AI answer, the extension sends the current visible problem context and current editor code to the CodeMate AI server for every section, including Explain, Hint, Follow-up, Review, and Optimize. It also sends:
- the selected language and locally inferred problem category and language;
- your question and up to the last 6 chat turns, only for Ask Follow-up;
- the requested hint level, only for Hint;
- an anonymous install ID and short-lived session token (random values, not linked to your name, email or Google account).

The extension re-reads the page and editor after the AI response and discards the response if the page or code changed while it was being generated.
## What we store
- **On your device** (Chrome extension storage): the anonymous install ID, the session token, and your language preference. Generated answers, hints and chat are kept **in memory only** and disappear when you close the panel.
- **On our server:** we do **not** save problem text, your code, your questions or the AI's answers. Usage counters (number of requests per install ID and IP address) are held **in server memory** to enforce daily limits and are cleared at restart or the next UTC day. Server logs contain only technical metadata (operation type, language, response time, error code), not content.
- **Hosting provider:** our hosting provider ([Render or your host]) processes network requests and may keep standard request logs, including IP addresses, under its own policy.

## Third parties
- **Google (Gemini API)** receives the prompt text described above. How Google handles API data (including whether free-tier data can be used to improve its products) depends on your plan and Google's current terms: [CONFIRM AND SUMMARISE THE CURRENT TERMS FOR THE TIER YOU USE]. Do not submit information you consider confidential.
- We do not sell your data, use it for advertising, or use it for purposes unrelated to the features you click.

## Chrome Web Store Limited Use
The use of information received from Chrome APIs and web pages adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements. Page content is used only to provide the user-facing features described here.

## Permissions
- `sidePanel`: show the assistant beside the page. `storage`: remember the install ID, session token and language. Access to `leetcode.com`: read the problem you are viewing.

## Your choices
Uninstall the extension to remove all local data. Because we do not store your content on our server, there is no account or content to delete there; for questions or requests contact [YOUR EMAIL].

## Security
Traffic uses HTTPS. The AI API key is kept on the server and never shipped in the extension. No system is perfectly secure.

## Changes
We will update this page and the "Last updated" date when behaviour changes.
