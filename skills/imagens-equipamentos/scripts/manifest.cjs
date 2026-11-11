const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { dirname, join } = require('node:path');
const inventory = require('../references/equipamentos.json');

const licenseUrl = 'https://www.pexels.com/license/';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const readJson = file => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const nameOf = (patrimonio, id) => `${patrimonio}-${id}.jpg`;
const objectPath = patrimonio => `equipamentos/${patrimonio}.jpg`;
const filename = entry => join('preparadas', nameOf(entry.patrimonio, entry.photoId));

function checkedUrl(value, host) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.host !== host || url.username || url.password)
    throw new Error('URL fora da origem permitida do Pexels.');
  return url;
}

function dimensions(bytes) {
  if (bytes.length < 12 || bytes.readUInt16BE(0) !== 0xffd8 || bytes.readUInt16BE(bytes.length - 2) !== 0xffd9)
    throw new Error('Arquivo não é um JPEG completo.');
  const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let index = 2;
  let frame;
  while (index + 3 < bytes.length) {
    if (bytes[index++] !== 0xff) break;
    while (bytes[index] === 0xff) index++;
    const marker = bytes[index++];
    if (marker === 0xd9 || index + 2 > bytes.length) break;
    const length = bytes.readUInt16BE(index);
    if (length < 2 || index + length > bytes.length) break;
    if (frameMarkers.has(marker) && length >= 8)
      frame = { height: bytes.readUInt16BE(index + 3), width: bytes.readUInt16BE(index + 5) };
    if (marker === 0xda) {
      if (frame && length >= 6 && index + length < bytes.length - 2) return frame;
      break;
    }
    index += length;
  }
  throw new Error('JPEG sem cabeçalho de dimensões válido.');
}

function verifyJpeg(bytes) {
  const { width, height } = dimensions(bytes);
  if (width !== 800 || height !== 600) throw new Error(`JPEG com ${width}×${height}. Esperado 800×600.`);
  return sha256(bytes);
}

function verifyEntries(entries, file, requireReview = true) {
  if (!Array.isArray(entries) || entries.length !== inventory.length)
    throw new Error('O manifesto precisa dos 12 patrimônios.');
  const ids = new Set();
  const hashes = new Set();
  return inventory.map(item => {
    const entry = entries.find(row => row.patrimonio === item.patrimonio);
    if (!entry || !Number.isSafeInteger(entry.photoId) || entry.photoId < 1 || entry.photoId > 2147483647)
      throw new Error(`${item.patrimonio}: ID de foto inválido ou ausente.`);
    if (ids.has(entry.photoId)) throw new Error(`${item.patrimonio}: foto Pexels repetida.`);
    const page = checkedUrl(entry.photoPage, 'www.pexels.com');
    const cdn = checkedUrl(entry.sourceUrl, 'images.pexels.com');
    if (!page.pathname.startsWith('/photo/') || !new RegExp(`(?:-|/)${entry.photoId}/?$`).test(page.pathname) ||
        !cdn.pathname.startsWith(`/photos/${entry.photoId}/`) || entry.licenseUrl !== licenseUrl ||
        typeof entry.photographer !== 'string' || !entry.photographer.trim())
      throw new Error(`${item.patrimonio}: procedência ou crédito inválido.`);
    const bytes = readFileSync(join(dirname(file), filename(entry)));
    const hash = verifyJpeg(bytes);
    if (hash !== entry.sha256 || hashes.has(hash))
      throw new Error(`${item.patrimonio}: arquivo alterado ou repetido.`);
    const review = entry.review;
    if (requireReview && (review?.approved !== true || review.sha256 !== hash ||
        typeof review.reviewer !== 'string' || !review.reviewer.trim() ||
        !Number.isFinite(Date.parse(review.reviewedAt))))
      throw new Error(`${item.patrimonio}: falta aprovação visual deste arquivo.`);
    ids.add(entry.photoId);
    hashes.add(hash);
    return { ...entry, bytes, path: objectPath(item.patrimonio) };
  });
}

function readApproved(file) {
  const data = readJson(file);
  if (data.version !== 1 || data.source !== 'Pexels API' || !Array.isArray(data.rejected) ||
      data.rejected.some(row => !inventory.some(item => item.patrimonio === row.patrimonio) ||
        !Number.isSafeInteger(row.photoId) || row.photoId < 1 || typeof row.reason !== 'string' || !row.reason.trim()))
    throw new Error('Manifesto de imagens inválido.');
  return verifyEntries(data.entries, file);
}

module.exports = { inventory, licenseUrl, sha256, readJson, nameOf, checkedUrl, dimensions, verifyJpeg, verifyEntries, readApproved };
