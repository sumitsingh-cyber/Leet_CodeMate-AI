import { GoogleGenAI, ApiError } from '@google/genai';
import { buildRequest } from './prompts.js';

export class AiError extends Error {
  constructor(code, message, httpStatus = 502, refund = true) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.refund = refund; // give the quota back to the user?
  }
}

export function createAi(cfg) {
  let client;

  async function generate(input) {
    if (cfg.mockAi) {
      return `## Mock answer (${input.operation})\n\nThis is a development-only response for **${input.title}**.\n\n| Step | Note |\n|---|---|\n| 1 | Mock row |\n\n\`\`\`${input.language}\nclass Solution {};\n\`\`\`\n`;
    }
    if (!cfg.geminiApiKey || !cfg.geminiModel) {
      throw new AiError('SERVER_MISCONFIGURED', 'The AI service is not configured on the server.', 503);
    }
    client ??= new GoogleGenAI({ apiKey: cfg.geminiApiKey });

    const { systemInstruction, contents } = buildRequest(input);
    let response;
    try {
      response = await client.models.generateContent({
        model: cfg.geminiModel,
        contents,
        config: {
          systemInstruction,
          maxOutputTokens: cfg.maxOutputTokens,
          temperature: input.operation === 'solution' || input.operation === 'dryrun' ? 0.2 : 0.5,
          abortSignal: AbortSignal.timeout(cfg.aiTimeoutMs),
        },
      });
    } catch (err) {
      // Never log the request (it contains user code) or the API key.
      const status = err instanceof ApiError ? err.status : undefined;
      console.error(`[gemini] request failed: status=${status ?? 'n/a'} name=${err?.name}`);
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        throw new AiError('AI_TIMEOUT', 'The AI took too long to answer. Please try again.', 504);
      }
      if (status === 429) throw new AiError('AI_QUOTA', 'The AI service is busy or its quota is used up. Try again later.', 503);
      if (status === 400 || status === 401 || status === 403 || status === 404) {
        // Bad key, wrong model name, or API not enabled: a server-side problem.
        throw new AiError('SERVER_MISCONFIGURED', 'The AI service is not configured correctly on the server.', 503);
      }
      throw new AiError('AI_UNAVAILABLE', 'The AI service is temporarily unavailable. Please try again.', 503);
    }

    const blockReason = response?.promptFeedback?.blockReason;
    if (blockReason) {
      throw new AiError('AI_BLOCKED', 'The AI declined to answer this request.', 422, false);
    }
    const text = response?.text?.trim();
    if (!text) {
      const finish = response?.candidates?.[0]?.finishReason;
      if (finish && finish !== 'STOP') throw new AiError('AI_BLOCKED', 'The AI could not complete this answer. Try again.', 422);
      throw new AiError('AI_EMPTY', 'The AI returned an empty answer. Please try again.', 502);
    }
    const truncated = response?.candidates?.[0]?.finishReason === 'MAX_TOKENS';
    return truncated ? `${text}\n\n> The answer was cut off because it reached the length limit. Ask a follow-up to continue.` : text;
  }

  return { generate };
}
