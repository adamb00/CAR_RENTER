import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getCarById, getCars } from '@/lib/cars';
import { LOCALES } from '@/i18n/config';
import { getSiteUrl, resolveLocale } from '@/lib/seo';
import { NoSSR } from '@/components/NoSSR';
import RentPageClient from './client-page';
import { getContactQuoteById } from '@/lib/contactQuotes';
import { prisma } from '@/lib/prisma';
import type { RentFormValues } from '@/schemas/RentSchema';

type PageParams = {
  locale: string;
  id: string;
};
type ManageSection = 'contact' | 'travel' | 'invoice';
type ManageMode = 'modify';

const RENT_ID_REGEX = /^[0-9a-fA-F-]{36}$/;

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

  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: 'CarRent',
  });
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
        LOCALES.map((loc) => [loc, `${siteUrl}/${loc}/cars/${car.id}/rent`])
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
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale, id }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const resolvedLocale = resolveLocale(locale);
  const quoteIdRaw = resolvedSearchParams?.quoteId;
  const quoteId = Array.isArray(quoteIdRaw) ? quoteIdRaw[0] : quoteIdRaw;
  const isValidQuoteId =
    typeof quoteId === 'string' && /^[0-9a-fA-F-]{36}$/.test(quoteId ?? '');

  const [car, quote] = await Promise.all([
    getCarById(id),
    isValidQuoteId ? getContactQuoteById(quoteId) : Promise.resolve(null),
  ]);

  if (!car) {
    notFound();
  }

  const pickSingleValue = (
    value: string | string[] | undefined
  ): string | undefined => (Array.isArray(value) ? value[0] : value);
  const rentIdRaw = pickSingleValue(resolvedSearchParams?.rentId);
  let fallbackAction: string | undefined;
  let rentIdCandidate = rentIdRaw;
  if (typeof rentIdCandidate === 'string' && rentIdCandidate.includes('?')) {
    const [idSegment, rest] = rentIdCandidate.split('?');
    rentIdCandidate = idSegment;
    if (!resolvedSearchParams?.action && rest) {
      const search = new URLSearchParams(rest);
      fallbackAction = search.get('action') ?? undefined;
    }
  }
  const rentId =
    typeof rentIdCandidate === 'string' && RENT_ID_REGEX.test(rentIdCandidate)
      ? rentIdCandidate
      : null;
  const actionRaw =
    pickSingleValue(resolvedSearchParams?.action) ?? fallbackAction;
  const allowedSections = new Set<ManageSection>([
    'contact',
    'travel',
    'invoice',
  ]);
  let manageSection: ManageSection | null = null;
  let manageMode: ManageMode | null = null;
  if (actionRaw === 'modify') {
    manageMode = 'modify';
  } else if (
    typeof actionRaw === 'string' &&
    allowedSections.has(actionRaw as ManageSection)
  ) {
    manageSection = actionRaw as ManageSection;
  }

  let rentPrefill: RentFormValues | null = null;
  if (rentId && manageMode === 'modify') {
    try {
      const rentRecord = await prisma.rentRequest.findUnique({
        where: { id: rentId },
        select: { id: true, carId: true, payload: true },
      });
      if (rentRecord?.payload && typeof rentRecord.payload === 'object') {
        const cloned = JSON.parse(
          JSON.stringify(rentRecord.payload)
        ) as RentFormValues;
        const payloadCarId =
          rentRecord.carId ?? (typeof cloned.carId === 'string' ? cloned.carId : null);
        if (!payloadCarId || payloadCarId === car.id) {
          rentPrefill = {
            ...cloned,
            rentId,
            carId: car.id,
            locale: resolvedLocale,
          };
        }
      }
    } catch (error) {
      console.error('Failed to load rent request for editing', error);
    }
  }

  return (
    <NoSSR>
      <RentPageClient
        locale={resolvedLocale}
        car={{ id: car.id, seats: car.seats, colors: car.colors }}
        quotePrefill={
          quote && quote.carId && quote.carId !== car.id ? null : quote
        }
        manageContext={
          rentId
            ? {
                rentId,
                section: manageSection ?? undefined,
                mode: manageMode ?? undefined,
              }
            : undefined
        }
        rentPrefill={rentPrefill ?? undefined}
      />
    </NoSSR>
  );
}
