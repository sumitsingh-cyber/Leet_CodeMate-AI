import 'dotenv/config';
import { loadConfig } from './config.js';
import { createApp } from './app.js';

const cfg = loadConfig();
const app = createApp(cfg);

app.listen(cfg.port, '0.0.0.0', () => {
  console.log(`CodeMate AI server listening on port ${cfg.port} (AI ${cfg.aiEnabled ? 'enabled' : 'DISABLED'}${cfg.mockAi ? ', MOCK mode' : ''})`);
});
