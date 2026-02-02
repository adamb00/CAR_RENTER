import { LOCALES } from '@/i18n/config';
import type { Locale } from '@/i18n/config';

export type BlogSlugDefinition = {
  id: string;
  fallbackSlug: string;
  slugs: Partial<Record<Locale, string>>;
  locales?: Locale[];
};

const BLOG_LOCALE_SLUGS: Record<Locale, string[]> = {
  hu: [
    'fuerteventura-latnivalok-autoval-3-kihagyhatatlan-hely',
    'figyelem-veszelyes-visszatero-aramlatok-fuerteventuran',
    'fuerteventura-legszebb-strandjai-berelt-autoval',
  ],
  en: [
    'fuerteventura-sights-by-car-3-must-see-spots',
    'warning-dangerous-rip-currents-in-fuerteventura',
    'fuerteventura-best-beaches-by-rental-car',
  ],
  de: [
    'fuerteventuras-sehenswurdigkeiten-mit-dem-auto-3-orte-die-du-nicht-verpassen-solltest',
    'achtung-gefahrliche-ruckstromungen-auf-fuerteventura',
    'fuerteventura-schoenste-straende-mit-mietwagen',
  ],
  ro: [
    'obiective-de-vizitat-cu-masina-in-fuerteventura-3-locuri-de-neratat',
    'atentie-curenturi-de-revenire-periculoase-in-fuerteventura',
    'cele-mai-frumoase-plaje-din-fuerteventura-cu-masina-inchiriata',
  ],
  fr: [
    'fuerteventura-en-voiture-3-lieux-incontournables',
    'attention-courants-de-retour-dangereux-a-fuerteventura',
    'les-plus-belles-plages-de-fuerteventura-en-voiture-de-location',
  ],
  es: [
    'que-ver-en-fuerteventura-en-coche-3-paradas-imprescindibles',
    'atencion-corrientes-de-retorno-peligrosas-en-fuerteventura',
    'las-mejores-playas-de-fuerteventura-en-coche-de-alquiler',
  ],
  it: [
    'cosa-vedere-a-fuerteventura-in-auto-3-luoghi-imperdibili',
    'attenzione-correnti-di-risacca-pericolose-a-fuerteventura',
    'le-piu-belle-spiagge-di-fuerteventura-in-auto-a-noleggio',
  ],
  sk: [
    'fuerteventura-zaujimavosti-autom-3-miesta-ktore-netreba-vynechat',
    'pozor-nebezpecne-spatne-prudy-na-fuerteventure',
    'najkrajsie-plaze-fuerteventury-autom-z-pozicovne',
  ],
  cz: [
    'fuerteventura-autem-3-mista-ktera-bys-nemel-vynechat',
    'pozor-nebezpecne-zpetne-proudy-na-fuerteventure',
    'nejkrasnejsi-plaze-fuerteventury-autem-z-pujcovny',
  ],
  se: [
    'sevardheter-pa-fuerteventura-med-bil-3-platser-du-inte-far-missa',
    'varning-farliga-aterstrommar-pa-fuerteventura',
    'fuerteventuras-vackraste-strander-med-hyrbil',
  ],
  no: [
    'severdigheter-pa-fuerteventura-med-bil-3-steder-du-ikke-ma-ga-glipp-av',
    'obs-farlige-rip-currents-pa-fuerteventura',
    'fuerteventuras-fineste-strender-med-leiebil',
  ],
  dk: [
    'sevaerdigheder-pa-fuerteventura-i-bil-3-steder-du-ikke-ma-ga-glip-af',
    'advarsel-farlige-rip-currents-pa-fuerteventura',
    'fuerteventuras-smukkeste-strande-i-lejebil',
  ],
  pl: [
    'fuerteventura-samochodem-3-miejsca-ktorych-nie-mozesz-pominac',
    'uwaga-niebezpieczne-prady-wsteczne-na-fuerteventurze',
    'najpiekniejsze-plaze-fuerteventury-samochodem-z-wypozyczalni',
  ],
};

const buildSlugsForPost = (index: number): Partial<Record<Locale, string>> => {
  return LOCALES.reduce<Partial<Record<Locale, string>>>((acc, locale) => {
    const localeSlugs = BLOG_LOCALE_SLUGS[locale];
    const slug = localeSlugs?.[index];
    if (slug) {
      acc[locale] = slug;
    }
    return acc;
  }, {});
};

const BLOG_SLUG_DEFINITIONS: BlogSlugDefinition[] = [
  {
    id: 'fuerteventura-latnivalok-autoval',
    fallbackSlug: 'fuerteventura-latnivalok-autoval',
    slugs: buildSlugsForPost(0),
  },
  {
    id: 'fuerteventura-visszatero-aramlat-biztonsagos-furdozes',
    fallbackSlug: 'fuerteventura-visszatero-aramlat-biztonsagos-furdozes',
    slugs: buildSlugsForPost(1),
  },
  {
    id: 'fuerteventura-legszebb-strandjai-berelt-autoval',
    fallbackSlug: 'fuerteventura-legszebb-strandjai-berelt-autoval',
    slugs: buildSlugsForPost(2),
  },
];

export const getLocalesForDefinition = (
  definition: BlogSlugDefinition
): Locale[] =>
  definition.locales && definition.locales.length > 0
    ? definition.locales
    : LOCALES;

export const isLocaleSupportedForDefinition = (
  definition: BlogSlugDefinition,
  locale: Locale
) => getLocalesForDefinition(definition).includes(locale);

const ensureLocaleSlugs = (
  definition: BlogSlugDefinition
): BlogSlugDefinition => {
  const baseSlugs = definition.slugs ?? {};
  const locales = getLocalesForDefinition(definition);
  const slugs = locales.reduce<Partial<Record<Locale, string>>>(
    (acc, locale) => {
      acc[locale] = baseSlugs[locale] ?? definition.fallbackSlug;
      return acc;
    },
    {}
  );
  return {
    ...definition,
    slugs,
  };
};

export const BLOG_SLUGS: BlogSlugDefinition[] =
  BLOG_SLUG_DEFINITIONS.map(ensureLocaleSlugs);

const SLUG_TO_DEFINITION = BLOG_SLUGS.reduce<
  Record<string, BlogSlugDefinition>
>((acc, definition) => {
  const variants = new Set<string>([
    definition.fallbackSlug,
    ...Object.values(definition.slugs),
  ]);
  variants.forEach((variant) => {
    if (variant) acc[variant] = definition;
  });
  return acc;
}, {});

export const getSlugDefinitionBySlug = (slug: string) =>
  SLUG_TO_DEFINITION[slug];

export const getSlugForLocale = (
  definition: BlogSlugDefinition,
  locale: Locale
) => definition.slugs[locale] ?? definition.fallbackSlug;

export const resolveLocalizedSlug = (slug: string, locale: Locale) => {
  const definition = getSlugDefinitionBySlug(slug);
  if (!definition) return slug;
  return getSlugForLocale(definition, locale);
};
