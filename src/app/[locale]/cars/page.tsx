import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CAR_COLOR_SWATCH, type CarColor, getCars } from '@/lib/cars';
import { buildPageMetadata, resolveLocale } from '@/lib/seo';
import CarImageCarousel from '@/components/cars/CarImageCarousel';
import { Luggage, User } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

type PageParams = { locale: string };

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
}: {
  params: Promise<PageParams>;
}) {
  const { locale = 'hu' } = await params;
  const resolvedLocale = resolveLocale(locale);
  const cars = await getCars();

  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: 'Cars',
  });

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

  return (
    <div className='relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-18 sm:pt-18 md:pt-22 lg:pt-28'>
      <h2 className='text-2xl uppercase sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-relaxed tracking-normal md:tracking-[0.1em] text-center bg-gradient-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
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
      <div className='mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 mb-20'>
        {cars.map((car) => (
          <div
            key={car.id}
            className='group rounded-lg border border-border/60 bg-card text-card-foreground shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200'
          >
            <div className='relative aspect-square md:aspect-[4/3] lg:aspect-[16/10] bg-muted/30 overflow-hidden'>
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
                <Badge
                  variant='secondary'
                  className='shrink-0 uppercase tracking-wide'
                >
                  {t(`transmissions.${car.transmission}`)}
                </Badge>
              </div>
              {(() => {
                const weeklyPrice = getWeeklyPrice(car.prices);
                if (!Number.isFinite(weeklyPrice ?? NaN)) return null;
                const formatted = formatWeeklyPrice(weeklyPrice as number);
                return (
                  <p className='mt-2 text-sm font-semibold text-amber-dark leading-snug'>
                    {t('labels.available_from_week', { price: formatted })}
                  </p>
                );
              })()}
              <div className='mt-4 flex flex-col gap-3 text-sm text-muted-foreground'>
                <div className='flex flex-wrap items-center gap-1'>
                  {Array.from({ length: car.seats }).map((_, i) => (
                    <User key={`${car.id}-seat-${i}`} className='h-5 w-5' />
                  ))}
                </div>
                <div className='flex flex-col items-start gap-2 text-xs sm:flex-row sm:items-center sm:gap-3 sm:text-sm'>
                  <span className='flex items-center gap-1'>
                    {Array.from({ length: car.largeLuggage }).map((_, i) => (
                      <Luggage
                        key={`large-${car.id}-${i}`}
                        className='h-6 w-6'
                      />
                    ))}
                  </span>
                  <span className='text-muted-foreground hidden sm:block'>
                    /
                  </span>
                  <span className='flex items-center gap-1'>
                    {Array.from({ length: car.smallLuggage }).map((_, i) => (
                      <Luggage
                        key={`small-${car.id}-${i}`}
                        className='h-4 w-4'
                      />
                    ))}
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
                <Button
                  asChild
                  className='w-full sm:w-auto bg-sky-light uppercase text-grey-dark-3 transition-all duration-300 hover:bg-sky-dark lg:pointer-events-none lg:opacity-0 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100 lg:group-hover:cursor-pointer'
                >
                  <Link href={`/${resolvedLocale}/cars/${car.id}`}>
                    {t('buttons.interested')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
