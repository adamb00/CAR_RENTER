import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { buildPageMetadata, resolveLocale } from '@/lib/seo/seo';

type PageParams = { locale: string; id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const resolvedLocale = resolveLocale(locale);
  return buildPageMetadata({
    locale: resolvedLocale,
    pageKey: 'cars',
    path: `/cars/${id}/rent/finish`,
    imagePath: '/header_image.webp',
  });
}

export default async function RentFinishPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale } = await params;
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: 'RentForm',
  });

  return (
    <div className='relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center space-y-8'>
      <h1 className='text-4xl sm:text-5xl md:text-6xl font-semibold text-sky-dark dark:text-amber-light'>
        {t('sections.booking.title')}
      </h1>
      <p className='text-lg sm:text-xl text-grey-dark-3 dark:text-grey-dark-2 max-w-3xl mx-auto'>
        {t('sections.booking.description')}
      </p>
      <Link
        href={`/${resolvedLocale}`}
        className='inline-flex items-center justify-center rounded-2xl bg-sky-dark px-6 py-3 text-base font-semibold text-white transition hover:bg-sky-dark/80 focus-visible:outline-none focus-visible:ring focus-visible:ring-sky-dark/60'
      >
        {t('cta.bookNow')}
      </Link>
    </div>
  );
}
