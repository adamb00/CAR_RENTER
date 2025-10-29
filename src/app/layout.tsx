import '@/app/_style/globals.css';
import { DEFAULT_LOCALE, LOCALES } from '@/i18n/config';
import { getSiteUrl, resolveLocale } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

const LANGUAGE_ALTERNATES = Object.fromEntries(
  LOCALES.map((locale) => [locale, `/${locale}`])
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({ locale: resolvedLocale, namespace: 'SEO' });
  const canonicalPath = `/${resolvedLocale}`;
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t('defaultTitle'),
      template: t('titleTemplate'),
    },
    description: t('siteDescription'),
    alternates: {
      canonical: canonicalPath,
      languages: {
        'x-default': `/${DEFAULT_LOCALE}`,
        ...LANGUAGE_ALTERNATES,
      },
    },
    openGraph: {
      type: 'website',
      locale: resolvedLocale,
      alternateLocale: LOCALES.filter((loc) => loc !== resolvedLocale),
      url: `${siteUrl}${canonicalPath}`,
      title: t('ogTitle'),
      description: t('ogDescription'),
      siteName: t('brand'),
      images: [
        {
          url: `${siteUrl}/header_image.webp`,
          width: 1920,
          height: 1080,
          alt: t('ogImageAlt'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('twitterTitle'),
      description: t('twitterDescription'),
      images: [`${siteUrl}/header_image.webp`],
    },
    appleWebApp: {
      title: t('brand'),
      statusBarStyle: 'default',
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<Record<string, never>>;
}) {
  await params;
  return (
    <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <body className='antialiased'>{children}</body>
    </html>
  );
}
