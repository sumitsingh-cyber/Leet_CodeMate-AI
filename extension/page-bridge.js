(() => {
  const supported = {
    cpp: ['C++', 'cpp'], cplusplus: ['C++', 'cpp'], python: ['Python', 'python'], python3: ['Python', 'python'],
    java: ['Java', 'java'], mysql: ['MySQL', 'mysql'], postgresql: ['PostgreSQL', 'postgresql'],
    postgres: ['PostgreSQL', 'postgresql'], oraclesql: ['Oracle SQL', 'oraclesql'], oracle: ['Oracle SQL', 'oraclesql'],
    mssql: ['MS SQL Server', 'mssql'], tsql: ['MS SQL Server', 'mssql'], sqlserver: ['MS SQL Server', 'mssql'],
    bash: ['Bash', 'bash'], shell: ['Bash', 'bash'], sh: ['Bash', 'bash'], pandas: ['Pandas', 'pandas'],
  };
  let starterSnapshot = null;

  function languageFor(model, code) {
    const raw = String(model.getLanguageId ? model.getLanguageId() : model.getModeId ? model.getModeId() : '').toLowerCase().replace(/[\s_-]/g, '');
    if (raw === 'python' && /\b(?:pd\.)?DataFrame\b|\bimport\s+pandas\b/.test(code)) return ['Pandas', 'pandas'];
    return supported[raw] || ['', ''];
  }

  function readModels() {
    try {
      const models = window.monaco?.editor?.getModels?.() || [];
      let best = null;
      for (const model of models) {
        const value = String(model.getValue ? model.getValue() : '');
        const raw = String(model.getLanguageId ? model.getLanguageId() : model.getModeId ? model.getModeId() : '').toLowerCase();
        if (!value.trim() || raw === 'plaintext') continue;
        if (!best || value.length > best.code.length) best = { model, code: value };
      }
      if (!best) return { editorCode: '', starterCode: '', editorLanguageLabel: '', editorLanguageKey: '' };
      if (!starterSnapshot) starterSnapshot = best.code;
      const language = languageFor(best.model, best.code);
      return {
        editorCode: best.code.slice(0, 9500),
        starterCode: starterSnapshot.slice(0, 9500),
        editorLanguageLabel: language[0],
        editorLanguageKey: language[1],
      };
    } catch {
      return { editorCode: '', starterCode: '', editorLanguageLabel: '', editorLanguageKey: '' };
    }
  }

  const capture = setInterval(() => {
    if (readModels().starterCode) clearInterval(capture);
  }, 300);

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (event.source !== window || !message || message.source !== 'codemate-content' || message.type !== 'GET_CODE') return;
    window.postMessage({
      source: 'codemate-bridge',
      id: message.id,
      requestId: message.requestId,
      ...readModels(),
    }, '*');
  });
})();