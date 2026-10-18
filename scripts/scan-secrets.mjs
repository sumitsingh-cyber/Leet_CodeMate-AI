// Fails (exit 1) if anything that looks like an API key is in the repo, or if .env files are tracked by git.
// Usage (from repo root):  node scripts/scan-secrets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist']);
const SKIP_FILES = new Set(['.env']); // local secrets file is allowed to exist, but must not be committed
const PATTERNS = [
  [/AIza[0-9A-Za-z_-]{30,}/, 'Google API key'],
  [/\bAQ\.[A-Za-z0-9_-]{25,}/, 'Google AI Studio style key'],
  [/\bsk-[A-Za-z0-9_-]{20,}/, 'OpenAI style key'],
  [/GEMINI_API_KEY\s*[:=]\s*["']?[A-Za-z0-9_.-]{20,}/, 'GEMINI_API_KEY assigned a value'],
  [/TOKEN_SECRET\s*[:=]\s*["']?[A-Za-z0-9_.-]{20,}/, 'TOKEN_SECRET assigned a value'],
];

let problems = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) { if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name)); continue; }
    if (SKIP_FILES.has(entry.name) || /\.(png|jpg|zip|ico)$/i.test(entry.name)) continue;
    const file = path.join(dir, entry.name);
    const text = fs.readFileSync(file, 'utf8');
    for (const [re, label] of PATTERNS) {
      if (re.test(text)) { console.error(`FOUND ${label}: ${path.relative(root, file)}`); problems++; }
    }
  }
}
walk(root);

// Extension folder must not mention the secret variable names at all.
for (const f of fs.readdirSync(path.join(root, 'extension'))) {
  const p = path.join(root, 'extension', f);
  if (fs.statSync(p).isFile() && /\.(js|html|json|css)$/.test(f) && /GEMINI_API_KEY|OPENAI_API_KEY|TOKEN_SECRET/i.test(fs.readFileSync(p, 'utf8'))) {
    console.error(`extension/${f} mentions an API-key variable name`); problems++;
  }
}

// Git: .env must not be tracked.
try {
  const tracked = execSync('git ls-files', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().split('\n');
  for (const f of tracked) if (/(^|\/)\.env(\..*)?$/.test(f) && !f.endsWith('.env.example')) { console.error(`TRACKED BY GIT: ${f}`); problems++; }
} catch { console.log('(not a git repository yet: skipped the git check)'); }

if (problems) { console.error(`\n${problems} problem(s) found. Do NOT publish or push until fixed.`); process.exit(1); }
console.log('Secret scan passed: no keys found, .env not tracked.');
