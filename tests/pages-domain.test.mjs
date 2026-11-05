import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parsePagesDomain, preservePagesDomain } from '../scripts/pages-domain.mjs';

test('Pages accepts an initial domain and preserves it on subsequent releases', () => {
  assert.equal(preservePagesDomain(undefined, undefined), undefined);
  assert.equal(preservePagesDomain(undefined, 'olyatreskova.ru\n'), 'olyatreskova.ru');
  assert.equal(preservePagesDomain('olyatreskova.ru\n', 'olyatreskova.ru\n'), 'olyatreskova.ru');
});

test('a release cannot silently remove an existing custom domain', () => {
  assert.throws(() => preservePagesDomain('olyatreskova.ru\n', undefined), /Preserve site\/CNAME/);
});

test('CNAME rejects addresses that could unbind or misconfigure the site', () => {
  for (const value of ['', 'https://olyatreskova.ru', 'olyatreskova.ru/path', '*.olyatreskova.ru', 'olyatreskova.ru\nother.ru', '-olya.ru', 'olya..ru']) {
    assert.throws(() => parsePagesDomain(value), /one lowercase domain/);
  }
});

test('the checked-in domain and social preview URLs target the same HTTPS origin', async () => {
  const domain = parsePagesDomain(await readFile(new URL('../site/CNAME', import.meta.url), 'utf8'));
  const html = await readFile(new URL('../site/index.html', import.meta.url), 'utf8');
  const metadata = Object.fromEntries([...html.matchAll(/<meta (?:property|name)="([^"]+)" content="([^"]*)">/g)].map(match => [match[1], match[2]]));
  assert.equal(metadata['og:url'], `https://${domain}/`);
  for (const key of ['og:image', 'og:image:secure_url', 'twitter:image']) {
    assert.equal(new URL(metadata[key]).origin, `https://${domain}`);
  }
});
