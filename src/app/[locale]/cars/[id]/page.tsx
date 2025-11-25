import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ArrowLeft, Car, Luggage, User } from 'lucide-react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CarImageCarousel from '@/components/cars/CarImageCarousel';
import {
  CAR_COLOR_SWATCH,
  type CarColor,
  getCarById,
  getCars,
} from '@/lib/cars';
import { getSiteUrl, resolveLocale } from '@/lib/seo';
import { LOCALES } from '@/i18n/config';

type CarPageParams = {
  locale: string;
  id: string;
};

const formatLabel = (value: string) =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<CarPageParams>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const resolvedLocale = resolveLocale(locale);
  const car = await getCarById(id);

  if (!car) {
    return {};
  }

  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: 'CarDetail',
  });
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
        LOCALES.map((loc) => [loc, `${siteUrl}/${loc}/cars/${car.id}`])
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

  if (!car) {
    notFound();
  }

  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: 'Cars',
  });

  const translateBodyType = (bodyType: string) => {
    try {
      return t(`bodyTypes.${bodyType}`);
    } catch {
      return formatLabel(bodyType);
    }
  };

  const translateFuel = (fuel: string) => {
    try {
      return t(`fuels.${fuel}`);
    } catch {
      return formatLabel(fuel);
    }
  };

  const translatedBodyType = translateBodyType(car.bodyType);
  const translatedFuel = translateFuel(car.fuel);

  const carouselImages =
    car.images && car.images.length > 0
      ? Array.from(new Set(car.images))
      : [car.image];

  const colorLabels = car.colors.map((colorKey) => ({
    key: colorKey,
    label: t(`colors.${colorKey}`),
  }));

  const getBadgeStyle = (colorKey: CarColor) => {
    const hex = CAR_COLOR_SWATCH[colorKey] ?? '#e5e7eb';
    const rgb = hex.replace('#', '');
    const r = parseInt(rgb.substring(0, 2), 16);
    const g = parseInt(rgb.substring(2, 4), 16);
    const b = parseInt(rgb.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const textColor = luminance > 0.7 ? '#0f172a' : '#f8fafc';
    return { backgroundColor: hex, color: textColor, borderColor: hex };
  };

  const monthIndex = new Date().getMonth();
  const formatWeeklyPrice = (price: number) =>
    new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);

  const getWeeklyPrice = (prices: number[]): number | null => {
    if (!Array.isArray(prices) || prices.length === 0) return null;
    const direct = prices[monthIndex];
    if (Number.isFinite(direct)) return direct as number;
    const fallback = prices.find((p) => Number.isFinite(p));
    if (Number.isFinite(fallback)) return fallback as number;
    const first = prices[0];
    return Number.isFinite(first) ? first : null;
  };

  const detailItems = [
    {
      icon: User,
      label: `${car.seats} ${t('labels.seats')}`,
    },
    {
      icon: Car,
      label: translatedBodyType,
    },
    {
      icon: Luggage,
      label: t('details.luggage_large', { count: car.largeLuggage }),
    },
    {
      icon: Luggage,
      label: t('details.luggage_small', { count: car.smallLuggage }),
    },
  ];

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
          <CarImageCarousel images={carouselImages} name={car.name} />
        </div>

        <div className='flex flex-col gap-6 rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm sm:p-6'>
          <div>
            <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
              {car.name}
            </h1>
            {(() => {
              const weeklyPrice = getWeeklyPrice(car.prices);
              if (!Number.isFinite(weeklyPrice ?? NaN)) return null;
              const formatted = formatWeeklyPrice(weeklyPrice as number);
              return (
                <p className='mt-2 text-base font-semibold text-amber-dark leading-snug'>
                  {t('labels.available_from_week', { price: formatted })}
                </p>
              );
            })()}

            <div className='mt-3 flex flex-wrap gap-2'>
              <Badge variant='outline'>{translatedBodyType}</Badge>
              <Badge variant='outline'>{translatedFuel}</Badge>
              <Badge variant='outline'>
                {t(`transmissions.${car.transmission}`)}
              </Badge>
            </div>
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

          {car.colors.length > 0 && (
            <div>
              <h2 className='text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground'>
                {t('details.colors')}
              </h2>
              <div className='mt-3 flex flex-wrap items-center gap-2 text-sm text-foreground/90'>
                {colorLabels.map(({ key, label }) => (
                  <Badge
                    key={`${car.id}-color-${key}`}
                    variant='outline'
                    className='border'
                    style={getBadgeStyle(key)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className='mt-2 flex flex-col gap-3 sm:flex-row'>
            <Button asChild className='w-full sm:w-auto'>
              <Link href={`/${resolvedLocale}/cars/${car.id}/rent`}>
                {t('buttons.interested')}
              </Link>
            </Button>
            <Button asChild variant='outline' className='w-full sm:w-auto'>
              <Link href={`/${resolvedLocale}/contact?carId=${car.id}`}>
                {t('buttons.request_quote')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
