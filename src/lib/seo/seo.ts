import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/i18n/config';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zodiacsrentacar.com';

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(
    /\/$/,
    ''
  );
}

export function resolveLocale(locale?: string): Locale {
  if (!locale) return DEFAULT_LOCALE;
  return LOCALES.includes(locale as Locale)
    ? (locale as Locale)
    : DEFAULT_LOCALE;
}

type PageKey = string;

export async function buildPageMetadata(options: {
  locale: Locale;
  pageKey: PageKey;
  path?: string;
  imagePath?: string;
}): Promise<Metadata> {
  const { locale, pageKey, path = '', imagePath = '/logo_white.png' } = options;
  const t = await getTranslations({ locale, namespace: 'Pages' });
  const title = t(`${pageKey}.title`);
  const description = t(`${pageKey}.description`);
  let imageAlt = title;
  let keywords: string[] | undefined;
  try {
    imageAlt = t(`${pageKey}.ogImageAlt`);
  } catch {
    imageAlt = title;
  }
  const keywordsKey = `${pageKey}.keywords`;
  const hasMethod = (t as unknown as { has?: (key: string) => boolean }).has;
  let rawKeywords: unknown;
  if (typeof hasMethod === 'function') {
    if (hasMethod(keywordsKey)) {
      try {
        rawKeywords = t.raw(keywordsKey);
      } catch (error) {
        const nextIntlError = error as { code?: string };
        if (!nextIntlError?.code || nextIntlError.code !== 'MISSING_MESSAGE') {
          throw error;
        }
      }
    }
  } else {
    try {
      rawKeywords = t.raw(keywordsKey);
    } catch (error) {
      const nextIntlError = error as { code?: string };
      if (!nextIntlError?.code || nextIntlError.code !== 'MISSING_MESSAGE') {
        throw error;
      }
      rawKeywords = undefined;
    }
  }

  if (Array.isArray(rawKeywords)) {
    keywords = rawKeywords as string[];
  } else if (typeof rawKeywords === 'string') {
    keywords = rawKeywords
      .split(',')
      .map((kw) => kw.trim())
      .filter(Boolean);
  }

  const siteUrl = getSiteUrl();
  const normalizedPath =
    !path || path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  const url = `${siteUrl}/${locale}${normalizedPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, `${siteUrl}/${loc}${normalizedPath}`])
      ),
    },
    openGraph: {
      type: 'website',
      locale,
      url,
      title,
      description,
      images: [
        {
          url: `${siteUrl}${imagePath}`,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}${imagePath}`],
    },
    keywords,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

type BuildMetadataFromContentOptions = {
  locale: Locale;
  path?: string;
  title: string;
  description: string;
  imagePath?: string;
  imageAlt?: string;
  keywords?: string[];
};

export function buildMetadataFromContent({
  locale,
  path = '',
  title,
  description,
  imagePath = '/logo_white.png',
  imageAlt,
  keywords,
}: BuildMetadataFromContentOptions): Metadata {
  const siteUrl = getSiteUrl();
  const normalizedPath =
    !path || path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  const url = `${siteUrl}/${locale}${normalizedPath}`;
  const finalImageAlt = imageAlt ?? title;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, `${siteUrl}/${loc}${normalizedPath}`])
      ),
    },
    openGraph: {
      type: 'website',
      locale,
      url,
      title,
      description,
      images: [
        {
          url: `${siteUrl}${imagePath}`,
          width: 1200,
          height: 630,
          alt: finalImageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}${imagePath}`],
    },
    keywords,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
