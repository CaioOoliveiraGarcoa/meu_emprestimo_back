import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const folders = new Set(['.git', 'node_modules', 'dist', '.vercel', 'coverage', 'images-work',
  'operator-evidence', 'test-results', 'playwright-report']);
const suspicious = [
  /postgres(?:ql)?:\/\/[^\s:/]+:[^\s@]+@(?!localhost\b|127\.0\.0\.1\b)/,
  /(?:ghp_|github_pat_|sb_secret_)[A-Za-z0-9_-]{20,}/,
  /eyJ[A-Za-z0-9_-]{18,}\.eyJ[A-Za-z0-9_-]{18,}\.[A-Za-z0-9_-]{18,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /^[ \t]*(?:PEXELS_API_KEY|PROFESSOR_PASSWORD|TEST_USER_PASSWORD|SUPABASE_SERVICE_ROLE_KEY)[ \t]*=[ \t]*[^\s#]/m,
];
let failures = 0;
function walk(root, current) {
  for (const item of readdirSync(current, { withFileTypes: true })) {
    const path = join(current, item.name);
    if (item.isDirectory() && !folders.has(item.name)) walk(root, path);
    if (!item.isFile() || (/^\.env(?:\.|$)/.test(item.name) && item.name !== '.env.example')) continue;
    if (suspicious.some(pattern => pattern.test(readFileSync(path, 'utf8')))) {
      console.error('Possível segredo em ' + relative(root, path));
      failures++;
    }
  }
}
for (const root of process.argv.slice(2).length ? process.argv.slice(2) : ['.']) walk(root, root);
if (failures) process.exitCode = 1;
else console.log('Nenhum padrão de segredo encontrado nos arquivos inspecionados.');
