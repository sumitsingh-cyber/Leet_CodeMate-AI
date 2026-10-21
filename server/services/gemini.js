import { GoogleGenAI, ApiError } from '@google/genai';
import { buildRequest, buildStructuredRequest, LANGUAGES, STRUCTURED_OPERATIONS, VERIFICATION_SCHEMA } from './prompts.js';

export class AiError extends Error {
  constructor(code, message, httpStatus = 502, refund = true) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.refund = refund;
  }
}

function upstreamStatusOf(error) {
  const candidate = error instanceof ApiError
    ? error.status
    : error?.status ?? error?.statusCode ?? error?.response?.status;
  const status = Number(candidate);
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : undefined;
}

function logModelRequest({ requestId, model, operation, attempt, promptBytes, timeoutMs, elapsedMs, upstreamStatus, ownAbortTimerFired, outcome, errorName }) {
  const safeModel = String(model || 'unset').replace(/[^A-Za-z0-9_.:-]/g, '_').slice(0, 100);
  console.info(
    `[gemini] requestId=${requestId} model=${safeModel} op=${operation} attempt=${attempt} promptBytes=${promptBytes} timeoutMs=${timeoutMs} elapsedMs=${elapsedMs} upstreamStatus=${upstreamStatus ?? 'n/a'} ownAbortTimerFired=${ownAbortTimerFired} outcome=${outcome} errorName=${errorName || 'none'}`,
  );
}

const normalizeText = (value) => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
const escapeRegExp = (value) => value.replace(/[.*+?^\x24{}()|[\]\\]/g, '\\$&');
const FENCE = String.fromCharCode(96).repeat(3);

function expectedNames(starterCode) {
  const source = String(starterCode || '');
  const names = [];
  const className = source.match(/\bclass\s+([A-Za-z_]\w*)/);
  if (className) names.push({ kind: 'class', name: className[1] });
  const functionName = source.match(/\b(?:def|function)\s+([A-Za-z_]\w*)\s*\(/);
  const cLikeName = source.match(/\b(?:public|private|protected)\s+(?:static\s+)?[\w<>\[\],?&*]+\s+([A-Za-z_]\w*)\s*\(/);
  const cppName = source.match(/\b([A-Za-z_]\w*)\s*\([^;{}]*\)\s*(?:\{|;)/);
  const method = functionName || cLikeName || cppName;
  if (method && !['if', 'for', 'while', 'switch'].includes(method[1])) names.push({ kind: 'function', name: method[1] });
  return names;
}

export function validateGeneratedCode(input, answer) {
  const code = String(answer.code || '').trim();
  if (!code) return { ok: false, reason: 'The code field is empty.' };
  if (new RegExp('^\\s*' + FENCE).test(code)) return { ok: false, reason: 'The code field contains Markdown fences.' };

  if (input.category === 'sql') {
    if (/\bclass\s+\w+|\bdef\s+\w+\s*\(|#include/i.test(code)) return { ok: false, reason: 'The SQL answer has a non-SQL language wrapper.' };
    const allowedStart = /^\s*(?:SELECT|WITH)\b/i.test(code);
    const explicitMutation = /^\s*(?:UPDATE|DELETE)\b/i.test(code) && /\b(?:update|delete)\b/i.test(input.statement);
    if (!allowedStart && !explicitMutation) return { ok: false, reason: 'The SQL answer must start with SELECT or WITH unless the statement explicitly requests a mutation.' };
    const hasKnownTable = input.schema.some((table) => new RegExp('(?:^|[^A-Za-z0-9_])' + escapeRegExp(table.table) + '(?:$|[^A-Za-z0-9_])', 'i').test(code));
    if (!hasKnownTable) return { ok: false, reason: 'The SQL answer does not reference a table in the supplied schema.' };
    return { ok: true };
  }

  if (input.category === 'algorithms') {
    if (/^\s*(?:SELECT|WITH)\b/i.test(code)) return { ok: false, reason: 'An algorithms answer cannot be SQL-only output.' };
    const names = expectedNames(input.starterCode || input.editorCode);
    for (const item of names) {
      const escaped = escapeRegExp(item.name);
      const pattern = item.kind === 'class'
        ? new RegExp('\\bclass\\s+' + escaped + '\\b')
        : new RegExp('\\b' + escaped + '\\s*\\(');
      if (!pattern.test(code)) return { ok: false, reason: 'The answer did not keep the starter code ' + item.kind + ' name "' + item.name + '".' };
    }
  }

  if (input.category === 'pandas') {
    if (/^\s*(?:SELECT|WITH)\b/i.test(code) || /\bclass\s+Solution\b/.test(code)) return { ok: false, reason: 'A Pandas answer must use the supplied DataFrame function, not SQL or a LeetCode class.' };
    const names = expectedNames(input.starterCode || input.editorCode).filter((item) => item.kind === 'function');
    for (const item of names) {
      if (!new RegExp('\\b' + escapeRegExp(item.name) + '\\s*\\(').test(code)) return { ok: false, reason: 'The Pandas answer did not keep the starter function "' + item.name + '".' };
    }
  }
  return { ok: true };
}

export function verifyStructuredAnswer(input, answer) {
  if (!answer || typeof answer !== 'object') return { ok: false, reason: 'The response was not a JSON object.' };
  if (!Array.isArray(answer.statementEvidence) || answer.statementEvidence.length === 0) return { ok: false, reason: 'No statement evidence was returned.' };
  const statement = normalizeText(input.statement);
  for (const phrase of answer.statementEvidence) {
    if (typeof phrase !== 'string' || phrase.trim().length < 3 || !statement.includes(normalizeText(phrase))) return { ok: false, reason: 'Statement evidence was not found in the current statement.' };
  }
  if (!Array.isArray(answer.requirements) || answer.requirements.length === 0 || answer.requirements.some((item) => typeof item !== 'string' || !item.trim())) return { ok: false, reason: 'The response did not summarize the problem requirements.' };
  if (!Array.isArray(answer.exampleChecks)) return { ok: false, reason: 'The response did not check the examples.' };
  const checks = new Map();
  for (const check of answer.exampleChecks) {
    if (!check || !Number.isInteger(check.example) || checks.has(check.example)) return { ok: false, reason: 'Example checks were malformed or duplicated.' };
    checks.set(check.example, check);
  }
  for (const example of input.examples) {
    const check = checks.get(example.index);
    if (!check) return { ok: false, reason: 'Example ' + example.index + ' was not checked.' };
    if (normalizeText(check.expected) !== normalizeText(example.output)) return { ok: false, reason: 'Example ' + example.index + ' expected output did not match the statement.' };
    if (typeof check.got !== 'string' || !check.got.trim()) return { ok: false, reason: 'Example ' + example.index + ' has no traced output.' };
    if (normalizeText(check.got) !== normalizeText(example.output)) return { ok: false, reason: 'Example ' + example.index + ' hand-traced output did not match the expected output.' };
    if (check.match !== true) return { ok: false, reason: 'Example ' + example.index + ' did not match: expected ' + example.output + ', got ' + check.got + '.' };
  }
  if (checks.size !== input.examples.length) return { ok: false, reason: 'The response included checks that do not match the parsed examples.' };
  return validateGeneratedCode(input, answer);
}

export function formatStructuredAnswer(input, answer) {
  const code = String(answer.code || '').trim();
  if (input.operation === 'solution') return code;
  const label = input.operation === 'review' ? 'Code review' : 'Improved solution';
  const lines = ['## ' + label, '', ...answer.requirements.map((item) => '- ' + item), '', '## Statement evidence'];
  for (const phrase of answer.statementEvidence) lines.push('- ' + phrase);
  lines.push('', '## Example checks', '', '| Example | Expected | Hand-traced result | Match |', '|---:|---|---|:---:|');
  for (const check of answer.exampleChecks) lines.push('| ' + check.example + ' | ' + check.expected.replace(/\|/g, '\\|').replace(/\n/g, '<br>') + ' | ' + check.got.replace(/\|/g, '\\|').replace(/\n/g, '<br>') + ' | Yes |');
  if (code) lines.push('', input.operation === 'review' ? '## Suggested code' : '## Improved code', '', FENCE + (LANGUAGES[input.language].fence || '') + '\n' + code + '\n' + FENCE);
  lines.push('', '> Checked by AI from the supplied examples; this code was not executed.');
  return lines.join('\n');
}

function mockStructuredAnswer(input) {
  const code = input.category === 'sql' ? 'SELECT * FROM ' + input.schema[0].table : (input.starterCode || input.editorCode || 'def solution():\n    return None');
  return {
    statementEvidence: [input.statement.slice(0, Math.min(80, input.statement.length))],
    requirements: ['Mock requirements grounded in the supplied problem context.'],
    exampleChecks: input.examples.map((example) => ({ example: example.index, expected: example.output, got: example.output, match: true })),
    code,
  };
}

export function createAi(cfg, { clientFactory } = {}) {
  let client;
  const getClient = () => {
    if (!client) client = clientFactory ? clientFactory(cfg.geminiApiKey) : new GoogleGenAI({ apiKey: cfg.geminiApiKey });
    return client;
  };

  async function callModel(systemInstruction, contents, input, outputConfig = {}, { requestId, signal, attempt = 1 } = {}) {
    const timeoutMs = cfg.aiTimeoutMs;
    const promptBytes = Buffer.byteLength(JSON.stringify({ systemInstruction, contents }), 'utf8');
    const started = Date.now();
    const controller = new AbortController();
    let ownAbortTimerFired = false;
    let upstreamStatus;
    let outcome = 'success';
    let errorName = '';

    const abortFromCaller = () => {
      if (!controller.signal.aborted) controller.abort(signal?.reason);
    };
    if (signal?.aborted) abortFromCaller();
    else signal?.addEventListener('abort', abortFromCaller, { once: true });
    const timer = setTimeout(() => {
      ownAbortTimerFired = true;
      controller.abort(new DOMException('Gemini generation deadline exceeded.', 'TimeoutError'));
    }, timeoutMs);

    let response;
    try {
      response = await getClient().models.generateContent({
        model: cfg.geminiModel,
        contents,
        config: {
          systemInstruction,
          maxOutputTokens: cfg.maxOutputTokens,
          temperature: input.operation === 'solution' || input.operation === 'dryrun' ? 0.2 : 0.5,
          abortSignal: controller.signal,
          // Gemini can briefly return 503 while a model is overloaded. Retry
          // transient provider errors a few times within the overall timeout.
          httpOptions: {
            retryOptions: {
              attempts: 3,
              initialDelay: 1,
              maxDelay: 4,
              expBase: 2,
              jitter: 1,
              httpStatusCodes: [408, 429, 500, 502, 503, 504],
            },
          },
          ...outputConfig,
        },
      });
      if (ownAbortTimerFired) throw new DOMException('Gemini generation deadline exceeded.', 'TimeoutError');
      if (signal?.aborted) throw new DOMException('The request was cancelled.', 'AbortError');
      upstreamStatus = upstreamStatusOf(response?.sdkHttpResponse);
      if (!response || typeof response.text !== 'string') {
        outcome = 'malformed_response';
        throw new AiError('AI_MALFORMED_RESPONSE', 'The AI returned an incomplete response. Your current problem context is preserved; use Try again to retry.', 502);
      }
      if (response.promptFeedback?.blockReason) throw new AiError('AI_BLOCKED', 'The AI declined to answer this request.', 422, false);
      const text = response.text.trim();
      if (!text) {
        outcome = 'empty_response';
        throw new AiError('AI_EMPTY', 'The AI returned an empty answer. Your current problem context is preserved; use Try again to retry.', 502);
      }
      return text;
    } catch (err) {
      if (err instanceof AiError) {
        errorName = err.name;
        if (outcome === 'success') outcome = err.code.toLowerCase();
        throw err;
      }
      upstreamStatus = upstreamStatusOf(err);
      errorName = err?.name || 'Error';
      if (ownAbortTimerFired) {
        outcome = 'timeout';
        throw new AiError(
          'AI_TIMEOUT',
          `The AI response exceeded the server's ${Math.ceil(timeoutMs / 1000)}-second deadline. Your current problem context is preserved; use Try again to retry.`,
          504,
        );
      }
      if (signal?.aborted) {
        outcome = 'cancelled';
        throw new AiError('REQUEST_CANCELLED', 'The request was cancelled.', 499);
      }
      if (upstreamStatus === 429) {
        outcome = 'upstream_error';
        throw new AiError('AI_QUOTA', 'The AI service is busy or its quota is used up. Try again later.', 503);
      }
      if ([400, 401, 403, 404].includes(upstreamStatus)) {
        outcome = 'upstream_error';
        throw new AiError('SERVER_MISCONFIGURED', 'The AI service is not configured correctly on the server.', 503);
      }
      outcome = 'upstream_error';
      throw new AiError('AI_UNAVAILABLE', 'The AI service is temporarily unavailable. Please try again.', 503);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abortFromCaller);
      logModelRequest({
        requestId,
        model: cfg.geminiModel,
        operation: input.operation,
        attempt,
        promptBytes,
        timeoutMs,
        elapsedMs: Date.now() - started,
        upstreamStatus,
        ownAbortTimerFired,
        outcome,
        errorName,
      });
    }
  }

  async function generate(input, { requestId = 'unassigned', signal } = {}) {
    if (!cfg.mockAi && (!cfg.geminiApiKey || !cfg.geminiModel)) throw new AiError('SERVER_MISCONFIGURED', 'The AI service is not configured on the server.', 503);
    if (!STRUCTURED_OPERATIONS.includes(input.operation)) {
      if (cfg.mockAi) return { text: '## Mock answer (' + input.operation + ')\n\nContext received for **' + input.title + '** in ' + input.language + '.', verifiedExamples: 0 };
      const request = buildRequest(input);
      return { text: await callModel(request.systemInstruction, request.contents, input, {}, { requestId, signal }), verifiedExamples: 0 };
    }

    const maxAttempts = cfg.verifyRetry ? 2 : 1;
    let feedback = '';
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      let raw;
      if (cfg.mockAi) raw = JSON.stringify(mockStructuredAnswer(input));
      else {
        const request = buildStructuredRequest({ ...input, verificationFeedback: feedback });
        raw = await callModel(request.systemInstruction, request.contents, input, {
          responseMimeType: 'application/json',
          responseJsonSchema: VERIFICATION_SCHEMA,
        }, { requestId, signal, attempt });
      }
      let answer;
      try {
        answer = JSON.parse(String(raw || ''));
      } catch {
        feedback = 'The response was not valid JSON matching the required fields.';
        if (attempt < maxAttempts) continue;
        throw new AiError('ANSWER_NOT_VERIFIED', 'The answer could not be verified against this problem. Please refresh the page and try again.', 422);
      }
      const result = verifyStructuredAnswer(input, answer);
      if (result.ok) return { text: formatStructuredAnswer(input, answer), verifiedExamples: input.examples.length };
      feedback = result.reason;
      if (attempt === maxAttempts) throw new AiError('ANSWER_NOT_VERIFIED', 'The answer could not be verified against this problem. Please refresh the page and try again.', 422);
    }
  }

  return { generate };
}
