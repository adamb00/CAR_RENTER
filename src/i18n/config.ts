// export const LOCALES = [
//   'hu',
//   'en',
//   'de',
//   'ro',
//   'sk',
//   'cz',
//   'fr',
//   'se',
//   'no',
//   'dk',
//   'es',
//   'it',
//   'pl',
// ] as const;
export const LOCALES = ['hu', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'hu';

export const LANG_BY_COUNTRY: Record<string, Locale> = {
  HU: 'hu',
  ES: 'es',
};

// // Ország→locale fallback (bővíthető)
// export const LANG_BY_COUNTRY: Record<string, Locale> = {
//   HU: 'hu',
//   RO: 'ro',
//   SK: 'sk',
//   CZ: 'cz',
//   DE: 'de',
//   AT: 'de',
//   CH: 'de',
//   FR: 'fr',
//   BE: 'fr',
//   LU: 'fr',
//   SE: 'se',
//   NO: 'no',
//   DK: 'dk',
//   ES: 'es',
//   IT: 'it',
//   PL: 'pl',
//   GB: 'en',
//   IE: 'en',
//   US: 'en',
//   CA: 'en',
//   AU: 'en',
//   NZ: 'en',
// };

// Accept-Language → a te locales-edre normalizálva
export function matchLocaleFromAccept(accept: string): Locale | null {
  if (!accept) return null;
  const tags = accept
    .split(',')
    .map((p) => p.split(';')[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const tag of tags) {
    const [primary] = tag.split('-'); // pl. en-US → en

    // nyelv→saját kód normalizálás
    const mapped =
      primary === 'cs'
        ? 'cz'
        : primary === 'sv'
        ? 'se'
        : primary === 'da'
        ? 'dk'
        : primary === 'nb' || primary === 'nn' || primary === 'no'
        ? 'no'
        : primary;

    if (LOCALES.includes(mapped as Locale)) return mapped as Locale;

    // másodlagos fallback angolra
    if (primary.startsWith('es')) return 'es';
  }
  return null;
}
