import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { buildPageMetadata, resolveLocale } from '@/lib/seo';
import { QuoteRequestForm } from '@/components/contact/QuoteRequestForm';
import { getCarById } from '@/lib/cars';

type PageParams = { locale: string };
type SearchParams = { carId?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveLocale(locale);
  return buildPageMetadata({
    locale: resolvedLocale,
    pageKey: 'contact',
    path: '/contact',
    imagePath: '/header_image.webp',
  });
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams?: Promise<SearchParams>;
}) {
  const { locale = 'hu' } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: 'Contact',
  });

  const selectedCar =
    resolvedSearchParams.carId && resolvedSearchParams.carId.trim()
      ? await getCarById(resolvedSearchParams.carId.trim())
      : null;

  return (
    <>
      <div className='relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 lg:pt-40 '>
        <h2 className='text-3xl uppercase sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-relaxed tracking-wide md:tracking-[0.1em] text-center bg-gradient-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
          {t('title')}
        </h2>
        <div className='mt-10 text-grey-dark-3 text-base md:text-lg tracking-wider'>
          <p className='mb-4'>
            {t.rich('p1', { strong: (chunks) => <strong>{chunks}</strong> })}
          </p>
          <p className='mb-6'>
            {t.rich('p2', { strong: (chunks) => <strong>{chunks}</strong> })}
          </p>
        </div>
      </div>
      <QuoteRequestForm
        locale={resolvedLocale}
        selectedCar={
          selectedCar ? { id: selectedCar.id, name: `${selectedCar.manufacturer} ${selectedCar.model}`.trim() } : undefined
        }
      />
    </>
  );
}
