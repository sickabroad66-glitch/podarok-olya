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

test('the scroll scene is reversible and stays inside its bounds', () => {
  assert.equal(birthdayScrollProgress(-50, 800), 0);
  assert.equal(birthdayScrollProgress(0, 800), 0);
  assert.equal(birthdayScrollProgress(800, 800), 1);
  assert.equal(birthdayScrollProgress(1000, 800), 1);
  assert.equal(birthdayScrollProgress(400, 800), 0.5);
  assert.equal(birthdayScrollProgress(200, 360, 370), 0);
  assert.equal(birthdayScrollProgress(550, 360, 370), 0.5);
  assert.equal(birthdayScrollProgress(730, 360, 370), 1);
  assert(Number.isFinite(birthdayScrollProgress(10, 0)));
});
