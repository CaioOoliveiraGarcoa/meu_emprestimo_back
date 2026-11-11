import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { images, seedInventory, seedTenant } from './seed-data';

async function main() {
  const db = new PrismaClient();
  try {
    if (!process.argv.includes('--inventario')) {
      const database = new URL(process.env.DATABASE_URL ?? '');
      if (!['localhost', '127.0.0.1', '[::1]'].includes(database.hostname))
        throw new Error('Seed automático só permite banco local. O operador usa --inventario para a carga completa.');
      await seedTenant(db);
      console.log('Tenant local criado ou conferido.');
      return;
    }
    const env = z.object({ SUPABASE_URL: z.string().url(), PROFESSOR_USER_ID: z.string().uuid(),
      TEST_USER_ID: z.string().uuid(), IMAGES_MANIFEST: z.string().default('images-work/manifest.json') })
      .parse(process.env);
    const origin = new URL(env.SUPABASE_URL).origin;
    const entries = images.readApproved(env.IMAGES_MANIFEST);
    const ready = await Promise.all(entries.map(async entry => {
      const imageUrl = origin + '/storage/v1/object/public/equipamentos/' + entry.path;
      const versionedUrl = imageUrl + '?v=' + entry.sha256;
      const response = await fetch(versionedUrl, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(20000) });
      if (!response.ok || images.sha256(Buffer.from(await response.arrayBuffer())) !== entry.sha256)
        throw new Error(`Objeto público ausente ou divergente: ${entry.patrimonio}.`);
      return [entry.patrimonio, { ...entry, imageUrl: versionedUrl }] as const;
    }));
    await seedInventory(db, new Map(ready), env.PROFESSOR_USER_ID, env.TEST_USER_ID);
    console.log('Inventário e vínculos conferidos. A carga não cria empréstimos.');
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error('Carga interrompida. Confira o banco, o manifesto, as URLs públicas e os vínculos informados.');
  process.exitCode = 1;
});
