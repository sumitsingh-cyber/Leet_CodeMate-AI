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

function isGemini3Model(model) {
  return /^gemini-3(?:\.|-)/i.test(String(model || ''));
}

function logModelRequest({ requestId, model, operation, attempt, promptBytes, timeoutMs, httpAttemptTimeoutMs, httpMaxAttempts, elapsedMs, upstreamStatus, ownAbortTimerFired, outcome, errorName }) {
  const safeModel = String(model || 'unset').replace(/[^A-Za-z0-9_.:-]/g, '_').slice(0, 100);
  console.info(
    `[gemini] requestId=${requestId} model=${safeModel} op=${operation} attempt=${attempt} promptBytes=${promptBytes} timeoutMs=${timeoutMs} httpAttemptTimeoutMs=${httpAttemptTimeoutMs} httpMaxAttempts=${httpMaxAttempts} elapsedMs=${elapsedMs} upstreamStatus=${upstreamStatus ?? 'n/a'} ownAbortTimerFired=${ownAbortTimerFired} outcome=${outcome} errorName=${errorName || 'none'}`,
  );
}

const normalizeText = (value) => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();

function extractPrimaryValue(str) {
  const s = String(str || '').trim();
  if (s.startsWith('[') || s.startsWith('{')) return s;
  // Handles custom judge notes like "2, nums = [1,2,_]" or "2; ..."
  const commaMatch = s.match(/^([^,;]+)(?:[,;]|\s+[a-zA-Z_]\w*\s*=)/i);
  if (commaMatch && commaMatch[1].trim()) return commaMatch[1].trim();
  // Handles "k = 2, ..."
  const varMatch = s.match(/^[a-zA-Z_]\w*\s*=\s*([^,;]+)/i);
  if (varMatch && varMatch[1].trim()) return varMatch[1].trim();
  return s;
}

function normalizeOutput(val) {
  return String(val || '')
    .toLowerCase()
    .replace(/\s*([,:\[\]{}()=;])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function outputsMatch(got, expected) {
  const normGot = normalizeOutput(got);
  const normExp = normalizeOutput(expected);
  if (normGot === normExp) return true;

  const primGot = normalizeOutput(extractPrimaryValue(got));
  const primExp = normalizeOutput(extractPrimaryValue(expected));
  if (normGot === primExp || primGot === normExp || primGot === primExp) return true;

  if (primExp.length >= 1 && normGot.split(/[^a-z0-9_.-]/i).includes(primExp)) return true;
  if (primGot.length >= 1 && normExp.split(/[^a-z0-9_.-]/i).includes(primGot)) return true;

  return false;
}

function statementHasPhrase(statement, phrase) {
  const normStmt = normalizeText(statement);
  const normPhrase = normalizeText(phrase);
  if (normStmt.includes(normPhrase)) return true;

  // Flexible check ignoring punctuation in case markdown or quotes differ slightly
  const cleanStmt = normStmt.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanPhrase = normPhrase.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleanPhrase.length >= 3 && cleanStmt.includes(cleanPhrase)) return true;

  return false;
}
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
  let code = String(answer.code || '').trim();
  if (!code) return { ok: false, reason: 'The code field is empty.' };
  code = code.replace(/^```[a-zA-Z0-9_-]*\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
  answer.code = code;
  if (!code) return { ok: false, reason: 'The code field is empty.' };

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
  for (const phrase of answer.statementEvidence) {
    if (typeof phrase !== 'string' || phrase.trim().length < 3 || !statementHasPhrase(input.statement, phrase)) {
      return { ok: false, reason: 'Statement evidence was not found in the current statement.' };
    }
  }
  if (!Array.isArray(answer.requirements) || answer.requirements.length === 0 || answer.requirements.some((item) => typeof item !== 'string' || !item.trim())) return { ok: false, reason: 'The response did not summarize the problem requirements.' };
  if (!Array.isArray(answer.exampleChecks)) return { ok: false, reason: 'The response did not check the examples.' };
  const checks = new Map();
  for (const check of answer.exampleChecks) {
    const exIdx = check && Number(check.example);
    if (!check || !Number.isInteger(exIdx) || checks.has(exIdx)) return { ok: false, reason: 'Example checks were malformed or duplicated.' };
    checks.set(exIdx, check);
  }
  for (const example of input.examples) {
    const check = checks.get(example.index);
    if (!check) return { ok: false, reason: 'Example ' + example.index + ' was not checked.' };
    if (!outputsMatch(check.expected, example.output)) return { ok: false, reason: 'Example ' + example.index + ' expected output did not match the statement.' };
    if (typeof check.got !== 'string' || !check.got.trim()) return { ok: false, reason: 'Example ' + example.index + ' has no traced output.' };
    if (!outputsMatch(check.got, example.output) && !outputsMatch(check.got, check.expected)) return { ok: false, reason: 'Example ' + example.index + ' hand-traced output did not match the expected output.' };
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
    const httpAttemptTimeoutMs = Math.min(timeoutMs, 40000);
    const httpMaxAttempts = 2;
    const candidateModels = cfg.geminiCandidateModels?.length
      ? cfg.geminiCandidateModels
      : (cfg.geminiModel ? [cfg.geminiModel] : []);
    const promptBytes = Buffer.byteLength(JSON.stringify({ systemInstruction, contents }), 'utf8');
    const started = Date.now();
    const controller = new AbortController();
    let ownAbortTimerFired = false;
    let upstreamStatus;
    let outcome = 'success';
    let errorName = '';
    let usedModel = cfg.geminiModel;

    const abortFromCaller = () => {
      if (!controller.signal.aborted) controller.abort(signal?.reason);
    };
    if (signal?.aborted) abortFromCaller();
    else signal?.addEventListener('abort', abortFromCaller, { once: true });
    const timer = setTimeout(() => {
      ownAbortTimerFired = true;
      controller.abort(new DOMException('Gemini generation deadline exceeded.', 'TimeoutError'));
    }, timeoutMs);

    try {
      let lastErr;
      for (let modelIdx = 0; modelIdx < candidateModels.length; modelIdx++) {
        const currentModel = candidateModels[modelIdx];
        usedModel = currentModel;
        const gemini3Model = isGemini3Model(currentModel);
        let response;
        try {
          response = await getClient().models.generateContent({
            model: currentModel,
            contents,
            config: {
              systemInstruction,
              maxOutputTokens: cfg.maxOutputTokens,
              ...(gemini3Model
                ? (input.operation === 'solution' ? { thinkingConfig: { thinkingLevel: 'low' } } : {})
                : { temperature: input.operation === 'solution' || input.operation === 'dryrun' ? 0.2 : 0.5 }),
              abortSignal: controller.signal,
              httpOptions: {
                timeout: httpAttemptTimeoutMs,
                retryOptions: {
                  attempts: httpMaxAttempts,
                  initialDelay: 1,
                  maxDelay: 2,
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
          lastErr = err;
          if (err instanceof AiError) throw err;
          const status = upstreamStatusOf(err);
          upstreamStatus = status;
          if (ownAbortTimerFired || signal?.aborted) break;
          // If the model is experiencing temporary high demand (503) or is unavailable (404),
          // and another candidate model was specified in GEMINI_MODEL, fall back to it.
          if (([429, 404, 408, 502, 503, 504].includes(status)) && modelIdx + 1 < candidateModels.length) {
            console.warn(`[gemini] Model ${currentModel} returned ${status}, falling back to ${candidateModels[modelIdx + 1]}`);
            continue;
          }
          break;
        }
      }

      if (lastErr instanceof AiError) {
        errorName = lastErr.name;
        if (outcome === 'success') outcome = lastErr.code.toLowerCase();
        throw lastErr;
      }
      upstreamStatus = upstreamStatusOf(lastErr);
      errorName = lastErr?.name || 'Error';
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
        model: usedModel,
        operation: input.operation,
        attempt,
        promptBytes,
        timeoutMs,
        httpAttemptTimeoutMs,
        httpMaxAttempts,
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
