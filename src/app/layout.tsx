import '@/app/_style/globals.css';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { DEFAULT_LOCALE, LOCALES } from '@/i18n/config';
import { getSiteUrl, resolveLocale } from '@/lib/seo';
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ReactNode, Suspense } from 'react';

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
    other: {
      google: 'notranslate',
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
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID ?? process.env.GTM_ID ?? '';

  const gaMeasurementId =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ??
    process.env.GA_MEASUREMENT_ID ??
    '';
  const hasGtm = Boolean(gtmId);
  const hasGa = Boolean(gaMeasurementId);

  return (
    <html
      lang={DEFAULT_LOCALE}
      translate='no'
      className='notranslate'
      suppressHydrationWarning
    >
      <Analytics />
      {hasGtm ? <GoogleTagManager gtmId={gtmId} /> : null}
      {hasGa ? <GoogleAnalytics gaId={gaMeasurementId} /> : null}
      <body className='antialiased'>
        {hasGtm ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height='0'
              width='0'
              style={{ display: 'none', visibility: 'hidden' }}
            ></iframe>
          </noscript>
        ) : null}
        <Suspense fallback={null}>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </Suspense>
      </body>
    </html>
  );
}
