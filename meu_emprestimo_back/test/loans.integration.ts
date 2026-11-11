import { execFileSync } from 'node:child_process';
import { createHash, generateKeyPairSync, randomUUID, sign } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { INestApplication } from '@nestjs/common';
import type { Equipment, EquipmentStatus } from '@prisma/client';
import request = require('supertest');
import { createApp } from '../src/bootstrap';
import { PrismaService } from '../src/common/prisma.service';
import { images, seedInventory, TENANT } from '../prisma/seed-data';

const key = generateKeyPairSync('ec', { namedCurve: 'P-256' });
const jwk = { ...key.publicKey.export({ format: 'jwk' }), kid: 'test-ec-key', alg: 'ES256', use: 'sig' };
let server: Server;
let app: INestApplication;
let db: PrismaService;
let container: StartedPostgreSqlContainer | undefined;
let issuer: string;
const testSchema = 'teste_' + randomUUID().replaceAll('-', '');

function token(tenant: string, user: string, exp = Math.floor(Date.now() / 1000) + 600) {
  const base = (data: object) => Buffer.from(JSON.stringify(data)).toString('base64url');
  const unsigned = base({ alg: 'ES256', kid: jwk.kid, typ: 'JWT' }) + '.' +
    base({ iss: issuer, sub: user, aud: 'authenticated', exp, app_metadata: { tenant_id: tenant } });
  return unsigned + '.' + sign('sha256', Buffer.from(unsigned), {
    key: key.privateKey, dsaEncoding: 'ieee-p1363',
  }).toString('base64url');
}
beforeAll(async () => {
  let url = process.env.TEST_DATABASE_URL;
  if (url && !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname))
    throw new Error('Teste só permite banco local.');
  if (!url) {
    container = await new PostgreSqlContainer('postgres:17-alpine').start();
    url = container.getConnectionUri();
  }
  const isolated = new URL(url);
  isolated.searchParams.set('schema', testSchema);
  process.env.DATABASE_URL = isolated.href;
  process.env.DIRECT_URL = isolated.href;
  execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], { stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: isolated.href, DIRECT_URL: isolated.href } });
  server = createServer((req, res) => {
    if (req.url === '/auth/v1/.well-known/jwks.json') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ keys: [jwk] }));
    } else { res.statusCode = 404; res.end(); }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  process.env.SUPABASE_URL = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  issuer = process.env.SUPABASE_URL + '/auth/v1';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'public-local-test-only';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  app = await createApp();
  db = app.get(PrismaService);
});
afterAll(async () => {
  if (db) await db.$executeRawUnsafe('DROP SCHEMA IF EXISTS ' + testSchema + ' CASCADE');
  await app?.close();
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  await container?.stop();
});

async function tenant() {
  const tenantId = randomUUID();
  const users = [randomUUID(), randomUUID()];
  await db.tenant.create({ data: { id: tenantId, name: 'Teste isolado' } });
  await db.membership.createMany({ data: users.map(userId => ({ userId, tenantId, role: 'COLABORADOR' })) });
  const api = request(app.getHttpServer());
  const auth = (index = 0) => 'Bearer ' + token(tenantId, users[index]);
  const borrow = (item: Equipment, index = 0) =>
    api.post('/v1/emprestimos').set('Authorization', auth(index)).send({ equipamentoId: item.id });
  const catalog = (index = 0) => api.get('/v1/equipamentos').set('Authorization', auth(index));
  const loans = (index = 0) => api.get('/v1/emprestimos').set('Authorization', auth(index));
  async function equipment(number: number, situacao: EquipmentStatus = 'disponivel') {
    return db.equipment.create({ data: { tenantId, patrimonio: 'TI-' + String(number).padStart(4, '0'),
      nome: 'Equipamento teste ' + number, categoria: 'notebook', situacao,
      imageUrl: 'https://example.invalid/image.jpg', photoId: number,
      photoSha256: createHash('sha256').update(String(number)).digest('hex'),
      photographer: 'Fixture local', photoPage: 'https://example.invalid/photo', licenseUrl: 'https://example.invalid/license' } });
  }
  return { api, auth, tenantId, users, borrow, equipment, catalog, loans };
}

it('CA-E01/02/08/09 autentica JWT por JWKS, cria e lista só o empréstimo próprio', async () => {
  const group = await tenant();
  const item = await group.equipment(1);
  const second = await group.equipment(2);
  const firstPage = await group.catalog().query({ limit: 1 }).expect(200);
  expect(firstPage.body).toMatchObject({ items: [{ id: item.id, situacao: 'disponivel' }], nextCursor: 'TI-0001' });
  const nextPage = await group.catalog().query({ cursor: firstPage.body.nextCursor }).expect(200);
  expect(nextPage.body.items.map((x: Equipment) => x.id)).toEqual([second.id]);
  const loan = await group.borrow(item).expect(201);
  expect(loan.body.equipment).toMatchObject({ id: item.id, situacao: 'emprestado' });
  expect(Date.parse(loan.body.dueAt) - Date.parse(loan.body.requestedAt)).toBe(14 * 86400000);
  const own = await group.loans().expect(200);
  expect(own.body.items).toMatchObject([{ id: loan.body.id, dueAt: loan.body.dueAt }]);
  expect((await group.loans(1).expect(200)).body).toEqual({ items: [], nextCursor: null });
  expect(await db.auditEvent.count({ where: { resourceId: loan.body.id } })).toBe(1);
});

it('CA-E03 impede a quarta solicitação e CA-E05 rejeita item em manutenção ou emprestado', async () => {
  const group = await tenant();
  const items = await Promise.all([1, 2, 3, 4].map(i => group.equipment(i)));
  const maintenance = await group.equipment(5, 'manutencao');
  expect((await group.borrow(maintenance).expect(409)).body).toMatchObject({ code: 'UNAVAILABLE', detail: 'Equipamento em manutenção.' });
  for (const item of items.slice(0, 3)) await group.borrow(item).expect(201);
  expect((await group.borrow(items[3]).expect(409)).body).toMatchObject({ code: 'LOAN_LIMIT', detail: expect.stringContaining('3') });
  expect((await group.borrow(items[0], 1).expect(409)).body).toMatchObject({ code: 'UNAVAILABLE', detail: 'Equipamento já emprestado.' });
  const firstPage = await group.loans().query({ limit: 2 }).expect(200);
  const nextPage = await group.loans().query({ limit: 2, cursor: firstPage.body.nextCursor }).expect(200);
  expect(new Set([...firstPage.body.items, ...nextPage.body.items].map(row => row.id)).size).toBe(3);
  expect(nextPage.body.nextCursor).toBeNull();
});

it('CA-E04 rejeita atraso com só um empréstimo aberto', async () => {
  const group = await tenant();
  const old = await group.equipment(1, 'emprestado');
  const next = await group.equipment(2);
  await db.loan.create({ data: { tenantId: group.tenantId, userId: group.users[0], equipmentId: old.id,
    requestedAt: new Date('2020-01-01'), dueAt: new Date('2020-01-15') } });
  expect((await group.borrow(next).expect(409)).body).toMatchObject({ code: 'OVERDUE_LOAN' });
});

it('CA-E06 dois usuários disputam um item e apenas um empréstimo existe', async () => {
  const group = await tenant();
  const item = await group.equipment(1);
  const results = await Promise.all([group.borrow(item, 0), group.borrow(item, 1)]);
  expect(results.map(x => x.status).sort()).toEqual([201, 409]);
  expect(results.find(x => x.status === 409)?.body.code).toBe('UNAVAILABLE');
  expect(await db.loan.count({ where: { equipmentId: item.id } })).toBe(1);
});

it('CA-E07 dois pedidos da mesma pessoa com dois empréstimos abertos mantêm limite 3', async () => {
  const group = await tenant();
  const items = await Promise.all([1, 2, 3, 4].map(i => group.equipment(i)));
  await group.borrow(items[0]).expect(201);
  await group.borrow(items[1]).expect(201);
  const results = await Promise.all([group.borrow(items[2]), group.borrow(items[3])]);
  expect(results.map(x => x.status).sort()).toEqual([201, 409]);
  expect(results.find(x => x.status === 409)?.body.code).toBe('LOAN_LIMIT');
  expect(await db.loan.count({ where: { tenantId: group.tenantId, userId: group.users[0] } })).toBe(3);
});

it('CA-E10 rejeita assinatura alterada, token vencido, tenant no body e item de outro tenant', async () => {
  const group = await tenant();
  const other = await tenant();
  const item = await other.equipment(1);
  const authorization = group.auth();
  const start = authorization.lastIndexOf('.') + 1;
  const changed = authorization.slice(0, start) + (authorization[start] === 'a' ? 'b' : 'a') + authorization.slice(start + 1);
  for (const invalid of [changed, 'Bearer ' + token(group.tenantId, group.users[0], 1)])
    expect((await group.api.get('/v1/equipamentos').set('Authorization', invalid).expect(401)).body.code).toBe('INVALID_TOKEN');
  const noMembership = 'Bearer ' + token(other.tenantId, group.users[0]);
  expect((await group.api.get('/v1/equipamentos').set('Authorization', noMembership).expect(403)).body.code).toBe('MEMBERSHIP_REQUIRED');
  expect((await group.catalog().expect(200)).body.items).toEqual([]);
  expect((await group.borrow(item).expect(404)).body.code).toBe('NOT_FOUND');
  const invalid = await group.api.post('/v1/emprestimos').set('Authorization', authorization)
    .send({ equipamentoId: item.id, tenantId: other.tenantId }).expect(400);
  expect(invalid.body.code).toBe('INVALID_REQUEST');
});

it('CA-D01/02/05 repete seed mantendo 12 itens, vínculos e empréstimo de teste', async () => {
  const correctionFixtureId = randomUUID();
  const testId = randomUUID();
  const photos = new Map(images.inventory.map((item, index) => [item.patrimonio, {
    patrimonio: item.patrimonio, photoId: index + 1, sha256: createHash('sha256').update(item.patrimonio).digest('hex'),
    photographer: 'Fixture local', path: item.patrimonio, bytes: Buffer.alloc(0),
    photoPage: 'https://example.invalid/photo', licenseUrl: 'https://example.invalid/license',
    imageUrl: 'https://example.invalid/' + item.patrimonio + '.jpg',
  }]));
  await seedInventory(db, photos, correctionFixtureId, testId);
  const catalog = await db.equipment.findMany({ where: { tenantId: TENANT }, orderBy: { patrimonio: 'asc' } });
  expect(catalog).toHaveLength(12);
  expect(catalog.filter(item => item.situacao === 'manutencao').map(item => item.patrimonio)).toEqual(['TI-0004', 'TI-0007', 'TI-0010']);
  expect(catalog.reduce<Record<string, number>>((counts, item) => {
    counts[item.categoria] = (counts[item.categoria] || 0) + 1; return counts;
  }, {})).toEqual({ notebook: 4, monitor: 3, cabo: 3, camera: 2 });
  const api = request(app.getHttpServer());
  await api.post('/v1/emprestimos').set('Authorization', 'Bearer ' + token(TENANT, testId))
    .send({ equipamentoId: catalog[0].id }).expect(201);
  await seedInventory(db, photos, correctionFixtureId, testId);
  expect(await db.membership.count({ where: { tenantId: TENANT } })).toBe(2);
  expect(await db.equipment.count({ where: { tenantId: TENANT } })).toBe(12);
  expect(await db.loan.count({ where: { tenantId: TENANT, userId: correctionFixtureId } })).toBe(0);
  expect(await db.loan.count({ where: { tenantId: TENANT, userId: testId } })).toBe(1);
  expect((await db.equipment.findUniqueOrThrow({ where: { id: catalog[0].id } })).situacao).toBe('emprestado');
});

it('CA-D09 papel sem BYPASSRLS não lê catálogo e banco impede duplicar empréstimo aberto', async () => {
  const group = await tenant();
  const item = await group.equipment(1);
  await group.borrow(item).expect(201);
  await expect(db.loan.create({ data: { tenantId: group.tenantId, userId: group.users[1], equipmentId: item.id,
    requestedAt: new Date('2026-11-11'), dueAt: new Date('2026-11-25') } })).rejects.toMatchObject({ code: 'P2002' });
  const role = testSchema + '_reader';
  await db.$transaction(async tx => {
    await tx.$executeRawUnsafe('CREATE ROLE ' + role + ' NOLOGIN');
    await tx.$executeRawUnsafe('GRANT USAGE ON SCHEMA ' + testSchema + ' TO ' + role);
    await tx.$executeRawUnsafe('GRANT SELECT ON equipments TO ' + role);
    await tx.$executeRawUnsafe('SET LOCAL ROLE ' + role);
    expect(await tx.$queryRaw`SELECT id FROM equipments`).toEqual([]);
    await tx.$executeRawUnsafe('RESET ROLE');
    await tx.$executeRawUnsafe('DROP OWNED BY ' + role);
    await tx.$executeRawUnsafe('DROP ROLE ' + role);
  });
});

it('CA-E02 reverte empréstimo e situação se a escrita de auditoria falhar', async () => {
  const group = await tenant();
  const item = await group.equipment(1);
  await db.$executeRawUnsafe(`ALTER TABLE audit_events ADD CONSTRAINT refuse_fixture
    CHECK (tenant_id <> '${group.tenantId}')`);
  try {
    expect((await group.borrow(item).expect(500)).body.code).toBe('INTERNAL_ERROR');
    expect(await db.loan.count({ where: { equipmentId: item.id } })).toBe(0);
    expect((await db.equipment.findUniqueOrThrow({ where: { id: item.id } })).situacao).toBe('disponivel');
  } finally {
    await db.$executeRawUnsafe('ALTER TABLE audit_events DROP CONSTRAINT refuse_fixture');
  }
});
