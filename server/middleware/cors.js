import cors from 'cors';

/** CORS only controls which browser origins may read responses. It is NOT authentication. */
export function corsMiddleware(cfg) {
  return cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl / server-to-server (still needs a token for /api/solve)
      if (!origin.startsWith('chrome-extension://')) return cb(null, false);
      const id = origin.slice('chrome-extension://'.length);
      if (cfg.allowedExtensionIds.length === 0) {
        // Development convenience only. In production, set ALLOWED_EXTENSION_IDS.
        return cb(null, !cfg.isProduction);
      }
      return cb(null, cfg.allowedExtensionIds.includes(id));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });
}
