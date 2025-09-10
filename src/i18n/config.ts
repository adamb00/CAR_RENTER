export const LOCALES = ['hu', 'en', 'de', 'ro', 'sk', 'cz', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'hu';
