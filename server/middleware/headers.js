// Minimal security headers for a JSON API (no extra dependency).
export default function headers(_req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
    'Strict-Transport-Security': 'max-age=15552000; includeSubDomains',
  });
  next();
}
