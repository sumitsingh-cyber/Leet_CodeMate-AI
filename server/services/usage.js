// In-memory usage tracking. Resets on restart and is NOT shared between server instances.
// For multiple instances or stronger guarantees, move this to Redis or a database.

const dayKey = () => new Date().toISOString().slice(0, 10); // UTC day

function nextResetIso() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)).toISOString();
}

export class UsageTracker {
  constructor(cfg) {
    this.cfg = cfg;
    this.day = dayKey();
    this.daily = new Map();   // "install:<id>" | "ip:<ip>" | "global" -> count
    this.windows = new Map(); // rate-limit buckets: key -> { start, count }
    this.sweeper = setInterval(() => this.sweep(), 10 * 60 * 1000);
    this.sweeper.unref?.();
  }

  rollDay() {
    const today = dayKey();
    if (today !== this.day) {
      this.day = today;
      this.daily.clear();
    }
  }

  sweep() {
    this.rollDay();
    const now = Date.now();
    for (const [k, w] of this.windows) if (now - w.start > 2 * 60 * 60 * 1000) this.windows.delete(k);
  }

  /** Fixed-window rate limit. Returns { ok, retryAfterSeconds }. */
  hit(key, max, windowMs) {
    const now = Date.now();
    const w = this.windows.get(key);
    if (!w || now - w.start >= windowMs) {
      this.windows.set(key, { start: now, count: 1 });
      return { ok: true };
    }
    if (w.count >= max) return { ok: false, retryAfterSeconds: Math.ceil((w.start + windowMs - now) / 1000) };
    w.count += 1;
    return { ok: true };
  }

  count(key) {
    this.rollDay();
    return this.daily.get(key) || 0;
  }

  /** Reserve one AI request against install, IP and global daily limits. */
  reserve(installId, ip) {
    this.rollDay();
    const { perInstallDailyLimit, perIpDailyLimit, globalDailyLimit } = this.cfg;
    const keys = { i: `install:${installId}`, p: `ip:${ip}`, g: 'global' };
    if (this.count(keys.g) >= globalDailyLimit) return { ok: false, reason: 'GLOBAL_LIMIT' };
    if (this.count(keys.p) >= perIpDailyLimit) return { ok: false, reason: 'IP_LIMIT' };
    if (this.count(keys.i) >= perInstallDailyLimit) return { ok: false, reason: 'INSTALL_LIMIT' };
    for (const k of Object.values(keys)) this.daily.set(k, this.count(k) + 1);
    return { ok: true };
  }

  /** Give back a reservation when the AI call failed through no fault of the user. */
  refund(installId, ip) {
    for (const k of [`install:${installId}`, `ip:${ip}`, 'global']) {
      const c = this.daily.get(k) || 0;
      if (c > 0) this.daily.set(k, c - 1);
    }
  }

  quota(installId) {
    const used = this.count(`install:${installId}`);
    const limit = this.cfg.perInstallDailyLimit;
    return { used, limit, remaining: Math.max(0, limit - used), resetsAt: nextResetIso() };
  }
}
