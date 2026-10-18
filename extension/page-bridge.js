// Runs in the page's own JavaScript world so it can read the Monaco editor model.
// It only answers "give me the editor text" requests from our content script and sends nothing anywhere else.
(() => {
  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (event.source !== window || !msg || msg.source !== 'codemate-content' || msg.type !== 'GET_CODE') return;

    let code = '';
    try {
      const models = window.monaco?.editor?.getModels?.() || [];
      let best = '';
      for (const model of models) {
        const lang = model.getLanguageId ? model.getLanguageId() : model.getModeId?.();
        if (lang === 'plaintext') continue; // skips the test-case input editor
        const value = model.getValue();
        if (value.length > best.length) best = value;
      }
      code = best;
    } catch {
      code = '';
    }
    window.postMessage({ source: 'codemate-bridge', id: msg.id, code }, '*');
  });
})();
