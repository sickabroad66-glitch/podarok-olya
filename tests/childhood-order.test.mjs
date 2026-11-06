import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { memories } from '../site/data/memories.js';

// Fingerprints of the approved web copies in the family's exact attachment order.
// Checking pixels/files as well as IDs catches an accidental image swap behind a stable ID.
const expected = [
  '21a856b4f5803fd20ca9d4a1e0287a76ddb7fd7c8b257a0bd254713a261c5e5a',
  '225e45e1ebb064c65bd265a90262c226959cd2c76960a1e23b7f3e0394437b2b',
  'd9a50a58e665f24e09bd40a122881bebc49e7366b718a7d57fa1e73c5b78502d',
  '5d1918a08dd574c43d44d8c4740919626cee45059e3f483fce9daaa8e3b037a9',
  '3eb94927bb66d6c3603015d8baa3949fd5d7aec44d99be1db2edeaace63a6b9c',
  '04800f5eb256c7f8800d2e0cd1f59bb76f0b1fbd3e6c61dd9effa540ad1af24f',
  '04f1fb8634ef3807a1bd37349b4264d5fdbef0fa84f6545715d3f727811adc2a',
  'f6415d3f97e409d98b45e2ac94d5c0de06f10c73f98050786ccd2002e7de315e',
  '20563143b77235a98f9ea27ea72ca100bdd38213cdb4690a3715a130f8cb7c03',
  '36c2f0475d315dd7cae76d1ee72beb72a6f2250b592957f71347137b93d1b4d0',
  '1b64177d39466d3522774bd04a520c75c370d9d1754412c55eb13bd3b2e5f343',
  'af7cd7fc91ecd7ba6c45c844c234b92ef83480274251b39e5e6331b2a10e27a3',
  'e92d700a539bae76b300afeb935a063c102e03f43e8857c2b5ff4a949a4b2c4b',
];

test('dad recording keeps all thirteen photographs in the exact narrated order', async () => {
  const childhood = memories.find(memory => memory.id === 'childhood');
  assert(childhood, 'The family album must be part of the rendered memories');
  const hashes = await Promise.all(childhood.media.map(async media => {
    const file = await readFile(new URL(`../site/${media.src}`, import.meta.url));
    return createHash('sha256').update(file).digest('hex');
  }));
  assert.deepEqual(hashes, expected);
  assert.deepEqual([childhood.media[11].width, childhood.media[11].height], [960, 1280]);
});
