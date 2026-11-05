const NBSP = '\u00a0';

// Keep short Russian words with the following word and avoid a lone final word.
export function tidyRussianText(value) {
  let text = String(value).replace(/[ \t]+/g, ' ').trim();
  text = text.replace(/(\S+) +(\S+)$/u, `$1${NBSP}$2`);
  text = text.replace(/([А-ЯЁа-яё]+) +(\d{1,4}[.,!?]?)(?=\s|$)/gu, `$1${NBSP}$2`);
  const shortWord = /(^|[\s«„("])([А-ЯЁа-яё]{1,2}|без|для|над|под|при|про|или|что|как) +(?=\S)/giu;
  for (let i = 0; i < 3; i += 1) text = text.replace(shortWord, `$1$2${NBSP}`);
  return text;
}
