import Link from 'next/link';
import React from 'react';
import { getTranslations } from 'next-intl/server';

export default async function Insurance({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params?.locale ?? 'hu';
  const t = await getTranslations({ locale, namespace: 'Insurance' });
  const tf = await getTranslations({ locale, namespace: 'Footer' });
  return (
    <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 lg:pt-40 mb-10'>
      {/* <Link
        href='/'
        className='absolute -left-8 sm:left-0 md:-left-8 -top-4 sm:top-0 md:-top-8 z-[1200]'
      >
        <Logo size='sm' />
      </Link> */}

      <h1 className='text-3xl uppercase sm:text-4xl md:text-5xl lg:text-6xl leading-relaxed tracking-wide md:tracking-[0.1em] text-center bg-gradient-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
        {t('title')}
      </h1>
      <p className='mt-3 text-center text-xs text-muted-foreground'>
        {t('igic_note')}
      </p>

      <div className='mt-8 sm:mt-10 text-grey-dark-3 text-base sm:text-lg leading-relaxed space-y-8'>
        <section className='space-y-4'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('sscp_title')}
          </h2>
          <p>{t('sscp_intro')}</p>
          <div className='overflow-hidden rounded-md border border-border/50'>
            <div className='grid grid-cols-1 sm:grid-cols-3 bg-muted/40 px-4 py-3 font-semibold'>
              <div>{t('table.header_event')}</div>
              <div className='hidden sm:block'>{t('table.header_desc')}</div>
              <div>{t('table.header_cost')}</div>
            </div>
            <ul className='divide-y divide-border/50'>
              <li className='grid grid-cols-1 sm:grid-cols-3 px-4 py-3'>
                <div>{t('table.rows.lost_keys.event')}</div>
                <div className='hidden sm:block'>
                  {t('table.rows.lost_keys.desc')}
                </div>
                <div>{t('table.rows.lost_keys.cost')}</div>
              </li>
              <li className='grid grid-cols-1 sm:grid-cols-3 px-4 py-3'>
                <div>{t('table.rows.tyre_damage.event')}</div>
                <div className='hidden sm:block'>
                  {t('table.rows.tyre_damage.desc')}
                </div>
                <div>{t('table.rows.tyre_damage.cost')}</div>
              </li>
              <li className='grid grid-cols-1 sm:grid-cols-3 px-4 py-3'>
                <div>{t('table.rows.rim_flat.event')}</div>
                <div className='hidden sm:block'>
                  {t('table.rows.rim_flat.desc')}
                </div>
                <div>{t('table.rows.rim_flat.cost')}</div>
              </li>
              <li className='grid grid-cols-1 sm:grid-cols-3 px-4 py-3'>
                <div>{t('table.rows.wrong_fuel.event')}</div>
                <div className='hidden sm:block'>
                  {t('table.rows.wrong_fuel.desc')}
                </div>
                <div>{t('table.rows.wrong_fuel.cost')}</div>
              </li>
              <li className='grid grid-cols-1 sm:grid-cols-3 px-4 py-3'>
                <div>{t('table.rows.battery.event')}</div>
                <div className='hidden sm:block'>
                  {t('table.rows.battery.desc')}
                </div>
                <div>{t('table.rows.battery.cost')}</div>
              </li>
              <li className='grid grid-cols-1 sm:grid-cols-3 px-4 py-3'>
                <div>{t('table.rows.dru.event')}</div>
                <div className='hidden sm:block'>
                  {t('table.rows.dru.desc')}
                </div>
                <div>{t('table.rows.dru.cost')}</div>
              </li>
            </ul>
          </div>
          <p className='text-sm text-muted-foreground'>{t('coverage_note')}</p>
          <p className='text-xs text-muted-foreground'>{t('footnote')}</p>
        </section>

        <section className='space-y-3'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('pricing_title')}
          </h2>
          <p>
            {t.rich('pricing_text', { strong: (c) => <strong>{c}</strong> })}
          </p>
          <p className='italic font-extrabold'>{t('closing')}</p>
        </section>
        <section className='space-y-2'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('related.title')}
          </h2>
          <p>
            {t('related.details')}{' '}
            <Link
              href='../rental-requirements'
              className='underline hover:text-amber-dark'
            >
              {tf('rental_requirements')}
            </Link>{' '}
            •{' '}
            <Link
              href='../general-rental-conditions'
              className='underline hover:text-amber-dark'
            >
              {tf('general_rental_conditions')}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
