export function formatTime(seconds) {
  const whole = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export function clampIndex(index, length) {
  return Math.max(0, Math.min(Math.max(0, length - 1), index));
}

export class PlaybackCoordinator {
  #media = new Set();

  register(media) {
    this.#media.add(media);
    const onPlay = () => {
      for (const other of this.#media) {
        if (other !== media && !other.paused) other.pause();
      }
    };
    media.addEventListener('play', onPlay);
    return () => {
      media.removeEventListener('play', onPlay);
      this.#media.delete(media);
    };
  }
}
