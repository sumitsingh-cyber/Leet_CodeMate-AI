// Builds dist/codemate-ai-<version>.zip with manifest.json at the ZIP root (what the Chrome Web Store needs).
// Pure Node, no dependencies. Usage (from repo root):  node scripts/package-extension.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const extDir = path.join(root, 'extension');

// Safety first: run the secret scan.
try { execSync('node scripts/scan-secrets.mjs', { cwd: root, stdio: 'inherit' }); } catch { console.error('Packaging stopped: secret scan failed.'); process.exit(1); }

const manifest = JSON.parse(fs.readFileSync(path.join(extDir, 'manifest.json'), 'utf8'));
const config = fs.readFileSync(path.join(extDir, 'config.js'), 'utf8');
if (/localhost|127\.0\.0\.1/.test(config.replace(/^\s*\/\/.*$/gm, ''))) {
  console.error('Packaging stopped: extension/config.js still points to localhost. Set BACKEND_URL to your deployed https:// server first.');
  process.exit(1);
}

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (!/^\.|\.map$|\.md$/i.test(e.name)) files.push(full);
  }
})(extDir);

const locals = []; const centrals = []; let offset = 0;
for (const full of files) {
  const name = path.relative(extDir, full).split(path.sep).join('/'); // forward slashes
  const data = fs.readFileSync(full);
  const comp = zlib.deflateRawSync(data);
  const crc = crc32(data);
  const nameBuf = Buffer.from(name);
  const lh = Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8);
  lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0x21, 12); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22);
  lh.writeUInt16LE(nameBuf.length, 26); lh.writeUInt16LE(0, 28);
  locals.push(lh, nameBuf, comp);
  const ch = Buffer.alloc(46);
  ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10);
  ch.writeUInt16LE(0, 12); ch.writeUInt16LE(0x21, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24);
  ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt32LE(offset, 42);
  centrals.push(ch, nameBuf);
  offset += lh.length + nameBuf.length + comp.length;
}
const centralBuf = Buffer.concat(centrals);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralBuf.length, 12); end.writeUInt32LE(offset, 16);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist', `codemate-ai-${manifest.version}.zip`);
fs.writeFileSync(out, Buffer.concat([...locals, centralBuf, end]));
console.log(`Created ${path.relative(root, out)} (${files.length} files, manifest.json at the ZIP root).`);
