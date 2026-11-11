import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { CONFIG } from '../src/config';
import { configureApp, openApi } from '../src/bootstrap';
async function main() {
  const config = { NODE_ENV: 'test', PORT: 3000, DATABASE_URL: 'postgresql://local@127.0.0.1:5432/local',
    SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_PUBLISHABLE_KEY: 'contract-generation-no-network', CORS_ORIGIN: 'http://localhost:5173' } as const;
  const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(CONFIG).useValue(config).compile();
  const app = module.createNestApplication(); configureApp(app, config);
  writeFileSync('openapi.json', JSON.stringify(openApi(app), null, 2) + '\n');
  await app.close();
}
main().catch(error => { console.error(error); process.exitCode = 1; });
