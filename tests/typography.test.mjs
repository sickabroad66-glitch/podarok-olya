import test from 'node:test';
import assert from 'node:assert/strict';
import { tidyRussianText } from '../site/lib/typography.js';

test('Russian captions keep prepositions and their final word pair together', () => {
  const source = 'Океан, кокосы под дождём и наши балийские приключения. За эту поездку мы стали почти родными.';
  const formatted = tidyRussianText(source);
  assert(formatted.includes('и\u00a0наши'));
  assert(formatted.includes('под\u00a0дождём'));
  assert(formatted.includes('За\u00a0эту'));
  assert(formatted.endsWith('почти\u00a0родными.'));
  assert.equal(formatted.replace(/\s/gu, ' '), source);
});

test('birthday copy keeps age and the final phrase intact without changing its words', () => {
  const source = 'Тебе 25. Мы собрали моменты, которые хочется пережить ещё раз.';
  const formatted = tidyRussianText(source);
  assert(formatted.startsWith('Тебе\u00a025.'));
  assert(formatted.endsWith('ещё\u00a0раз.'));
  assert.equal(formatted.replace(/\s/gu, ' '), source);
  assert.equal(tidyRussianText('Наш Бали'), 'Наш\u00a0Бали');
});
