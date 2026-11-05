import test from 'node:test';
import assert from 'node:assert/strict';
import { candleStrength, birthdayScrollProgress } from '../site/lib/birthday.js';

test('five candles start lit and extinguish as the visitor scrolls down', () => {
  for (let i = 0; i < 5; i += 1) {
    assert.equal(candleStrength(0, i), 1);
    assert.equal(candleStrength(1, i), 0);
    let previous = 1;
    for (let progress = 0; progress <= 1; progress += 0.025) {
      const strength = candleStrength(progress, i);
      assert(strength >= 0 && strength <= 1);
      assert(strength <= previous);
      previous = strength;
    }
  }
  assert.equal(candleStrength(0.5, 0), 0);
  assert(candleStrength(0.5, 4) > 0);
  for (let i = 0; i < 5; i += 1) assert.equal(candleStrength(0.15, i), 1);
});

test('normal page scrolling extinguishes candles before they leave the screen', () => {
  for (const [candleY, viewport] of [[346, 844], [329, 568], [288, 390], [410, 1024]]) {
    assert.equal(birthdayScrollProgress(-50, candleY, viewport), 0);
    assert.equal(birthdayScrollProgress(0, candleY, viewport), 0);
    assert.equal(birthdayScrollProgress(candleY - 48, candleY, viewport), 1);
    assert.equal(birthdayScrollProgress(candleY + 500, candleY, viewport), 1);
    assert(birthdayScrollProgress(candleY / 2, candleY, viewport) > 0);
  }
});

test('candles below a short viewport wait until visible, and scrolling back relights them', () => {
  assert.equal(birthdayScrollProgress(0, 600, 390), 0);
  assert.equal(birthdayScrollProgress(200, 600, 390), 0);
  assert(birthdayScrollProgress(400, 600, 390) > 0);
  assert.equal(birthdayScrollProgress(600, 600, 390), 1);
  assert.equal(birthdayScrollProgress(200, 600, 390), 0);
  assert(Number.isFinite(birthdayScrollProgress(10, 0, 0)));
});
