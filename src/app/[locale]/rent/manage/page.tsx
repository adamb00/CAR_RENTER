import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import buildAlertBanner from '@/components/rent/cancel/BuildAlertBanner';
import CancelForm from '@/components/rent/cancel/CancelFormPage';
import { buildMetadataFromContent, resolveLocale } from '@/lib/seo/seo';

type PageParams = { locale: string };
type SearchParams = { action?: string; result?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: 'RentManage',
  });
  const title = t('meta.title');
  const description = t('meta.description');

  return buildMetadataFromContent({
    locale: resolvedLocale,
    path: '/rent/manage',
    title,
    description,
    imagePath: '/header_image.webp',
    imageAlt: title,
  });
}

export default async function ManageRentCancelPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams?: Promise<SearchParams>;
}) {
  const [routeParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<SearchParams>({}),
  ]);
  const { locale } = routeParams;
  const resolvedLocale = resolveLocale(locale);
  const tManage = await getTranslations({
    locale: resolvedLocale,
    namespace: 'RentManage',
  });
  const resultParam = resolvedSearchParams?.result;
  const alert = buildAlertBanner(resultParam, tManage);

  return (
    <section className='relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-10'>
      <div className='text-center space-y-4'>
        <p className='text-xs uppercase tracking-[0.6em] text-slate-500 dark:text-slate-300'>
          {tManage('meta.kicker')}
        </p>
        <h1 className='text-3xl md:text-4xl lg:text-5xl font-semibold tracking-wide bg-linear-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
          {tManage('title')}
        </h1>
        <p className='text-base md:text-lg text-grey-dark-3 dark:text-grey-dark-2'>
          {tManage('description')}
        </p>
      </div>

      <div className='space-y-4'>
        {alert}

        <CancelForm locale={resolvedLocale} tManage={tManage} />
      </div>
    </section>
  );
}
