export const LOCALES = [
  'hu',
  'en',
  'de',
  'ro',
  'sk',
  'cz',
  'fr',
  'se',
  'no',
  'dk',
  'es',
  'it',
  'pl',
] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'hu';
