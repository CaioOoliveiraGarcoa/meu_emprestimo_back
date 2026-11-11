import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import manifest from './manifest.cjs';

const { inventory, licenseUrl, readJson, nameOf, checkedUrl, verifyJpeg, verifyEntries, readApproved } = manifest;
const work = 'images-work';
const draft = join(work, 'rascunho.json');
const approved = join(work, 'manifest.json');
const json = (path, value) => writeFile(path, JSON.stringify(value, null, 2) + '\n');

async function pexels(path) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error('Defina PEXELS_API_KEY no terminal ou no .env local.');
  const response = await fetch('https://api.pexels.com/v1/' + path, {
    headers: { Authorization: key }, redirect: 'error', signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('API do Pexels respondeu com HTTP ' + response.status + '.');
  return response.json();
}

async function search(patrimonio, rawPage) {
  const items = patrimonio ? inventory.filter(item => item.patrimonio === patrimonio) : inventory;
  const page = Number(rawPage ?? 1);
  if (!items.length || !Number.isInteger(page) || page < 1) throw new Error('Patrimônio ou página inválidos.');
  await mkdir(join(work, 'buscas'), { recursive: true });
  for (const item of items) {
    const query = new URLSearchParams({ query: item.busca, per_page: '24', page: String(page) });
    const result = await pexels('search?' + query);
    const candidates = result.photos.map(photo => ({
      id: photo.id, photoPage: photo.url, photographer: photo.photographer, preview: photo.src.medium, alt: photo.alt,
    }));
    await json(join(work, 'buscas', `${item.patrimonio}-${page}.json`), candidates);
    console.log(`${item.patrimonio}: ${candidates.length} candidatos.`);
  }
}

async function prepare(file = join(work, 'selecao.json')) {
  const selection = readJson(file);
  const ids = inventory.map(item => selection[item.patrimonio]);
  if (Object.keys(selection).length !== inventory.length ||
      ids.some(id => !Number.isSafeInteger(id) || id < 1 || id > 2147483647) || new Set(ids).size !== ids.length)
    throw new Error('Selecione um ID do Pexels diferente para cada patrimônio.');
  await mkdir(join(work, 'preparadas'), { recursive: true });
  const entries = [];
  for (const item of inventory) {
    const photoId = selection[item.patrimonio];
    const photo = await pexels('photos/' + photoId);
    if (photo.id !== photoId) throw new Error('ID retornado pela API diverge da seleção.');
    const cdn = checkedUrl(photo.src.original, 'images.pexels.com');
    cdn.search = new URLSearchParams({ w: '800', h: '600', fit: 'crop', crop: 'center', fm: 'jpg', dpr: '1' }).toString();
    const response = await fetch(cdn, { redirect: 'error', signal: AbortSignal.timeout(20000) });
    if (!response.ok || !/^image\/jpeg\b/i.test(response.headers.get('content-type') ?? ''))
      throw new Error(`${item.patrimonio}: CDN não devolveu JPEG.`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const sha256 = verifyJpeg(bytes);
    await writeFile(join(work, 'preparadas', nameOf(item.patrimonio, photoId)), bytes);
    entries.push({ patrimonio: item.patrimonio, photoId, sourceUrl: cdn.href, photoPage: photo.url,
      photographer: photo.photographer, licenseUrl, sha256,
      review: { approved: false, reviewer: '', reviewedAt: '', sha256 } });
  }
  verifyEntries(entries, draft, false);
  const rejected = existsSync(draft) ? readJson(draft).rejected : [];
  await json(draft, { version: 1, source: 'Pexels API', entries, rejected });
  console.log('12 arquivos preparados. Confira os JPEGs finais e registre a revisão no rascunho.');
}

async function validate(file = draft) {
  const entries = readApproved(file);
  // O manifesto final referencia os arquivos preparados no mesmo diretório.
  if (file !== draft && file !== approved) throw new Error('Mantenha o rascunho em images-work/rascunho.json.');
  if (file !== approved) await json(approved, readJson(file));
  console.log(`${entries.length} fotos revisadas, únicas e com 800×600 pixels.`);
}

const [action, ...args] = process.argv.slice(2);
const run = { search, prepare, validate }[action];
try {
  if (!run) throw new Error('Comando esperado: search, prepare ou validate.');
  await run(...args);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Falha ao preparar as imagens.');
  process.exitCode = 1;
}
