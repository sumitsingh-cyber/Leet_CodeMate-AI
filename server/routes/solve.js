import { Router } from 'express';
import { requireToken } from '../middleware/auth.js';
import { validateSolveBody, ValidationError } from '../services/validate.js';
import { AiError } from '../services/gemini.js';

const fail = (res, status, code, message, extra = {}) =>
  res.status(status).json({ ok: false, error: { code, message }, ...extra });

export function solveRoute(cfg, usage, ai) {
  const router = Router();
  router.post('/solve', requireToken(cfg), async (req, res) => {
    if (!cfg.aiEnabled) return fail(res, 503, 'AI_DISABLED', 'AI features are temporarily turned off. Please try again later.');

    let input;
    try {
      input = validateSolveBody(req.body, cfg);
    } catch (err) {
      if (err instanceof ValidationError) return fail(res, 400, 'BAD_REQUEST', err.message);
      throw err;
    }

    const rate = usage.hit('min:' + req.installId, cfg.perInstallPerMinute, 60 * 1000);
    if (!rate.ok) {
      res.set('Retry-After', String(rate.retryAfterSeconds));
      return fail(res, 429, 'RATE_LIMITED', 'Slow down a little. Try again in ' + rate.retryAfterSeconds + 's.');
    }
    const reservation = usage.reserve(req.installId, req.ip);
    if (!reservation.ok) {
      const messages = {
        INSTALL_LIMIT: 'You have used all of today\'s free requests. They reset at midnight UTC.',
        IP_LIMIT: 'This network has reached today\'s free request limit. Try again tomorrow.',
        GLOBAL_LIMIT: 'CodeMate AI has reached its daily capacity. Please try again tomorrow.',
      };
      return fail(res, 429, reservation.reason, messages[reservation.reason], { quota: usage.quota(req.installId) });
    }

    const started = Date.now();
    try {
      const result = await ai.generate(input);
      const answer = typeof result === 'string' ? { text: result } : result;
      console.log('[solve] op=' + input.operation + ' category=' + input.category + ' lang=' + input.language + ' ms=' + (Date.now() - started) + ' ok');
      return res.json({
        ok: true,
        operation: input.operation,
        text: answer.text,
        verifiedExamples: answer.verifiedExamples || 0,
        category: input.category,
        language: input.language,
        confidence: input.classification.confidence,
        reasons: input.classification.reasons,
        quota: usage.quota(req.installId),
      });
    } catch (err) {
      if (err instanceof AiError) {
        if (err.refund) usage.refund(req.installId, req.ip);
        console.log('[solve] op=' + input.operation + ' ms=' + (Date.now() - started) + ' error=' + err.code);
        return fail(res, err.httpStatus, err.code, err.message, { quota: usage.quota(req.installId) });
      }
      usage.refund(req.installId, req.ip);
      console.error('[solve] unexpected error:', err && err.name);
      return fail(res, 500, 'INTERNAL', 'Something went wrong on the server.');
    }
  });
  return router;
}
