import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTime, clampIndex, PlaybackCoordinator } from '../site/lib/media.js';
import { parseRange } from '../scripts/http-utils.mjs';

test('time labels handle duration, seeking and unknown metadata', () => {
  assert.equal(formatTime(840.512), '14:00');
  assert.equal(formatTime(65.8), '1:05');
  assert.equal(formatTime(-5), '0:00');
  assert.equal(formatTime(NaN), '0:00');
});

test('viewer navigation stays inside the available media', () => {
  assert.equal(clampIndex(-1, 21), 0);
  assert.equal(clampIndex(21, 21), 20);
  assert.equal(clampIndex(4, 21), 4);
  assert.equal(clampIndex(3, 0), 0);
});

test('starting a video pauses a voice recording and vice versa', () => {
  class Media extends EventTarget {
    paused = true;
    play() { this.paused = false; this.dispatchEvent(new Event('play')); }
    pause() { this.paused = true; }
  }
  const coordinator = new PlaybackCoordinator();
  const voice = new Media();
  const video = new Media();
  coordinator.register(voice);
  const unregister = coordinator.register(video);
  voice.play();
  assert.equal(voice.paused, false);
  video.play();
  assert.equal(voice.paused, true);
  assert.equal(video.paused, false);
  voice.play();
  assert.equal(video.paused, true);
  unregister();
  video.play();
  assert.equal(voice.paused, false, 'A removed viewer must not keep a live listener.');
});

test('byte ranges support audio/video seeking and reject invalid requests', () => {
  assert.deepEqual(parseRange('bytes=100-199', 1000), { start: 100, end: 199 });
  assert.deepEqual(parseRange('bytes=900-', 1000), { start: 900, end: 999 });
  assert.deepEqual(parseRange('bytes=-80', 1000), { start: 920, end: 999 });
  assert.deepEqual(parseRange('bytes=950-2000', 1000), { start: 950, end: 999 });
  assert.deepEqual(parseRange('bytes=-2000', 1000), { start: 0, end: 999 });
  assert.equal(parseRange('bytes=1000-', 1000), false);
  assert.equal(parseRange('bytes=8-4', 1000), false);
  assert.equal(parseRange('bytes=-0', 1000), false);
  assert.equal(parseRange('bytes=0-2,4-6', 1000), false);
  assert.equal(parseRange(undefined, 1000), undefined);
});
