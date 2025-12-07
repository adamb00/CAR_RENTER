import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LOCALES, type Locale } from '@/i18n/config';
import { getSiteUrl } from '@/lib/seo/seo';

type CarMetadataCar = {
  id: string;
  name: string;
  image: string;
};

type BuildCarMetadataOptions = {
  locale: Locale;
  namespace: string;
  car: CarMetadataCar;
  pathSuffix?: string;
};

export async function buildCarMetadata({
  locale,
  namespace,
  car,
  pathSuffix = '',
}: BuildCarMetadataOptions): Promise<Metadata> {
  const t = await getTranslations({
    locale,
    namespace,
  });
  const title = t('meta.title', { carName: car.name });
  const description = t('meta.description', { carName: car.name });
  const imageAlt = t('meta.imageAlt', { carName: car.name });
  const siteUrl = getSiteUrl();
  const normalizedSuffix =
    pathSuffix && !pathSuffix.startsWith('/') ? `/${pathSuffix}` : pathSuffix;
  const path = `/cars/${car.id}${normalizedSuffix}`;
  const url = `${siteUrl}/${locale}${path}`;
  const imageUrl = `${siteUrl}${car.image}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, `${siteUrl}/${loc}${path}`])
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
          url: imageUrl,
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
      images: [imageUrl],
    },
  };
}
