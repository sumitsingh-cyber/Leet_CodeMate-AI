import crypto from 'node:crypto';

const env = process.env;
const int = (name, fallback) => {
  const n = Number.parseInt(env[name] ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const isProduction = env.NODE_ENV === 'production';

export function loadConfig() {
  const cfg = {
    isProduction,
    port: int('PORT', 3000),

    // AI provider (Google Gemini). The model name is never hardcoded:
    // pick one in Google AI Studio that your key can use.
    geminiApiKey: env.GEMINI_API_KEY || '',
    geminiModel: env.GEMINI_MODEL || '',
    // Development-only switch: returns canned text so you can test without a key.
    mockAi: env.MOCK_AI === 'true',

    // Kill switch. Set AI_ENABLED=false in the hosting dashboard to stop all AI calls.
    aiEnabled: env.AI_ENABLED !== 'false',

    // Signing secret for install IDs and session tokens.
    tokenSecret: env.TOKEN_SECRET || '',
    tokenTtlSeconds: int('TOKEN_TTL_SECONDS', 3600),

    // Comma separated extension IDs allowed by CORS (from chrome://extensions).
    allowedExtensionIds: (env.ALLOWED_EXTENSION_IDS || '')
      .split(',').map((s) => s.trim()).filter(Boolean),

    // Limits (all in-memory; see README "Security" for the honest limitations).
    perInstallDailyLimit: int('PER_INSTALL_DAILY_LIMIT', 40),
    perIpDailyLimit: int('PER_IP_DAILY_LIMIT', 150),
    globalDailyLimit: int('GLOBAL_DAILY_LIMIT', 1500),
    perInstallPerMinute: int('PER_INSTALL_PER_MINUTE', 8),
    sessionsPerIpPerHour: int('SESSIONS_PER_IP_PER_HOUR', 30),

    // Size limits.
    maxBodyBytes: int('MAX_BODY_BYTES', 60 * 1024),
    maxDescriptionChars: int('MAX_DESCRIPTION_CHARS', 8000),
    maxCodeChars: int('MAX_CODE_CHARS', 10000),
    maxQuestionChars: int('MAX_QUESTION_CHARS', 1000),
    maxOutputTokens: int('MAX_OUTPUT_TOKENS', 2048),
    aiTimeoutMs: int('AI_TIMEOUT_MS', 45000),
  };

  if (!cfg.tokenSecret) {
    if (isProduction) {
      throw new Error('TOKEN_SECRET is required in production (use at least 32 random characters).');
    }
    cfg.tokenSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[config] TOKEN_SECRET not set: using a temporary one (tokens reset on restart).');
  } else if (cfg.tokenSecret.length < 32 && isProduction) {
    throw new Error('TOKEN_SECRET must be at least 32 characters.');
  }

  if (cfg.mockAi && isProduction) {
    throw new Error('MOCK_AI must not be enabled in production.');
  }
  if (!cfg.mockAi && cfg.aiEnabled) {
    if (!cfg.geminiApiKey) console.warn('[config] GEMINI_API_KEY is not set: AI requests will fail.');
    if (!cfg.geminiModel) console.warn('[config] GEMINI_MODEL is not set: AI requests will fail.');
  }
  return cfg;
}
