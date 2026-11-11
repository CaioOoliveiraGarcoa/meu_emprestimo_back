import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import manifest from './manifest.cjs';

function jpeg(width = 800, height = 600, variant = 0) {
  const buffer = Buffer.from([255,216,255,192,0,11,8,0,0,0,0,1,1,17,0,255,218,0,8,1,1,0,0,63,0,variant,255,217]);
  buffer.writeUInt16BE(height, 7);
  buffer.writeUInt16BE(width, 9);
  return buffer;
}
test('CA-D03 rejeita JPEG fora das dimensões e bytes sem cabeçalho', () => {
  assert.match(manifest.verifyJpeg(jpeg()), /^[a-f0-9]{64}$/);
  assert.throws(() => manifest.verifyJpeg(jpeg(801)), /801×600/);
  assert.throws(() => manifest.verifyJpeg(Buffer.from('ffd8ffc0000b080258032001011100ffd9', 'hex')), /cabeçalho/);
  assert.throws(() => manifest.verifyJpeg(Buffer.from('no JPEG')), /JPEG completo/);
});
test('CA-D03/D04 rejeita revisão de bytes divergentes e fonte fora do Pexels', () => {
  const dir = mkdtempSync(join(tmpdir(), 'emprest-images-test-'));
  try {
    const file = join(dir, 'manifest.json');
    mkdirSync(join(dir, 'preparadas'));
    const entries = manifest.inventory.map((item, index) => {
      const photoId = index + 10;
      const bytes = jpeg(800, 600, index);
      const sha256 = manifest.verifyJpeg(bytes);
      writeFileSync(join(dir, 'preparadas', manifest.nameOf(item.patrimonio, photoId)), bytes);
      return { patrimonio: item.patrimonio, photoId, sha256, photographer: 'Fixture',
        sourceUrl: 'https://images.pexels.com/photos/' + photoId + '/fixture.jpg',
        photoPage: 'https://www.pexels.com/photo/fixture-' + photoId + '/', licenseUrl: manifest.licenseUrl,
        review: { approved: true, reviewedAt: '2026-11-11T12:00:00Z', reviewer: 'Fixture', sha256 } };
    });
    const read = () => {
      writeFileSync(file, JSON.stringify({ version: 1, source: 'Pexels API', entries, rejected: [] }));
      return manifest.readApproved(file);
    };
    assert.equal(read().length, 12);
    entries[1].photoId = entries[0].photoId;
    assert.throws(read, /repetida/);
    entries[1].photoId = 11;
    entries[1].review.sha256 = 'alterado';
    assert.throws(read, /aprovação visual/);
    entries[1].review.sha256 = entries[1].sha256;
    entries[1].sourceUrl = 'https://invalid.example/photo.jpg';
    assert.throws(read, /origem permitida/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
