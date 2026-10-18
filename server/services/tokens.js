import crypto from 'node:crypto';

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('base64url');

function safeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/** Install IDs are random and signed, so the server can verify them without a database. */
export function createInstallId(secret) {
  const rand = crypto.randomBytes(16).toString('base64url');
  return `${rand}.${hmac(secret, `iid:${rand}`)}`;
}

export function verifyInstallId(secret, installId) {
  if (typeof installId !== 'string' || installId.length > 100) return false;
  const [rand, sig] = installId.split('.');
  if (!rand || !sig) return false;
  return safeEqual(sig, hmac(secret, `iid:${rand}`));
}

/** Short-lived session token: base64url(payload).signature */
export function signToken(secret, installId, ttlSeconds) {
  const payload = b64u(JSON.stringify({ iid: installId, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  return `${payload}.${hmac(secret, `tok:${payload}`)}`;
}

/** Returns { ok, installId } or { ok:false, reason: 'invalid' | 'expired' } */
export function verifyToken(secret, token) {
  if (typeof token !== 'string' || token.length > 600) return { ok: false, reason: 'invalid' };
  const [payload, sig] = token.split('.');
  if (!payload || !sig || !safeEqual(sig, hmac(secret, `tok:${payload}`))) return { ok: false, reason: 'invalid' };
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!verifyInstallId(secret, data.iid)) return { ok: false, reason: 'invalid' };
    if (typeof data.exp !== 'number' || data.exp < Date.now() / 1000) return { ok: false, reason: 'expired' };
    return { ok: true, installId: data.iid };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}
