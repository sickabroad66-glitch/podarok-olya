import assert from 'node:assert/strict';
import { access, readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { memories } from '../site/data/memories.js';

const root = fileURLToPath(new URL('../site/', import.meta.url));
const ids = new Set();
let mediaCount = 0;
async function asset(path) {
  assert.equal(typeof path, 'string');
  assert(!/^(?:[a-z]+:|\/)/i.test(path), `Asset must be local: ${path}`);
  const full = resolve(root, path);
  assert(!relative(root, full).startsWith(`..${sep}`), `Asset outside the public folder: ${path}`);
  assert((await stat(full)).size > 0, `Empty asset: ${path}`);
}
for (const memory of memories) {
  assert(memory.id && !ids.has(memory.id));
  ids.add(memory.id);
  assert(memory.summary.length >= 1 && memory.summary.length <= 2, 'Each memory needs one or two short sentences.');
  assert(memory.summary.every(text => typeof text === 'string' && text.trim()));
  assert(memory.narrator && memory.label);
  await asset(memory.theme.background);
  if (memory.theme.backgroundMobile) await asset(memory.theme.backgroundMobile);
  if (memory.theme.backgroundTablet) await asset(memory.theme.backgroundTablet);
  if (memory.theme.reel) await asset(memory.theme.reel);
  if (memory.inscription) {
    await asset(memory.inscription.src);
    assert(memory.inscription.alt && memory.inscription.width > 0 && memory.inscription.height > 0);
  }
  await asset(memory.audio.src);
  assert(memory.audio.duration > 0);
  assert(memory.audio.waveform.length > 0 && memory.audio.waveform.every(x => x > 0 && x <= 1));
  const mediaIds = new Set();
  for (const item of memory.media) {
    assert(!mediaIds.has(item.id));
    mediaIds.add(item.id);
    assert(['image', 'video'].includes(item.type));
    assert(item.width > 0 && item.height > 0 && item.alt);
    await asset(item.src);
    await asset(item.preview);
    if (item.type === 'video') await asset(item.poster);
    mediaCount += 1;
  }
}
async function checkFiles(folder) {
  for (const item of await readdir(folder, { withFileTypes: true })) {
    const path = resolve(folder, item.name);
    assert(!item.name.startsWith('.'), `Private file in public folder: ${path}`);
    if (item.isDirectory()) await checkFiles(path);
    else if (item.name.endsWith('.js')) {
      const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
    }
    assert(!/transcri|ggml|whisper|manifest\.json|\.wav$|\.heic$/i.test(item.name), `Source/private artifact in public folder: ${path}`);
  }
}
await checkFiles(root);
const html = await readFile(resolve(root, 'index.html'), 'utf8');
assert(html.includes('noindex, nofollow, noarchive'));
await access(resolve(root, 'robots.txt'));
console.log(`Checked ${memories.length} memory, ${mediaCount} media items, all asset paths and JavaScript syntax.`);
