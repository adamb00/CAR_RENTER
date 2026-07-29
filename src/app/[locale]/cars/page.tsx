import CarImageCarousel from '@/components/cars/CarImageCarousel';
import RentSection from '@/components/layout/RentSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchCars, getCarPrice } from '@/lib/cars';
import { CAR_COLOR_SWATCH, type CarColor } from '@/lib/cars-shared';
import { getInsurancePrice } from '@/lib/insurance';
import { buildPageMetadata, resolveLocale } from '@/lib/seo/seo';
import { Luggage, User } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

type PageParams = {
  locale: string;
};

type PageSearchParams = {
  island?: string;
  startDate?: string;
  endDate?: string;
  age?: string;
  days?: number;
};

const LOW_AVAILABILITY_LIMIT = 5;
const DAY_MS = 1000 * 60 * 60 * 24;

const getDailyMultiplierForDays = (
  dailyMultipliers: Record<string, number>,
  days: number | null,
): number | null => {
  if (days === null || !Number.isFinite(days) || days < 0) return null;

  const match = Object.entries(dailyMultipliers).reduce<{
    dayKey: number;
    multiplier: number;
  } | null>((currentMatch, [key, multiplier]) => {
    const dayKey = Number(key);

    if (!Number.isFinite(dayKey) || dayKey > days) return currentMatch;
    if (currentMatch && currentMatch.dayKey >= dayKey) return currentMatch;

    return { dayKey, multiplier };
  }, null);

  return match?.multiplier ?? null;
};

const parseDateParam = (date: string): Date =>
  new Date(`${date}T00:00:00.000Z`);

const formatDateKey = (date: Date): string => date.toISOString().slice(0, 10);

const getRentalDayKeys = (startDate?: string, endDate?: string): string[] => {
  if (!startDate || !endDate) return [];

  const start = parseDateParam(startDate);
  const end = parseDateParam(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start >= end
  ) {
    return [];
  }

  const days = Math.ceil((end.getTime() - start.getTime()) / DAY_MS);

  return Array.from({ length: days }, (_, index) =>
    formatDateKey(new Date(start.getTime() + index * DAY_MS)),
  );
};

type QuotePrice = Awaited<ReturnType<typeof getCarPrice>>[number];

const buildQuotePriceMap = (quotePrices: QuotePrice[]) => {
  return new Map(
    quotePrices.map((quotePrice) => [
      `${quotePrice.carId}:${formatDateKey(quotePrice.date)}`,
      {
        action: quotePrice.action,
        price: quotePrice.price,
      },
    ]),
  );
};

type QuotePriceMap = ReturnType<typeof buildQuotePriceMap>;

const hasPromotionalStartPrice = ({
  carId,
  dayKeys,
  quotePriceMap,
}: {
  carId: string;
  dayKeys: string[];
  quotePriceMap: QuotePriceMap;
}): boolean => {
  const startDayKey = dayKeys[0];
  if (!startDayKey) return false;

  const startDailyPrice = quotePriceMap.get(`${carId}:${startDayKey}`);

  return Boolean(startDailyPrice?.action && startDailyPrice.price > 0);
};

const getRentalPrice = ({
  carId,
  dailyMultipliers,
  dayKeys,
  quotePriceMap,
}: {
  carId: string;
  dailyMultipliers: Record<string, number>;
  dayKeys: string[];
  quotePriceMap: QuotePriceMap;
}): number => {
  if (dayKeys.length === 0) return 0;

  let total = 0;
  const firstDailyPrice = quotePriceMap.get(`${carId}:${dayKeys[0]}`);

  if (!firstDailyPrice || firstDailyPrice.price <= 0) {
    return 0;
  }

  if (!firstDailyPrice.action) {
    total = firstDailyPrice.price * dayKeys.length;
  }

  if (firstDailyPrice.action) {
    for (let index = 0; index < dayKeys.length; index += 1) {
      const dailyPrice = quotePriceMap.get(`${carId}:${dayKeys[index]}`);

      if (!dailyPrice || dailyPrice.price <= 0) {
        return 0;
      }

      if (dailyPrice.action) {
        total += dailyPrice.price;
        continue;
      }

      total += dailyPrice.price * (dayKeys.length - index);
      break;
    }
  }

  const multiplier =
    getDailyMultiplierForDays(dailyMultipliers, dayKeys.length) ?? 1;

  return Math.floor(total * multiplier);
};

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveLocale(locale);
  return buildPageMetadata({
    locale: resolvedLocale,
    pageKey: 'cars',
    path: '/cars',
    imagePath: '/cars.webp',
  });
}

export default async function CarsPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearchParams>;
}) {
  const { locale = 'hu' } = await params;
  const { island, startDate, endDate, age, days } = await searchParams;
  const resolvedLocale = resolveLocale(locale);
  const cars = await fetchCars(startDate, endDate);

  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: 'Cars',
  });

  const quotePrices = await getCarPrice(island, startDate, endDate);
  const rentalDayKeys = getRentalDayKeys(startDate, endDate);
  const quotePriceMap = buildQuotePriceMap(quotePrices);

  const getColorBadgeStyle = (colorKey: CarColor) => {
    const hex = CAR_COLOR_SWATCH[colorKey] ?? '#e5e7eb';
    const rgb = hex.replace('#', '');
    const r = parseInt(rgb.substring(0, 2), 16);
    const g = parseInt(rgb.substring(2, 4), 16);
    const b = parseInt(rgb.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const textColor = luminance > 0.7 ? '#0f172a' : '#f8fafc';
    return { backgroundColor: hex, color: textColor, borderColor: hex };
  };

  const insurance = await getInsurancePrice(Number(age), Number(days));

  return (
    <div className='relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-18 sm:pt-18 md:pt-22 lg:pt-28'>
      <h2 className='text-2xl uppercase sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-relaxed tracking-normal md:tracking-widest text-center bg-linear-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
        {t('title')}
      </h2>
      <div className='mt-10 text-grey-dark-3 text-base md:text-lg tracking-wider'>
        <p className='mb-4'>
          {t.rich('p1', { strong: (c) => <strong>{c}</strong> })}
        </p>
        <p className='mb-6'>
          {t.rich('p2', { strong: (c) => <strong>{c}</strong> })}
        </p>
      </div>

      {island ? (
        <div className='mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 mb-20'>
          {cars.map((car) => {
            const price = getRentalPrice({
              carId: car.id,
              dailyMultipliers: car.dailyMultiplier,
              dayKeys: rentalDayKeys,
              quotePriceMap,
            });
            const lowAvailabilityCount =
              typeof car.availableCount === 'number' &&
              car.availableCount > 0 &&
              car.availableCount <= LOW_AVAILABILITY_LIMIT
                ? car.availableCount + 1
                : null;
            const hasActionPrice = hasPromotionalStartPrice({
              carId: car.id,
              dayKeys: rentalDayKeys,
              quotePriceMap,
            });

            return (
              <div
                key={car.id}
                className='group rounded-lg border border-border/60 bg-card text-card-foreground shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200'
              >
                <div className='relative aspect-square md:aspect-4/3 lg:aspect-16/10 bg-muted/30 overflow-hidden'>
                  <Link
                    href={`/${resolvedLocale}/cars/${car.id}`}
                    className='absolute inset-0'
                  >
                    <CarImageCarousel
                      images={
                        car.images && car.images.length > 0
                          ? car.images
                          : [car.image]
                      }
                      name={car.name}
                      className='h-full w-full'
                      imageClassName='h-full w-full object-contain bg-background'
                    />
                  </Link>
                </div>
                <div className='flex h-full flex-col border p-4 shadow-xl sm:p-5'>
                  <div className='flex items-start justify-between gap-4'>
                    <h3 className='text-lg font-semibold'>{car.name}</h3>
                    <div className='flex shrink-0 flex-wrap justify-end gap-2'>
                      {hasActionPrice ? (
                        <Badge className='bg-amber-dark text-white hover:bg-amber-dark'>
                          {t('labels.promotional_price')}
                        </Badge>
                      ) : null}
                      <Badge
                        variant='secondary'
                        className='uppercase tracking-wide'
                      >
                        {t(`transmissions.${car.transmission}`)}
                      </Badge>
                    </div>
                  </div>
                  {(() => {
                    if (!price || price <= 0)
                      return (
                        <p className='mt-2 text-sm font-semibold text-amber-dark leading-snug'>
                          {t('labels.custom_quote')}
                        </p>
                      );
                    // const weeklyPrice = getWeeklyPrice(car.prices);
                    // if (!Number.isFinite(weeklyPrice ?? NaN)) return null;
                    // const formatted = formatWeeklyPrice(weeklyPrice as number);
                    return (
                      <p className='mt-2 text-sm font-semibold text-amber-dark leading-snug'>
                        {/* {t('labels.available_from_week', { price })} */}
                        {t('labels.rental_fee', {
                          price: price.toLocaleString(resolvedLocale, {
                            style: 'currency',
                            currency: 'EUR',
                          }),
                          days: days ?? 0,
                        })}
                      </p>
                    );
                  })()}
                  {insurance && typeof insurance === 'number' ? (
                    <p className='mt-2 text-sm font-semibold text-navy-light leading-snug'>
                      {t('labels.insurance_fee', {
                        price: insurance.toLocaleString(resolvedLocale, {
                          style: 'currency',
                          currency: 'EUR',
                        }),
                        days: days ?? 0,
                      })}
                    </p>
                  ) : null}
                  {typeof car.availableCount === 'number' ? (
                    <p
                      className={`mt-2 text-sm font-semibold leading-snug ${
                        car.availableCount > 0
                          ? 'text-sky-dark'
                          : 'text-destructive'
                      }`}
                    >
                      {car.availableCount > 0
                        ? lowAvailabilityCount
                          ? t('labels.low_available_count', {
                              count: lowAvailabilityCount,
                            })
                          : t('labels.available_count', {
                              count: car.availableCount,
                            })
                        : t('labels.unavailable')}
                    </p>
                  ) : null}

                  <div className='mt-4 flex flex-col gap-3 text-sm text-muted-foreground'>
                    <div className='flex flex-wrap items-center gap-1'>
                      {Array.from({ length: car.seats }).map((_, i) => (
                        <User key={`${car.id}-seat-${i}`} className='h-5 w-5' />
                      ))}
                    </div>
                    <div className='flex flex-col items-start gap-2 text-xs sm:flex-row sm:items-center sm:gap-3 sm:text-sm'>
                      <span className='flex items-center gap-1'>
                        {Array.from({ length: car.largeLuggage }).map(
                          (_, i) => (
                            <Luggage
                              key={`large-${car.id}-${i}`}
                              className='h-6 w-6'
                            />
                          ),
                        )}
                      </span>
                      <span className='text-muted-foreground hidden sm:block'>
                        /
                      </span>
                      <span className='flex items-center gap-1'>
                        {Array.from({ length: car.smallLuggage }).map(
                          (_, i) => (
                            <Luggage
                              key={`small-${car.id}-${i}`}
                              className='h-4 w-4'
                            />
                          ),
                        )}
                      </span>
                    </div>
                  </div>
                  <div className='mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='flex flex-wrap items-center gap-2 text-xs tracking-wide text-muted-foreground'>
                      {car.colors.length > 0 ? (
                        <div className='flex flex-wrap items-center gap-2'>
                          {car.colors.map((colorKey) => (
                            <Badge
                              key={`${car.id}-${colorKey}`}
                              variant='outline'
                              className='border'
                              style={getColorBadgeStyle(colorKey)}
                            >
                              {t(`colors.${colorKey}`)}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {car.availableCount !== 0 && (
                      <Button
                        asChild
                        disabled={car.availableCount === 0 || price <= 0}
                        className='w-full sm:w-auto bg-sky-light uppercase text-grey-dark-3 transition-all duration-300 hover:bg-sky-dark lg:pointer-events-none lg:opacity-0 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100 lg:group-hover:cursor-pointer'
                      >
                        <Link
                          href={`/${resolvedLocale}/cars/${car.id}?island=${island}&startDate=${startDate}&endDate=${endDate}&quotePrice=${price}&insurance=${insurance}&days=${days}`}
                        >
                          {t('buttons.interested')}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <RentSection locale={resolvedLocale} />
      )}
    </div>
  );
}
