import { baliMedia, baliAudio } from './bali-media.js';
import { europeMedia, europeAudio } from './europe-media.js';

// Add another object to reuse the same gallery, viewer and audio player.
export const memories = [
  {
    id: 'bali',
    label: 'Бали',
    title: 'Наш Бали',
    narrator: 'Саня',
    audioLabel: 'История Сани',
    summary: [
      'Океан, кокосы под дождём и наши балийские приключения.',
      'За эту поездку мы стали почти родными.',
    ],
    theme: {
      background: 'assets/art/bali-beach-desktop-lower-v4.jpg',
      backgroundTablet: 'assets/art/bali-beach-tablet-lower-v4.jpg',
      backgroundMobile: 'assets/art/bali-beach-mobile-v4.jpg',
      backgroundPosition: '50% 50%',
      paper: '#e9c89f',
      ink: '#253c31',
      accent: '#a77742',
      film: '#302621',
      reel: 'assets/art/film-cassette-web-v4.png',
    },
    media: baliMedia,
    audio: baliAudio,
  },
  {
    id: 'europe',
    label: 'Европа',
    title: 'Вместе по Европе',
    narrator: 'Дима',
    audioLabel: 'История Димы',
    inscription: {
      src: 'assets/art/europe-chalk-sanya-web-v1.png',
      alt: 'Саня лох — надпись мелом на мостовой',
      width: 1200,
      height: 400,
    },
    summary: [
      'Аттракционы, итальянские озёра и сладости тайком от родителей.',
      'Самое важное — мы были вместе.',
    ],
    theme: {
      background: 'assets/art/europe-square-desktop-v1.jpg',
      backgroundMobile: 'assets/art/europe-square-mobile-v1.jpg',
      backgroundPosition: '50% 50%',
      paper: '#e6e3d5',
      ink: '#293f38',
      accent: '#567760',
      film: '#292d25',
      reel: 'assets/art/europe-cassette-web-v1.png',
      styles: {
        '--film-angle': '3deg',
        '--film-depth': '3deg',
        '--cassette-angle': '-8deg',
        '--intro-surface': '#fffff1cc',
        '--player-ink': '#3a5e48',
        '--player-border': '#6a8464',
        '--player-face': '#f4f8eadd',
        '--player-hover': '#f5faed',
        '--player-playing': '#f0f6e8ee',
        '--wave-rest': '#6f816088',
        '--wave-played': '#3b6146',
      },
    },
    media: europeMedia,
    audio: europeAudio,
  },
];
