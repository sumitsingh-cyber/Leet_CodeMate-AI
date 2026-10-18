(() => {
  const sql = new Set(['mysql', 'postgresql', 'oraclesql', 'mssql']);
  const algorithm = new Set(['cpp', 'python', 'java']);
  const canonical = (value) => {
    const key = String(value || '').toLowerCase().replace(/[\s_-]+/g, '');
    if (['cpp', 'c++', 'cplusplus'].includes(key)) return 'cpp';
    if (['python', 'python3', 'py'].includes(key)) return 'python';
    if (key === 'java') return 'java';
    if (['mysql', 'mysql8'].includes(key)) return 'mysql';
    if (['postgres', 'postgresql'].includes(key)) return 'postgresql';
    if (['oracle', 'oraclesql', 'plsql'].includes(key)) return 'oraclesql';
    if (['mssql', 'tsql', 'sqlserver', 'microsoftsqlserver'].includes(key)) return 'mssql';
    if (['pandas', 'pythonpandas'].includes(key)) return 'pandas';
    if (['bash', 'shell', 'sh', 'shellscript'].includes(key)) return 'bash';
    return '';
  };
  window.CodeMateClassifier = {
    classify(context, selectedLanguage) {
      const editor = canonical(context.editorLanguageKey) || canonical(context.editorLanguageLabel);
      const selected = String(selectedLanguage || 'auto').toLowerCase() === 'auto' ? '' : canonical(selectedLanguage);
      const statement = String(context.statement || '');
      const code = String(context.starterCode || '') + '\n' + String(context.editorCode || '');
      const schema = Array.isArray(context.schema) ? context.schema : [];
      const reasons = [];
      let category = 'algorithms';
      let language = 'python';
      let confidence = 0.4;
      if (sql.has(editor)) {
        category = 'sql'; language = editor; confidence = 0.98;
        reasons.push('The visible editor language identifies a SQL dialect.');
        if (sql.has(selected)) language = selected;
        else if (selected) { confidence = 0.54; reasons.push('The selected language conflicts with the SQL editor; editor language is the assumption.'); }
      } else if (editor === 'pandas' || /\bpandas\b/i.test(context.editorLanguageLabel || '')) {
        category = 'pandas'; language = 'pandas'; confidence = 0.98;
        reasons.push('The visible editor language identifies Pandas.');
      } else if (editor === 'bash') {
        category = 'shell'; language = 'bash'; confidence = 0.98;
        reasons.push('The visible editor language identifies Bash.');
      } else if (schema.length || /\bTable\s*:\s*[A-Za-z_]/i.test(statement)) {
        category = 'sql'; language = sql.has(selected) ? selected : 'mysql'; confidence = schema.length ? 0.9 : 0.68;
        reasons.push(schema.length ? 'Visible table schema identifies a database problem.' : 'Visible Table wording suggests a database problem.');
        if (selected && !sql.has(selected)) { confidence = 0.5; reasons.push('The selected language conflicts with database evidence; MySQL is assumed.'); }
        else if (!selected) reasons.push('No dialect is visible; MySQL is a low-confidence assumption.');
      } else if (selected === 'pandas' || /\bDataFrame\b|\bpandas\b/i.test(code + '\n' + statement)) {
        category = 'pandas'; language = 'pandas'; confidence = selected ? 0.9 : 0.78;
        reasons.push('The starter or editor code indicates Pandas DataFrames.');
      } else if (selected === 'bash' || /^\s*#!.*(?:bash|sh)/i.test(code)) {
        category = 'shell'; language = 'bash'; confidence = selected ? 0.92 : 0.75;
        reasons.push('The starter or editor code indicates shell syntax.');
      } else {
        category = 'algorithms';
        language = selected && algorithm.has(selected) ? selected : (algorithm.has(editor) ? editor : 'python');
        confidence = editor === 'cpp' || editor === 'java' ? 0.91 : editor === 'python' ? 0.72 : selected ? 0.68 : 0.4;
        reasons.push(editor ? 'No database or shell evidence was found in the visible context.' : 'No strong problem-type evidence was found.');
      }
      return { category, language, confidence, reasons };
    },
  };
})();