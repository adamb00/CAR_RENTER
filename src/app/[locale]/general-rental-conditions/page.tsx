import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { buildPageMetadata, resolveLocale } from '@/lib/seo/seo';

type PageParams = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveLocale(locale);
  return buildPageMetadata({
    locale: resolvedLocale,
    pageKey: 'generalRental',
    path: '/general-rental-conditions',
    imagePath: '/header_image.webp',
  });
}

export default async function GeneralRentalConditionsPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale = 'hu' } = await params;
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: 'GeneralRental',
  });
  const tf = await getTranslations({
    locale: resolvedLocale,
    namespace: 'Footer',
  });
  const title = t('title');

  return (
    <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 lg:pt-40 mb-10'>
      <h1 className='text-3xl uppercase sm:text-4xl md:text-5xl lg:text-6xl leading-relaxed tracking-wide md:tracking-widest text-center bg-linear-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
        {title}
      </h1>

      <div className='mt-8 sm:mt-10 text-grey-dark-3 text-base sm:text-lg leading-relaxed space-y-10'>
        <section className='space-y-4'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('general.title')}
          </h2>
          <p>{t.rich('general.p1', { strong: (c) => <strong>{c}</strong> })}</p>
          <p>{t.rich('general.p2', { strong: (c) => <strong>{c}</strong> })}</p>
          <p>{t.rich('general.p3', { strong: (c) => <strong>{c}</strong> })}</p>
          <p>{t.rich('general.p4', { strong: (c) => <strong>{c}</strong> })}</p>
        </section>

        <section className='space-y-5'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('services.title')}
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <h3 className='font-bold mb-2'>{t('services.kanary.title')}</h3>
              <ul className='list-disc pl-6 space-y-1'>
                <li>
                  {t.rich('services.kanary.i1', {
                    strong: (c) => <strong>{c}</strong>,
                  })}
                </li>
                <li>{t('services.kanary.i2')}</li>
                <li>
                  {t.rich('services.kanary.i3', {
                    strong: (c) => <strong>{c}</strong>,
                  })}
                </li>
                <li>{t('services.kanary.i4')}</li>
                <li>{t('services.kanary.i5')}</li>
                <li>{t('services.kanary.i6')}</li>
                <li>{t('services.kanary.i7')}</li>
                <li>{t('services.kanary.i8')}</li>
                <li>{t('services.kanary.i9')}</li>
                <li>{t('services.kanary.i10')}</li>
                <li>{t('services.kanary.i11')}</li>
              </ul>
            </div>
            <div>
              <h3 className='font-bold mb-2'>
                {t('services.peninsula.title')}
              </h3>
              <ul className='list-disc pl-6 space-y-1'>
                <li>
                  {t.rich('services.peninsula.i1', {
                    strong: (c) => <strong>{c}</strong>,
                  })}
                </li>
                <li>{t('services.peninsula.i2')}</li>
                <li>
                  {t.rich('services.peninsula.i3', {
                    strong: (c) => <strong>{c}</strong>,
                  })}
                </li>
                <li>{t('services.peninsula.i4')}</li>
                <li>{t('services.peninsula.i5')}</li>
                <li>{t('services.peninsula.i6')}</li>
                <li>{t('services.peninsula.i7')}</li>
                <li>{t('services.peninsula.i8')}</li>
                <li>
                  {t.rich('services.peninsula.i9', {
                    strong: (c) => <strong>{c}</strong>,
                  })}
                </li>
                <li>
                  {t.rich('services.peninsula.i10', {
                    strong: (c) => <strong>{c}</strong>,
                  })}
                </li>
                <li>{t('services.peninsula.i11')}</li>
                <li>{t('services.peninsula.i12')}</li>
              </ul>
            </div>
          </div>
          <p className='text-sm text-muted-foreground'>{t('services.foot1')}</p>
          <p className='text-sm text-muted-foreground'>{t('services.foot2')}</p>
        </section>

        <section className='space-y-4'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('canary.title')}
          </h2>
          <ul className='list-disc pl-6 space-y-2'>
            <li>
              {t.rich('canary.i1', { strong: (c) => <strong>{c}</strong> })}
            </li>
            <li>
              {t.rich('canary.i2', { strong: (c) => <strong>{c}</strong> })}
            </li>
            <li>{t('canary.i3')}</li>
            <li>
              {t.rich('canary.i4', { strong: (c) => <strong>{c}</strong> })}
            </li>
            <li>{t('canary.i5')}</li>
            <li>
              {t.rich('canary.i6', { strong: (c) => <strong>{c}</strong> })}
            </li>
            <li>
              {t.rich('canary.i7', { strong: (c) => <strong>{c}</strong> })}
            </li>
            <li>
              {t.rich('canary.i8', { strong: (c) => <strong>{c}</strong> })}
            </li>
            <li>
              {t.rich('canary.i9', { strong: (c) => <strong>{c}</strong> })}
            </li>
          </ul>
        </section>

        <section className='space-y-4'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('peninsula.title')}
          </h2>
          <ul className='list-disc pl-6 space-y-2'>
            <li>
              {t.rich('peninsula.i1', { strong: (c) => <strong>{c}</strong> })}
            </li>
            <li>
              {t.rich('peninsula.i2', { strong: (c) => <strong>{c}</strong> })}
            </li>
            <li>
              {t.rich('peninsula.i3', { strong: (c) => <strong>{c}</strong> })}
            </li>
            <li>{t('peninsula.i4')}</li>
            <li>{t('peninsula.i5')}</li>
            <li>{t('peninsula.i6')}</li>
            <li>{t('peninsula.i7')}</li>
            <li>{t('peninsula.i8')}</li>
            <li>
              {t.rich('peninsula.i9', { strong: (c) => <strong>{c}</strong> })}
            </li>
            <li>
              {t.rich('peninsula.i10', { strong: (c) => <strong>{c}</strong> })}
            </li>
            <li>
              {t.rich('peninsula.i11', { strong: (c) => <strong>{c}</strong> })}
            </li>
          </ul>
        </section>

        <section className='space-y-4'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('schedule.title')}
          </h2>
          <ul className='list-disc pl-6 space-y-2'>
            <li>{t('schedule.i1')}</li>
            <li>{t('schedule.i2')}</li>
            <li>{t('schedule.i3')}</li>
            <li>{t('schedule.i4')}</li>
            <li>{t('schedule.i5')}</li>
            <li>{t('schedule.i6')}</li>
            <li>{t('schedule.i7')}</li>
            <li>{t('schedule.i8')}</li>
          </ul>
        </section>

        <section className='space-y-3'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('liability.title')}
          </h2>
          <p>{t('liability.p1')}</p>
          <p>
            {t.rich('liability.p2', { strong: (c) => <strong>{c}</strong> })}
          </p>
          <p>{t('liability.p3')}</p>
        </section>

        <section className='space-y-2'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('related.title')}
          </h2>
          <p>
            {t('related.details')}{' '}
            <Link
              href='../insurance'
              className='underline hover:text-amber-dark'
            >
              {tf('insurance')}
            </Link>{' '}
            •{' '}
            <Link
              href='../rental-requirements'
              className='underline hover:text-amber-dark'
            >
              {tf('rental_requirements')}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
