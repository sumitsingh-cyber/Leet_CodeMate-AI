import { verifyToken } from '../services/tokens.js';

export function requireToken(cfg) {
  return (req, res, next) => {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const result = verifyToken(cfg.tokenSecret, token);
    if (!result.ok) {
      return res.status(401).json({
        ok: false,
        error: {
          code: result.reason === 'expired' ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED',
          message: result.reason === 'expired' ? 'Session expired. Refreshing...' : 'Missing or invalid session.',
        },
      });
    }
    req.installId = result.installId;
    next();
  };
}
