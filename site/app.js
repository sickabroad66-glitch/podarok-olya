import { memories } from './data/memories.js';
import { formatTime, clampIndex, PlaybackCoordinator } from './lib/media.js';
import { createBirthdayHero } from './lib/birthday.js';
import { tidyRussianText } from './lib/typography.js';

const icons = {
  play: '<path d="M8 5.5 19 12 8 18.5Z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 5h3v14H8zm6 0h3v14h-3z" fill="currentColor" stroke="none"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  sound: '<path d="m4 9 5 0 5-4v14l-5-4H4ZM18 8c2 2 2 6 0 8"/>',
  retry: '<path d="M19 8a8 8 0 1 0 1 8M19 3v6h-6"/>',
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const coordinator = new PlaybackCoordinator();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const galleries = [];

function makeButton(className, label, iconName) {
  const button = el('button', className);
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.innerHTML = icon(iconName);
  return button;
}

function makePlayer(memory) {
  const player = el('div', 'player');
  player.setAttribute('role', 'group');
  player.setAttribute('aria-label', `Голосовое воспоминание: ${memory.narrator}`);
  const audio = el('audio');
  audio.preload = 'metadata';
  audio.src = memory.audio.src;
  coordinator.register(audio);
  const play = makeButton('player__play', `Воспроизвести запись: ${memory.narrator}`, 'play');
  play.innerHTML = `<span class="player__symbol player__symbol--play">${icon('play')}</span><span class="player__symbol player__symbol--pause">${icon('pause')}</span>`;
  const hint = el('span', 'player__hint', memory.audioLabel ?? memory.narrator);
  const content = el('div', 'player__content');
  const contentInner = el('div', 'player__inner');
  content.id = `${memory.id}-audio-details`;
  content.inert = true;
  content.setAttribute('aria-hidden', 'true');
  play.setAttribute('aria-controls', content.id);
  play.setAttribute('aria-expanded', 'false');
  const heading = el('div', 'player__heading');
  const name = el('span', 'player__name', memory.narrator);
  const voice = el('span', 'player__voice');
  voice.innerHTML = icon('sound');
  voice.append('рассказывает');
  const time = el('span', 'player__time');
  time.setAttribute('aria-hidden', 'true');
  heading.append(name, voice, time);

  const wave = el('div', 'player__wave');
  const waveId = `${memory.id}-wave`;
  const bars = memory.audio.waveform.map((level, i) => {
    const height = Math.max(5, level * 38);
    return `<rect x="${i * 4}" y="${(44 - height) / 2}" width="2" height="${height}" rx="1"/>`;
  }).join('');
  wave.innerHTML = `<svg viewBox="0 0 384 44" preserveAspectRatio="none" aria-hidden="true"><defs><clipPath id="${waveId}"><rect class="wave-progress" width="0" height="44"/></clipPath></defs><g class="wave-rest">${bars}</g><g class="wave-played" clip-path="url(#${waveId})">${bars}</g></svg>`;
  const progress = wave.querySelector('.wave-progress');
  const seek = el('input', 'player__seek');
  seek.type = 'range';
  seek.min = '0';
  seek.max = String(memory.audio.duration);
  seek.step = '0.1';
  seek.value = '0';
  seek.disabled = true;
  seek.setAttribute('aria-label', `Перемотать запись: ${memory.narrator}`);
  wave.append(seek);
  const status = el('p', 'player__status');
  status.setAttribute('role', 'status');
  status.hidden = true;
  contentInner.append(heading, wave, status);
  content.append(contentInner);
  player.append(play, hint, content, audio);

  function expandPlayer() {
    if (player.classList.contains('is-expanded')) return;
    player.classList.add('is-expanded');
    content.inert = false;
    content.removeAttribute('aria-hidden');
    seek.disabled = false;
    play.setAttribute('aria-expanded', 'true');
  }

  function update() {
    const duration = Number.isFinite(audio.duration) ? audio.duration : memory.audio.duration;
    seek.max = String(duration);
    seek.value = String(audio.currentTime || 0);
    progress.setAttribute('width', String(duration ? (audio.currentTime / duration) * 384 : 0));
    time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(duration)}`;
    seek.setAttribute('aria-valuetext', `${formatTime(audio.currentTime)} из ${formatTime(duration)}`);
    const playing = !audio.paused && !audio.ended;
    if (playing) expandPlayer();
    play.setAttribute('aria-label', `${playing ? 'Приостановить' : 'Воспроизвести'} запись: ${memory.narrator}`);
    player.classList.toggle('is-playing', playing);
  }

  function showError() {
    expandPlayer();
    status.textContent = 'Запись не загрузилась. Нажмите воспроизведение ещё раз.';
    status.hidden = false;
    player.dataset.failed = 'true';
    update();
  }

  play.addEventListener('click', async () => {
    expandPlayer();
    if (!audio.paused) {
      audio.pause();
      return;
    }
    if (player.dataset.failed === 'true') audio.load();
    if (audio.ended) audio.currentTime = 0;
    try {
      await audio.play();
      status.hidden = true;
      delete player.dataset.failed;
    } catch {
      showError();
    }
  });
  seek.addEventListener('input', () => {
    const target = Number(seek.value);
    if (audio.readyState === 0) {
      audio.addEventListener('loadedmetadata', () => { audio.currentTime = target; }, { once: true });
      audio.load();
    } else {
      audio.currentTime = target;
    }
    progress.setAttribute('width', String((target / Number(seek.max)) * 384));
    time.textContent = `${formatTime(target)} / ${formatTime(Number(seek.max))}`;
  });
  for (const event of ['loadedmetadata', 'durationchange', 'timeupdate', 'play', 'pause', 'ended', 'seeked']) {
    audio.addEventListener(event, update);
  }
  audio.addEventListener('error', showError);
  update();
  return player;
}

const viewer = document.querySelector('#viewer');
const stage = viewer.querySelector('.viewer__stage');
const viewerCounter = viewer.querySelector('.viewer__counter');
const viewerError = viewer.querySelector('.viewer__error');
const closeViewer = viewer.querySelector('.viewer__close');
const previousViewer = viewer.querySelector('.viewer__previous');
const nextViewer = viewer.querySelector('.viewer__next');
closeViewer.innerHTML = icon('close');
previousViewer.innerHTML = icon('left');
nextViewer.innerHTML = icon('right');
let activeGallery;
let activeIndex = 0;
let openedIndex = 0;
let returnFocus;
let activeMedia;
let pendingMedia;
let unregisterVideo;
let previousOverflow = '';
let viewerClosing = false;
let mediaRequest = 0;
const mediaAnimations = new Set();
const motionEase = 'cubic-bezier(.22,1,.36,1)';

function animateMedia(node, frames, duration = 380) {
  if (reducedMotion.matches) {
    Object.assign(node.style, frames.at(-1));
    return Promise.resolve();
  }
  const animation = node.animate(frames, { duration, easing: motionEase, fill: 'both' });
  mediaAnimations.add(animation);
  return animation.finished.then(() => {
    try { animation.commitStyles(); } catch { /* The dialog may already be closed. */ }
  }).catch(() => {}).finally(() => {
    animation.cancel();
    mediaAnimations.delete(animation);
  });
}

function cancelMediaMotion() {
  for (const animation of mediaAnimations) {
    try { animation.commitStyles(); } catch { /* A pending image may have been detached. */ }
    animation.cancel();
  }
  mediaAnimations.clear();
}

function currentFrame(node) {
  const style = getComputedStyle(node);
  return { opacity: style.opacity, transform: style.transform };
}

function containedImageRect(image) {
  const box = image.getBoundingClientRect();
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const scale = Math.min(box.width / width, box.height / height);
  return { left: box.left + (box.width - width * scale) / 2,
    top: box.top + (box.height - height * scale) / 2, width: width * scale, height: height * scale };
}

function zoomTransform(from, to) {
  if (!from?.width || !from?.height || !to.width || !to.height) return 'scale(.96)';
  const x = from.left + from.width / 2 - to.left - to.width / 2;
  const y = from.top + from.height / 2 - to.top - to.height / 2;
  return `translate(${x}px, ${y}px) scale(${from.width / to.width}, ${from.height / to.height})`;
}

function disposeMedia(element) {
  if (element.tagName === 'VIDEO') {
    element.pause();
    element.removeAttribute('src');
    element.load();
  }
  element.remove();
}

function clearViewerMedia() {
  mediaRequest += 1;
  cancelMediaMotion();
  unregisterVideo?.();
  unregisterVideo = undefined;
  for (const element of [...stage.children]) disposeMedia(element);
  activeMedia = undefined;
  pendingMedia = undefined;
  stage.setAttribute('aria-busy', 'false');
}

async function showViewerMedia(index, { originRect, force = false } = {}) {
  if (viewerClosing) return;
  const target = clampIndex(index, activeGallery.memory.media.length);
  if (!force && !originRect && target === activeIndex && activeMedia && !pendingMedia) return;
  const direction = target >= activeIndex ? 1 : -1;
  const request = ++mediaRequest;
  activeIndex = target;
  cancelMediaMotion();
  for (const element of [...stage.children]) if (element !== activeMedia) disposeMedia(element);
  pendingMedia = undefined;
  if (activeMedia?.tagName === 'VIDEO') activeMedia.pause();
  unregisterVideo?.();
  unregisterVideo = undefined;
  viewerError.hidden = true;
  stage.setAttribute('aria-busy', 'true');
  const media = activeGallery.memory.media[target];
  const isVideo = media.type === 'video';
  const element = el(isVideo ? 'video' : 'img', 'viewer__media is-pending');
  element.width = media.width;
  element.height = media.height;
  pendingMedia = element;
  const isCurrent = () => request === mediaRequest && viewer.open && !viewerClosing;
  function reportError() {
    if (!isCurrent()) return;
    stage.setAttribute('aria-busy', 'false');
    viewerError.replaceChildren(document.createTextNode(isVideo ? 'Видео не загрузилось. ' : 'Фото не загрузилось. '));
    const retry = el('button', 'viewer__retry', 'Повторить');
    retry.type = 'button';
    retry.addEventListener('click', () => showViewerMedia(target, { force: true }));
    viewerError.append(retry);
    viewerError.hidden = false;
  }
  element.addEventListener('error', reportError);
  if (isVideo) {
    element.controls = true;
    element.playsInline = true;
    element.preload = 'metadata';
    element.poster = media.poster;
    element.setAttribute('aria-label', media.alt);
    element.src = media.src;
  } else {
    element.alt = media.alt;
    element.draggable = false;
    // Show the cached film preview first, then upgrade without an empty frame.
    element.src = media.preview;
    let start;
    element.addEventListener('pointerdown', event => {
      start = event.isPrimary && event.button === 0 ? { x: event.clientX, y: event.clientY } : null;
      if (start) element.setPointerCapture(event.pointerId);
    });
    element.addEventListener('pointercancel', () => { start = null; });
    element.addEventListener('pointerup', event => {
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) showViewerMedia(activeIndex + (dx < 0 ? 1 : -1));
      start = null;
    });
  }
  stage.append(element);
  viewerCounter.textContent = `${String(target + 1).padStart(2, '0')} / ${activeGallery.memory.media.length}`;
  previousViewer.disabled = target === 0;
  nextViewer.disabled = target === activeGallery.memory.media.length - 1;
  if (!isVideo) {
    try { await element.decode(); }
    catch { reportError(); if (pendingMedia === element) pendingMedia = undefined; disposeMedia(element); return; }
  }
  if (!isCurrent()) { disposeMedia(element); return; }
  const previous = activeMedia;
  activeMedia = element;
  pendingMedia = undefined;
  element.classList.remove('is-pending');
  stage.setAttribute('aria-busy', 'false');
  if (isVideo) unregisterVideo = coordinator.register(element);
  if (previous) {
    previous.inert = true;
    previous.setAttribute('aria-hidden', 'true');
    animateMedia(previous, [currentFrame(previous), { opacity: 0, transform: `translateX(${-direction * 28}px) scale(.985)` }], 340)
      .then(() => { if (previous !== activeMedia) disposeMedia(previous); });
  }
  const initialTransform = originRect && !isVideo
    ? zoomTransform(originRect, element.getBoundingClientRect())
    : `translateX(${direction * 36}px) scale(.985)`;
  animateMedia(element, [{ opacity: originRect ? .25 : 0, transform: initialTransform },
    { opacity: 1, transform: 'translate(0, 0) scale(1)' }], originRect ? 500 : 380);
  if (!isVideo && media.src !== media.preview) {
    const full = new Image();
    full.src = media.src;
    full.decode().then(() => {
      if (isCurrent() && activeMedia === element) element.src = media.src;
    }).catch(reportError);
  }
}

function openViewer(gallery, index, trigger) {
  if (viewer.open || viewerClosing) return;
  activeGallery = gallery;
  openedIndex = index;
  returnFocus = trigger;
  const sourceImage = trigger.querySelector('img');
  const originRect = sourceImage ? containedImageRect(sourceImage) : undefined;
  previousOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  viewer.style.opacity = '';
  viewer.style.setProperty('--ink', gallery.memory.theme.ink);
  viewer.showModal();
  showViewerMedia(index, { originRect });
}

async function requestViewerClose() {
  if (!viewer.open || viewerClosing) return;
  viewerClosing = true;
  mediaRequest += 1;
  cancelMediaMotion();
  if (!reducedMotion.matches) {
    const closing = [animateMedia(viewer, [{ opacity: getComputedStyle(viewer).opacity }, { opacity: 0 }], 360)];
    if (activeMedia) {
      let target = 'translateY(18px) scale(.96)';
      const sourceImage = returnFocus?.querySelector('img');
      if (activeMedia.tagName === 'IMG' && activeIndex === openedIndex && sourceImage) {
        const source = containedImageRect(sourceImage);
        if (source.top + source.height > 0 && source.top < innerHeight) target = zoomTransform(source, activeMedia.getBoundingClientRect());
      }
      closing.push(animateMedia(activeMedia, [currentFrame(activeMedia), { opacity: 0, transform: target }], 360));
    }
    await Promise.all(closing);
  }
  if (viewer.open) viewer.close();
}
closeViewer.addEventListener('click', requestViewerClose);
viewer.addEventListener('cancel', event => { event.preventDefault(); requestViewerClose(); });
viewer.addEventListener('close', () => {
  clearViewerMedia();
  document.documentElement.style.overflow = previousOverflow;
  returnFocus?.focus({ preventScroll: true });
  viewerClosing = false;
});
previousViewer.addEventListener('click', () => showViewerMedia(activeIndex - 1));
nextViewer.addEventListener('click', () => showViewerMedia(activeIndex + 1));
viewer.addEventListener('keydown', event => {
  if (event.target.matches('video, input')) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showViewerMedia(activeIndex + (event.key === 'ArrowLeft' ? -1 : 1));
  }
});

function makeMemory(memory, nextMemory) {
  const section = el('section', 'memory');
  section.id = memory.id;
  section.setAttribute('aria-label', `Воспоминание: ${memory.narrator}`);
  for (const token of ['paper', 'ink', 'accent', 'film']) section.style.setProperty(`--${token}`, memory.theme[token]);
  for (const [token, value] of Object.entries(memory.theme.styles ?? {})) section.style.setProperty(token, value);
  section.style.setProperty('--next-paper', nextMemory?.theme.paper ?? memory.theme.paper);
  section.style.setProperty('--scene-image', `url("${memory.theme.background}")`);
  section.style.setProperty('--scene-mobile-image', `url("${memory.theme.backgroundMobile ?? memory.theme.background}")`);
  section.style.setProperty('--scene-tablet-image', `url("${memory.theme.backgroundTablet ?? memory.theme.background}")`);
  section.style.setProperty('--scene-position', memory.theme.backgroundPosition);
  const scene = el('div', 'memory__scene');
  scene.setAttribute('aria-hidden', 'true');
  const intro = el('div', 'memory__intro');
  const title = el('h2', 'memory__title', tidyRussianText(memory.title ?? memory.label));
  const summary = el('p', 'memory__summary', tidyRussianText(memory.summary.join(' ')));
  intro.append(title, summary);

  const film = el('div', 'film');
  const composition = el('div', 'film-scene');
  const floatingFilm = el('div', 'film-scene__float');
  const rail = el('div', 'film__rail');
  rail.setAttribute('role', 'group');
  rail.setAttribute('aria-label', `Фотографии и видео: ${memory.label}`);
  const gallery = { memory, rail };

  memory.media.forEach((media, index) => {
    const frame = el('button', 'film__frame');
    frame.type = 'button';
    frame.setAttribute('aria-label', `${media.type === 'video' ? 'Открыть видео' : 'Открыть фото'} ${index + 1} из ${memory.media.length}: ${media.alt}`);
    const image = el('img', 'film__image');
    image.src = media.preview;
    image.alt = media.alt;
    image.width = media.width;
    image.height = media.height;
    image.loading = index < 2 ? 'eager' : 'lazy';
    image.decoding = 'async';
    image.draggable = false;
    if (index === 0) image.fetchPriority = 'high';
    const failure = el('span', 'film__failure', 'Загрузить кадр ещё раз');
    failure.hidden = true;
    image.addEventListener('error', () => {
      frame.dataset.failed = 'true';
      image.hidden = true;
      failure.hidden = false;
    });
    image.addEventListener('load', () => {
      delete frame.dataset.failed;
      image.hidden = false;
      failure.hidden = true;
    });
    frame.append(image, failure);
    if (memory.numberFrames) {
      const sequence = el('span', 'film__sequence', String(index + 1).padStart(2, '0'));
      sequence.setAttribute('aria-hidden', 'true');
      frame.append(sequence);
    }
    if (media.type === 'video') {
      const badge = el('span', 'film__video');
      badge.innerHTML = icon('play');
      badge.append(formatTime(media.duration));
      frame.append(badge);
    }
    frame.addEventListener('click', () => {
      if (frame.dataset.failed === 'true') {
        image.src = `${media.preview}?retry=${Date.now()}`;
        return;
      }
      openViewer(gallery, index, frame);
    });
    rail.append(frame);
  });
  film.append(rail);
  floatingFilm.append(film);
  if (memory.theme.reel) {
    const tail = el('span', 'film-scene__tail');
    const reel = el('img', 'film-scene__cassette');
    tail.setAttribute('aria-hidden', 'true');
    reel.src = memory.theme.reel;
    reel.alt = '';
    reel.setAttribute('aria-hidden', 'true');
    reel.width = 1536;
    reel.height = 1024;
    reel.decoding = 'async';
    reel.loading = 'lazy';
    floatingFilm.append(tail, reel);
  }
  composition.append(floatingFilm);
  section.append(scene, intro, composition, makePlayer(memory));
  if (memory.inscription) {
    const inscription = el('img', 'memory__inscription');
    inscription.src = memory.inscription.src;
    inscription.alt = memory.inscription.alt;
    inscription.width = memory.inscription.width;
    inscription.height = memory.inscription.height;
    inscription.loading = 'lazy';
    inscription.decoding = 'async';
    section.append(inscription);
  }
  galleries.push(gallery);
  return section;
}

const birthdayHero = createBirthdayHero(reducedMotion);
document.querySelector('#memories').replaceChildren(birthdayHero, ...memories.map((memory, index) => makeMemory(memory, memories[index + 1])));
const revealObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    entry.target.classList.toggle('is-in-view', entry.isIntersecting);
    if (entry.isIntersecting) entry.target.classList.add('has-entered');
  }
}, { threshold: 0.08 });
for (const section of document.querySelectorAll('.birthday-hero, .memory')) revealObserver.observe(section);
