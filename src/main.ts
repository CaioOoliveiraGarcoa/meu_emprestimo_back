import 'dotenv/config';
import { createApp } from './bootstrap';
import { CONFIG, Config } from './config';
async function main() {
  const app = await createApp(); app.enableShutdownHooks();
  await app.listen(app.get<Config>(CONFIG).PORT, '127.0.0.1');
}
main().catch(() => { console.error('Falha ao iniciar. Verifique as variáveis obrigatórias.'); process.exitCode = 1; });
