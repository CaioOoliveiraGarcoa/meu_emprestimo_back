import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import manifest from '../skills/imagens-equipamentos/scripts/manifest.cjs';

const TENANT = 'suporte_ti';
const PROFESSOR = 'marcelo.grilo@institutojef.org.br';
const bucket = 'equipamentos';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error('Variável obrigatória: ' + name);
  return value;
}

async function findUser(admin, email) {
  for (let page = 1; ; page++) {
    const { data, error } = await admin.listUsers({ page, perPage: 100 });
    if (error) throw new Error('Falha ao consultar contas no painel de Auth.');
    const user = data.users.find(user => user.email?.toLowerCase() === email);
    if (user || data.users.length < 100) return user;
  }
}

async function ensureUser(admin, email, password) {
  const user = await findUser(admin, email);
  if (!user) {
    const { data, error } = await admin.createUser({ email, password, email_confirm: true,
      app_metadata: { tenant_id: TENANT } });
    if (error || !data.user) throw new Error('Falha ao criar a conta. Confira a configuração do Supabase Auth.');
    return data.user.id;
  }
  if (!user.email_confirmed_at) throw new Error('A conta existente precisa estar com e-mail confirmado no Auth.');
  const tenant = user.app_metadata.tenant_id;
  if (tenant && tenant !== TENANT) throw new Error('A conta existente pertence a outra área.');
  if (!tenant) {
    const { error } = await admin.updateUserById(user.id, { app_metadata: { ...user.app_metadata, tenant_id: TENANT } });
    if (error) throw new Error('Falha ao definir o tenant da conta existente.');
  }
  return user.id;
}

async function accounts(client) {
  const testEmail = required('TEST_USER_EMAIL').trim().toLowerCase();
  if (testEmail === PROFESSOR || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(testEmail))
    throw new Error('Use um e-mail válido e separado para testes.');
  const professorPassword = required('PROFESSOR_PASSWORD');
  const testPassword = required('TEST_USER_PASSWORD');
  if (professorPassword === testPassword) throw new Error('Use uma senha diferente para a conta de teste.');
  const professor = await ensureUser(client.auth.admin, PROFESSOR, professorPassword);
  const test = await ensureUser(client.auth.admin, testEmail, testPassword);
  console.log('PROFESSOR_USER_ID=' + professor);
  console.log('TEST_USER_ID=' + test);
}

async function publicBytes(url) {
  const response = await fetch(url, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(20000) });
  return response.ok ? Buffer.from(await response.arrayBuffer()) : null;
}

async function upload(client) {
  const entries = manifest.readApproved(process.env.IMAGES_MANIFEST || 'images-work/manifest.json');
  const existing = await client.storage.getBucket(bucket);
  if (!existing.data) {
    const result = await client.storage.createBucket(bucket, { public: true, allowedMimeTypes: ['image/jpeg'] });
    if (result.error) throw new Error('Falha ao criar o bucket público de equipamentos.');
  } else if (!existing.data.public) {
    throw new Error('O bucket equipamentos existente precisa estar público.');
  }
  const objects = client.storage.from(bucket);
  for (const entry of entries) {
    const { data: { publicUrl } } = objects.getPublicUrl(entry.path);
    const present = await publicBytes(publicUrl + '?v=' + entry.sha256);
    if (!present || manifest.sha256(present) !== entry.sha256) {
      const { error } = await objects.upload(entry.path, entry.bytes, {
        contentType: 'image/jpeg', upsert: true, cacheControl: '60',
      });
      if (error) throw new Error('Falha de upload para ' + entry.patrimonio + '.');
    }
    const verified = await publicBytes(publicUrl + '?v=' + entry.sha256);
    if (!verified || manifest.sha256(verified) !== entry.sha256)
      throw new Error('URL pública não corresponde ao manifesto: ' + entry.patrimonio + '.');
    console.log(entry.patrimonio + ' conferido no bucket público.');
  }
}

try {
  const action = process.argv[2];
  if (!['contas', 'upload'].includes(action)) throw new Error('Escolha contas ou upload.');
  const client = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  if (action === 'contas') await accounts(client);
  else await upload(client);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Falha na operação.');
  process.exitCode = 1;
}
