const LANG = {
  cpp: { category: 'algorithms', label: 'C++' },
  python: { category: 'algorithms', label: 'Python' },
  java: { category: 'algorithms', label: 'Java' },
  mysql: { category: 'sql', label: 'MySQL' },
  postgresql: { category: 'sql', label: 'PostgreSQL' },
  oraclesql: { category: 'sql', label: 'Oracle SQL' },
  mssql: { category: 'sql', label: 'MS SQL Server' },
  pandas: { category: 'pandas', label: 'Pandas' },
  bash: { category: 'shell', label: 'Bash' },
};

export const CATEGORIES = ['algorithms', 'sql', 'pandas', 'shell'];
export const LANGUAGE_KEYS = Object.keys(LANG);

export function canonicalLanguage(value) {
  const raw = String(value || '').trim().toLowerCase();
  const compact = raw.replace(/[\s_-]+/g, '');
  if (['c++', 'cpp', 'gnu++', 'g++'].includes(compact) || compact.startsWith('c++')) return 'cpp';
  if (['py', 'python', 'python3', 'python3.10', 'python3.11'].includes(compact)) return 'python';
  if (compact === 'java') return 'java';
  if (['mysql', 'mysql8', 'mysql80'].includes(compact)) return 'mysql';
  if (['postgres', 'postgresql', 'postgre'].includes(compact)) return 'postgresql';
  if (['oracle', 'oraclesql', 'plsql'].includes(compact)) return 'oraclesql';
  if (['mssql', 'sqlserver', 'microsoftsqlserver', 'tsql'].includes(compact)) return 'mssql';
  if (['pandas', 'pythonpandas'].includes(compact)) return 'pandas';
  if (['bash', 'shell', 'sh', 'shellscript'].includes(compact)) return 'bash';
  return '';
}

const languageInfo = (key) => LANG[key] || null;
const isSql = (key) => Boolean(LANG[key] && LANG[key].category === 'sql');
const compactText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

function editorKey(context) {
  return canonicalLanguage(context.editorLanguageKey) || canonicalLanguage(context.editorLanguageLabel);
}

function hasPandasShape(text) {
  return /\b(?:pd\.)?DataFrame\b|\bimport\s+pandas\b|\bto_dict\s*\(/i.test(text);
}

function hasShellShape(text) {
  return /^\s*#!.*(?:bash|sh)|\b(?:awk|sed|grep|cut|sort)\b/i.test(text);
}

function hasSqlStatement(context) {
  const text = compactText(context.statement);
  const hasTable = (context.schema || []).length > 0 || /\bTable\s*:\s*[A-Za-z_]/i.test(text);
  return hasTable || (/\bwrite a solution to find\b/i.test(text) && /\btable\b/i.test(text));
}

export function classifyProblem(context = {}) {
  const editor = editorKey(context);
  const selectedRaw = String(context.selectedLanguage || context.language || 'auto').trim().toLowerCase();
  const selected = selectedRaw === 'auto' ? '' : canonicalLanguage(selectedRaw);
  const starter = String(context.starterCode || '');
  const editorCode = String(context.editorCode || '');
  const code = starter + '\n' + editorCode;
  const tags = (Array.isArray(context.tags) ? context.tags : []).map((tag) => compactText(tag).toLowerCase());
  const reasons = [];
  let category = 'algorithms';
  let language = 'python';
  let confidence = 0.42;

  if (editor && isSql(editor)) {
    category = 'sql';
    language = editor;
    confidence = 0.98;
    reasons.push('The visible editor language identifies a SQL dialect.');
    if (selected && !isSql(selected)) {
      confidence = 0.54;
      reasons.push('The selected output language conflicts with the SQL editor; the editor language is being used.');
    } else if (isSql(selected)) {
      language = selected;
    }
  } else if (editor === 'pandas' || /\bpandas\b/i.test(context.editorLanguageLabel || '')) {
    category = 'pandas';
    language = 'pandas';
    confidence = 0.98;
    reasons.push('The visible editor language identifies Pandas.');
    if (selected && selected !== 'pandas' && selected !== 'python') {
      confidence = 0.55;
      reasons.push('The selected output language conflicts with the Pandas editor.');
    }
  } else if (editor === 'bash') {
    category = 'shell';
    language = 'bash';
    confidence = 0.98;
    reasons.push('The visible editor language identifies Bash.');
    if (selected && selected !== 'bash') {
      confidence = 0.55;
      reasons.push('The selected output language conflicts with the Bash editor.');
    }
  } else if (editor === 'cpp' || editor === 'java') {
    category = 'algorithms';
    language = editor;
    confidence = 0.91;
    reasons.push('The visible editor language is a general-purpose algorithms language.');
    if (selected && ['cpp', 'python', 'java'].includes(selected)) language = selected;
    else if (selected) {
      confidence = 0.5;
      reasons.push('The selected language conflicts with the visible editor language.');
    }
  } else if (hasSqlStatement(context)) {
    category = 'sql';
    language = isSql(selected) ? selected : (isSql(editor) ? editor : 'mysql');
    confidence = (context.schema || []).length ? 0.9 : 0.72;
    reasons.push((context.schema || []).length
      ? 'Visible table schemas identify a database problem.'
      : 'The statement uses database table wording.');
    if (selected && !isSql(selected)) {
      confidence = 0.5;
      reasons.push('The selected language conflicts with the database evidence; MySQL is the assumed dialect unless an editor dialect is visible.');
    } else if (!isSql(selected) && !isSql(editor)) {
      reasons.push('No SQL dialect is visible, so MySQL is shown as a low-confidence assumption.');
    }
  } else if (selected && isSql(selected)) {
    category = 'sql';
    language = selected;
    confidence = 0.68;
    reasons.push('The selected language is a SQL dialect, but the statement has no visible schema evidence.');
  } else if (selected === 'pandas' || editor === 'pandas' || (hasPandasShape(code) && /\bdataframe\b|\bpandas\b/i.test(context.statement || ''))) {
    category = 'pandas';
    language = 'pandas';
    confidence = selected === 'pandas' || editor === 'pandas' ? 0.94 : 0.83;
    reasons.push('The editor or starter code uses Pandas DataFrame types.');
  } else if (selected === 'bash' || editor === 'bash' || hasShellShape(code)) {
    category = 'shell';
    language = 'bash';
    confidence = selected === 'bash' || editor === 'bash' ? 0.94 : 0.78;
    reasons.push('The editor or starter code uses shell syntax.');
  } else {
    const taggedPandas = tags.some((tag) => tag.includes('pandas'));
    const taggedSql = tags.some((tag) => tag === 'database' || tag === 'sql');
    if (taggedSql) {
      category = 'sql';
      language = isSql(selected) ? selected : 'mysql';
      confidence = 0.58;
      reasons.push('A visible SQL/database tag suggests a database problem, but the statement has no parsed schema.');
    } else if (taggedPandas) {
      category = 'pandas';
      language = 'pandas';
      confidence = 0.7;
      reasons.push('A visible Pandas tag suggests a DataFrame problem.');
    } else if (editor === 'python') {
      category = 'algorithms';
      language = selected && ['cpp', 'python', 'java'].includes(selected) ? selected : 'python';
      confidence = 0.72;
      reasons.push('The visible editor is Python and no database or Pandas evidence was found.');
    } else if (selected && ['cpp', 'python', 'java'].includes(selected)) {
      category = 'algorithms';
      language = selected;
      confidence = 0.7;
      reasons.push('The selected language is an algorithms language and no stronger problem-type evidence was found.');
    } else {
      const starterLooksAlgorithmic = /\bclass\s+Solution\b|\b(?:def|function)\s+\w+\s*\(/i.test(code);
      category = 'algorithms';
      language = editor && ['cpp', 'python', 'java'].includes(editor) ? editor : 'python';
      confidence = starterLooksAlgorithmic ? 0.62 : 0.38;
      reasons.push(starterLooksAlgorithmic
        ? 'The starter code has a class or function signature.'
        : 'No strong problem-type evidence was found; Algorithms is a low-confidence assumption.');
    }
  }

  if (!languageInfo(language)) {
    language = 'python';
    category = 'algorithms';
    confidence = 0.25;
    reasons.push('No supported language could be identified; Python is only a fallback assumption.');
  }

  return { category, language, confidence, reasons };
}

export function getLanguageInfo(key) {
  return languageInfo(key);
}
