import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getCarById, getCars } from '@/lib/cars';
import { LOCALES } from '@/i18n/config';
import { getSiteUrl, resolveLocale } from '@/lib/seo';
import { NoSSR } from '@/components/NoSSR';
import RentPageClient from './client-page';

type PageParams = {
  locale: string;
  id: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const resolvedLocale = resolveLocale(locale);
  const car = await getCarById(id);

  if (!car) {
    return {};
  }

  const t = await getTranslations({ locale: resolvedLocale, namespace: 'CarRent' });
  const title = t('meta.title', { carName: car.name });
  const description = t('meta.description', { carName: car.name });
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/${resolvedLocale}/cars/${car.id}/rent`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [
          loc,
          `${siteUrl}/${loc}/cars/${car.id}/rent`,
        ])
      ),
    },
    openGraph: {
      type: 'website',
      locale: resolvedLocale,
      url,
      title,
      description,
      images: [
        {
          url: `${siteUrl}${car.image}`,
          width: 1200,
          height: 630,
          alt: t('meta.imageAlt', { carName: car.name }),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}${car.image}`],
    },
  };
}

export async function generateStaticParams(): Promise<PageParams[]> {
  const cars = await getCars();
  return LOCALES.flatMap((locale) =>
    cars.map((car) => ({
      locale,
      id: car.id,
    }))
  );
}

export default async function RentPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale, id } = await params;
  const resolvedLocale = resolveLocale(locale);
  const car = await getCarById(id);

  if (!car) {
    notFound();
  }

  return (
    <NoSSR>
      <RentPageClient
        locale={resolvedLocale}
        car={{ id: car.id, seats: car.seats, colors: car.colors }}
      />
    </NoSSR>
  );
}
