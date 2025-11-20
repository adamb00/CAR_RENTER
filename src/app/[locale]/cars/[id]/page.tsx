import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ArrowLeft, Car, Luggage, User } from 'lucide-react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCarById, getCars } from '@/lib/cars';
import { getSiteUrl, resolveLocale } from '@/lib/seo';
import { LOCALES } from '@/i18n/config';

type CarPageParams = {
  locale: string;
  id: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<CarPageParams>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const resolvedLocale = resolveLocale(locale);
  const car = await getCarById(id);

  if (!car || car.status !== 'available') {
    return {};
  }

  const t = await getTranslations({ locale: resolvedLocale, namespace: 'CarDetail' });
  const title = t('meta.title', { carName: car.name });
  const description = t('meta.description', { carName: car.name });
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/${resolvedLocale}/cars/${car.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [
          loc,
          `${siteUrl}/${loc}/cars/${car.id}`,
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

export async function generateStaticParams(): Promise<CarPageParams[]> {
  const cars = await getCars();
  return LOCALES.flatMap((locale) =>
    cars.map((car) => ({
      locale,
      id: car.id,
    }))
  );
}

export default async function CarPage({
  params,
}: {
  params: Promise<CarPageParams>;
}) {
  const { locale, id } = await params;
  const resolvedLocale = resolveLocale(locale);
  const car = await getCarById(id);

  if (!car || car.status !== 'available') {
    notFound();
  }

  const t = await getTranslations({ locale: resolvedLocale, namespace: 'Cars' });

  const detailItems = [
    {
      icon: User,
      label: `${car.seats} ${t('labels.seats')}`,
    },
    {
      icon: Car,
      label: `${t('details.category')}: ${t(`categories.${car.category}`)}`,
    },
    {
      icon: Luggage,
      label: t('details.luggage_large', { count: car.largeLuggage }),
    },
    {
      icon: Luggage,
      label: t('details.luggage_small', { count: car.smallLuggage }),
    },
  ] as const;

  return (
    <div className='relative mx-auto flex max-w-6xl flex-col px-4 pt-18 pb-16 sm:px-6 md:pt-22 lg:px-8 lg:pt-24'>
      <Link
        href={`/${resolvedLocale}/cars`}
        className='inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
      >
        <ArrowLeft className='h-4 w-4' />
        {t('details.back')}
      </Link>

      <div className='mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]'>
        <div className='overflow-hidden rounded-2xl border border-border/60 bg-muted/20'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={car.image}
            alt={car.name}
            className='h-full w-full object-contain bg-background'
            loading='lazy'
          />
        </div>

        <div className='flex flex-col gap-6 rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm sm:p-6'>
          <div>
            <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
              {car.name}
            </h1>
            <p className='mt-2 text-base text-muted-foreground'>
              {t(`categories.${car.category}`)} •{' '}
              {t(`transmissions.${car.transmission}`)}
            </p>
            <p className='mt-4 text-2xl font-semibold text-primary'>
              {t('labels.from_price', { price: car.pricePerDay })}
              <span className='ml-2 text-sm font-normal text-muted-foreground'>
                {t('labels.per_day')}
              </span>
            </p>
          </div>

          <div>
            <h2 className='text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground'>
              {t('details.title')}
            </h2>
            <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
              {detailItems.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className='flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-3'
                >
                  <Icon className='h-5 w-5 flex-shrink-0 text-primary' />
                  <span className='text-sm font-medium text-foreground/90'>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className='text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground'>
              {t('details.colors')}
            </h2>
            <div className='mt-3 flex flex-wrap gap-2'>
              {car.colors.map((colorKey) => (
                <Badge key={`${car.id}-${colorKey}`} variant='outline'>
                  {t(`colors.${colorKey}`)}
                </Badge>
              ))}
            </div>
          </div>

          <Button asChild className='mt-2 w-full sm:w-auto'>
            <Link href={`/${resolvedLocale}/cars/${car.id}/rent`}>
              {t('buttons.interested')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
