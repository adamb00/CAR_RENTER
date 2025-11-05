'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

export default function HomeIntro() {
  const t = useTranslations('HomeIntro');
  const locale = useLocale();
  const paragraphs = (t.raw('paragraphs') as string[]) || [];
  const highlightItems = (t.raw('highlights.items') as string[]) || [];
  const details = (t.raw('details') as {
    title?: string;
    intro?: string;
    sections?: Array<{ heading: string; body: string[] }>;
  }) || { title: '', intro: '', sections: [] };
  const detailSections = Array.isArray(details.sections)
    ? details.sections
    : [];

  return (
    <section className='bg-white dark:bg-slate-900 py-16 md:py-24'>
      <div className='mx-auto flex max-w-7xl flex-col gap-20 px-4 md:px-8 lg:flex-row lg:items-start'>
        <div className='w-full space-y-5 lg:w-1/2'>
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className='text-lg leading-7 text-slate-700 dark:text-slate-200'
            >
              {paragraph}
            </p>
          ))}
        </div>
        <aside className='w-full space-y-6 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/40 lg:w-1/2'>
          <h2 className='text-xl font-semibold tracking-wide text-slate-900 dark:text-slate-100 uppercase'>
            {t('highlights.title')}
          </h2>
          <ul className='space-y-4 text-base leading-7 text-slate-700 dark:text-slate-200'>
            {highlightItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <Link
            href={`/${locale}/contact`}
            className='inline-block rounded-full border border-amber bg-white px-5 py-2 text-sm font-semibold uppercase tracking-wide text-amber-dark transition hover:border-sky-dark hover:text-sky-dark hover:bg-slate-100 dark:border-sky-300/50 dark:bg-transparent dark:text-sky-200 dark:hover:border-sky-200 dark:hover:bg-sky-200/10'
          >
            {t('cta')}
          </Link>
        </aside>
      </div>
      {detailSections.length > 0 && (
        <article className='mx-auto mt-16 max-w-7xl space-y-12 px-4 md:px-8'>
          <header className='space-y-4 text-left'>
            {details.title && (
              <h2 className='text-2xl font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100'>
                {details.title}
              </h2>
            )}
            {details.intro && (
              <p className='text-lg leading-7 text-slate-700 dark:text-slate-200'>
                {details.intro}
              </p>
            )}
          </header>
          <div className='grid gap-10 lg:grid-cols-2'>
            {detailSections.map((section, index) => (
              <section
                key={section.heading ?? index}
                className='space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/40'
              >
                <h3 className='text-xl font-semibold tracking-wide text-slate-900 dark:text-slate-100'>
                  {section.heading}
                </h3>
                {Array.isArray(section.body) &&
                  section.body.map((bodyParagraph, bodyIndex) => (
                    <p
                      key={bodyIndex}
                      className='text-base leading-7 text-slate-700 dark:text-slate-200'
                    >
                      {bodyParagraph}
                    </p>
                  ))}
              </section>
            ))}
          </div>
        </article>
      )}
    </section>
  );
}
