'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

export default function HomeIntro() {
  const t = useTranslations('HomeIntro');
  const locale = useLocale();

  return (
    <section className='bg-white dark:bg-slate-900 py-16 md:py-24'>
      <div className='mx-auto flex max-w-7xl flex-col gap-20 px-4 md:px-8 lg:flex-row lg:items-start'>
        <div className='w-full lg:w-1/2 space-y-5'>
          <p className='text-lg leading-7 text-slate-700 dark:text-slate-200'>
            {t('paragraphs.0')}
          </p>
          <p className='text-lg leading-7 text-slate-700 dark:text-slate-200'>
            {t('paragraphs.1')}
          </p>
          <p className='text-lg leading-7 text-slate-700 dark:text-slate-200'>
            {t('paragraphs.2')}
          </p>
        </div>
        <aside className='w-full lg:w-1/2 space-y-6 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/40'>
          <h2 className='text-xl font-semibold tracking-wide text-slate-900 dark:text-slate-100 uppercase'>
            {t('highlights.title')}
          </h2>
          <ul className='space-y-4 text-base leading-7 text-slate-700 dark:text-slate-200'>
            <li>{t('highlights.items.0')}</li>
            <li>{t('highlights.items.2')}</li>
          </ul>
          <Link
            href={`/${locale}/contact`}
            className='inline-block rounded-full border border-amber bg-white px-5 py-2 text-sm font-semibold uppercase tracking-wide text-amber-dark transition hover:border-sky-dark hover:text-sky-dark hover:bg-slate-100 dark:border-sky-300/50 dark:bg-transparent dark:text-sky-200 dark:hover:border-sky-200 dark:hover:bg-sky-200/10'
          >
            {t('cta')}
          </Link>
        </aside>
      </div>
    </section>
  );
}
