import type { Locale } from '@/i18n/config';

const DATE_LOCALE_BY_LOCALE: Record<Locale, string> = {
  hu: 'hu-HU',
  en: 'en-US',
  de: 'de-DE',
  ro: 'ro-RO',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  sk: 'sk-SK',
  cz: 'cs-CZ',
  se: 'sv-SE',
  no: 'nb-NO',
  dk: 'da-DK',
  pl: 'pl-PL',
};

export const DATE_LOCALE_MAP: Record<string, string> = DATE_LOCALE_BY_LOCALE;
