import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backend = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const frontend = resolve(args.find(arg => !arg.startsWith('--')) ?? join(backend, '../meu_emprestimo_front'));
const paths = {
  back: ['api', 'prisma', 'src', 'test', 'scripts', 'skills', '.codex', 'docs/specs', 'docs/PRD.md', 'docs/adr', '.github/workflows', 'tsconfig.json', 'tsconfig.build.json', 'nest-cli.json', 'package.json', 'package-lock.json', 'openapi.json', 'vercel.json'],
  front: ['src', 'e2e', 'index.html', 'styles.css', 'scripts', '.github/workflows', 'tsconfig.json', 'vite.config.ts', 'orval.config.ts', 'tailwind.config.cjs', 'postcss.config.cjs', 'openapi.json', 'vercel.json', 'package.json', 'package-lock.json', 'playwright.config.ts'],
};
const hash = createHash('sha256');
function scan(root, relative, name) {
  const path = join(root, relative);
  const item = statSync(path);
  if (item.isDirectory()) {
    for (const child of readdirSync(path).sort()) scan(root, relative + '/' + child, name);
  } else {
    const bytes = Buffer.from(readFileSync(path, 'utf8').replaceAll('\r\n', '\n'));
    hash.update(name + '/' + relative + '\0' + bytes.length + '\0');
    hash.update(bytes);
  }
}

try {
  for (const [name, root] of [['back', backend], ['front', frontend]]) {
    for (const path of paths[name]) scan(root, path, name);
  }
  const fingerprint = hash.digest('hex');
  if (args.includes('--snapshot')) {
    console.log(fingerprint);
  } else {
    const reportPath = join(backend, 'docs/evidencias/verificacao.json');
    if (!existsSync(reportPath)) throw new Error('Falta parecer do verificador para as duas specs.');
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    if (report.fingerprint !== fingerprint) throw new Error('O código mudou depois da revisão. Rode outra verificação.');
    const specs = [
      '001-dados-iniciais/spec.md',
      '002-solicitar-emprestimo/spec.md',
    ].flatMap(path => [...readFileSync(join(backend, 'docs/specs', path), 'utf8').matchAll(/^\| (CA-[DE]\d+) \|/gm)].map(match => match[1]));
    const incomplete = specs.filter(id => report.criteria[id]?.status !== 'APROVADO' || !report.criteria[id]?.evidence?.trim());
    if (incomplete.length) throw new Error('Critérios aguardando aprovação: ' + incomplete.join(', '));
    console.log('As duas specs têm parecer aprovado para este snapshot.');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Falha no portão de verificação.');
  process.exitCode = 1;
}
