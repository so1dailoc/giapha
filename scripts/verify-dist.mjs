import { existsSync, readFileSync } from 'node:fs';
import { join, normalize } from 'node:path';

const dist = join(process.cwd(), 'dist');
const indexPath = join(dist, 'index.html');

if (!existsSync(indexPath)) {
  console.error('[verify-dist] dist/index.html not found. Vite build did not produce the expected output.');
  process.exit(1);
}

const html = readFileSync(indexPath, 'utf8');
const refs = [...html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g)].map((m) => m[1]);
const missing = refs.filter((ref) => !existsSync(join(dist, normalize(ref.replace(/^\//, '')))));

if (missing.length) {
  console.error('[verify-dist] Broken asset references detected:');
  for (const ref of missing) console.error(`  - ${ref}`);
  process.exit(1);
}

console.log(`[verify-dist] OK — ${refs.length} referenced assets exist in dist/.`);
