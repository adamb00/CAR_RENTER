import { Locale } from '@/i18n/config';
import { MessagesShape } from '../navigation/navigation.types';

type ResolvedLink = {
  href: string;
  label: string;
};

export const resolveHref = (href: string, locale: Locale): string =>
  href.includes('{locale}') ? href.replace('{locale}', locale) : href;

export const isExternal = (href: string) => href.startsWith('http');

export const toResolvedLink = (
  link: ResolvedLink,
  locale: Locale
): ResolvedLink => ({
  ...link,
  href: resolveHref(link.href, locale),
});

export const fallbackTitleFromSlug = (slug: string) =>
  slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const flattenStrings = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenStrings(item));
  }
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((item) =>
      flattenStrings(item)
    );
  }
  return [];
};

export const getValueByPath = (obj: MessagesShape | null, path: string) => {
  if (!obj) return undefined;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as MessagesShape)[key];
    }
    return undefined;
  }, obj);
};
