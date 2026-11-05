import { tidyRussianText } from './typography.js';

const candlePoints = [
  { x: 33.65, y: 13.05, order: 0 },
  { x: 50.55, y: 11.3, order: 2 },
  { x: 67.35, y: 13.9, order: 4 },
  { x: 41.7, y: 24.05, order: 1 },
  { x: 59.4, y: 24.6, order: 3 },
];

// Fifteen small plates surround the cake; the middle stays clear for the greeting.
const plates = [
  [0, 5, 43, 158, -14, -3, 39, 104],
  [5, 18, 58, 134, 12, 9, 53, 85],
  [4, 2, 72, 150, -12, -5, 67, 98],
  [2, 20, 82, 128, 16, 12, 82, 83],
  [8, 6, 96, 164, -18, -2, 96, 108],
  [1, 95, 42, 148, 12, 104, 41, 98],
  [6, 82, 57, 142, -11, 92, 54, 87],
  [7, 98, 72, 152, 13, 105, 69, 101],
  [3, 80, 82, 132, -16, 90, 83, 86],
  [4, 96, 97, 160, 14, 103, 97, 106],
  [7, 29, 95, 138, -8, 23, 95, 83],
  [2, 42, 93, 120, 13, 40, 92, 76],
  [5, 57, 97, 136, -9, 57, 95, 81],
  [0, 71, 95, 134, 17, 74, 93, 84],
  [8, 50, 82, 116, -9, 51, 88, 72],
];

export function candleStrength(progress, order) {
  const threshold = 0.3 + order * 0.16;
  return Math.max(0, Math.min(1, (threshold - Math.max(0, progress)) / 0.14));
}

export function birthdayScrollProgress(scrollY, scrollDistance, startOffset = 0) {
  return Math.max(0, Math.min(1, (scrollY - startOffset) / Math.max(1, scrollDistance)));
}

export function createBirthdayHero(reducedMotion) {
  const hero = document.createElement('header');
  hero.className = 'birthday-hero';
  hero.setAttribute('aria-labelledby', 'birthday-title');
  hero.innerHTML = `
    <div class="birthday-hero__stage">
    <div class="birthday-hero__table" aria-hidden="true"></div>
    <div class="birthday-hero__plates" aria-hidden="true"></div>
    <div class="birthday-hero__copy">
      <h1 id="birthday-title">С&nbsp;днём рождения,<br><span>Оля!</span></h1>
      <p></p>
    </div>
    <div class="birthday-hero__cake">
      <img class="birthday-hero__cake-image" src="assets/art/birthday-cake-mobile-v2.png" srcset="assets/art/birthday-cake-mobile-v2.png 720w, assets/art/birthday-cake-v2.png 1254w" sizes="(max-width: 600px) 87vw, (max-width: 900px) 500px, 550px" width="1254" height="1254" alt="Праздничный торт на белой тарелке с пятью золотыми свечами" fetchpriority="high">
      <div class="birthday-hero__candles" aria-hidden="true"></div>
    </div>
    </div>`;
  const stage = hero.querySelector('.birthday-hero__stage');
  hero.querySelector('.birthday-hero__copy p').textContent = tidyRussianText('Тебе 25. Мы собрали моменты, которые хочется пережить ещё раз.');

  const plateContainer = hero.querySelector('.birthday-hero__plates');
  plates.forEach(([sprite, x, y, size, rotation, mobileX, mobileY, mobileSize], index) => {
    const plate = document.createElement('span');
    plate.className = 'party-plate';
    const values = { '--plate-x': `${x}%`, '--plate-y': `${y}%`, '--plate-size': `${size}px`,
      '--plate-rotate': `${rotation}deg`, '--plate-mobile-x': `${mobileX}%`, '--plate-mobile-y': `${mobileY}%`,
      '--plate-mobile-size': `${mobileSize}px`, '--plate-delay': `${-index * 0.47}s`,
      '--sprite-x': `${(sprite % 3) * 50}%`, '--sprite-y': `${Math.floor(sprite / 3) * 50}%` };
    for (const [key, value] of Object.entries(values)) plate.style.setProperty(key, value);
    plateContainer.append(plate);
  });

  const candles = candlePoints.map((point, index) => {
    const candle = document.createElement('span');
    candle.className = 'candle';
    candle.style.setProperty('--candle-x', `${point.x}%`);
    candle.style.setProperty('--candle-y', `${point.y}%`);
    candle.style.setProperty('--flicker-delay', `${-index * 0.21}s`);
    candle.innerHTML = '<span class="candle__fire"><span class="candle__flame"></span></span><span class="candle__smoke"></span>';
    hero.querySelector('.birthday-hero__candles').append(candle);
    return { element: candle, order: point.order };
  });

  let pending = false;
  function update() {
    pending = false;
    const scrollDistance = hero.offsetHeight - stage.offsetHeight;
    const stageOffset = Math.max(0, -Number.parseFloat(getComputedStyle(stage).top));
    const progress = birthdayScrollProgress(window.scrollY, scrollDistance, stageOffset);
    hero.style.setProperty('--birthday-progress', progress.toFixed(4));
    let allOut = true;
    for (const { element, order } of candles) {
      let strength = candleStrength(progress, order);
      if (reducedMotion.matches) strength = strength < 0.5 ? 0 : 1;
      element.style.setProperty('--flame-strength', strength.toFixed(3));
      element.classList.toggle('is-out', strength === 0);
      if (strength > 0) allOut = false;
    }
    hero.dataset.candlesOut = String(allOut);
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  requestAnimationFrame(update);
  return hero;
}
