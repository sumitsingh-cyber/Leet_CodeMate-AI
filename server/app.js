import express from 'express';
import helmetLite from './middleware/headers.js';
import { corsMiddleware } from './middleware/cors.js';
import { sessionRoute } from './routes/session.js';
import { solveRoute } from './routes/solve.js';
import { UsageTracker } from './services/usage.js';
import { createAi } from './services/gemini.js';

export function createApp(cfg, { ai = createAi(cfg), usage = new UsageTracker(cfg) } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // Render and most hosts sit behind one proxy; needed for the real client IP
  app.use(helmetLite);
  app.use(corsMiddleware(cfg));
  app.use(express.json({ limit: cfg.maxBodyBytes }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, aiEnabled: cfg.aiEnabled, time: new Date().toISOString() });
  });

  app.use('/api', sessionRoute(cfg, usage));
  app.use('/api', solveRoute(cfg, usage, ai));

  app.use((_req, res) => res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Not found.' } }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({ ok: false, error: { code: 'TOO_LARGE', message: 'Request is too large.' } });
    }
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON.' } });
    }
    console.error('[error]', err?.name || 'Error'); // no stack traces or bodies in logs
    res.status(500).json({ ok: false, error: { code: 'INTERNAL', message: 'Something went wrong on the server.' } });
  });

  return app;
}
