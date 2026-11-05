import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const site = fileURLToPath(new URL('../site/', import.meta.url));
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(site, dist, { recursive: true });
await writeFile(new URL('../dist/.nojekyll', import.meta.url), '');
console.log('Static site ready in dist/. Nothing published.');
