import { Router } from 'express';
import { createInstallId, signToken, verifyInstallId } from '../services/tokens.js';

export function sessionRoute(cfg, usage) {
  const router = Router();

  // Anonymous session: issues (or re-validates) an install ID and a short-lived token.
  router.post('/session', (req, res) => {
    const limited = usage.hit(`session:${req.ip}`, cfg.sessionsPerIpPerHour, 60 * 60 * 1000);
    if (!limited.ok) {
      res.set('Retry-After', String(limited.retryAfterSeconds));
      return res.status(429).json({ ok: false, error: { code: 'RATE_LIMITED', message: 'Too many sessions from this network. Try again later.' } });
    }

    let installId = req.body?.installId;
    if (!verifyInstallId(cfg.tokenSecret, installId)) installId = createInstallId(cfg.tokenSecret);

    res.json({
      ok: true,
      installId,
      token: signToken(cfg.tokenSecret, installId, cfg.tokenTtlSeconds),
      expiresInSeconds: cfg.tokenTtlSeconds,
      quota: usage.quota(installId),
    });
  });

  return router;
}
