import type { Locale } from '@/i18n/config';

export type BlogSlugDefinition = {
  id: string;
  fallbackSlug: string;
  slugs: Partial<Record<Locale, string>>;
};

//TODO: ADD NEW SLUGS IF NEW LANG ADDED
export const BLOG_SLUGS: BlogSlugDefinition[] = [
  {
    id: 'fuerteventura-latnivalok-autoval',
    fallbackSlug: 'fuerteventura-latnivalok-autoval',
    slugs: {
      hu: 'fuerteventura-latnivalok-autoval',
      es: 'que-ver-en-fuerteventura-en-coche',
    },
  },
];

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
