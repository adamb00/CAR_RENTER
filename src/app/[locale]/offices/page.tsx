import { QuoteRequestForm } from '@/components/contact/QuoteRequestForm';
import { resolveLocale, buildPageMetadata } from '@/lib/seo/seo';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

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
    pageKey: 'offices',
    path: '/offices',
    imagePath: '/header_image.webp',
  });
}

export default async function OfficesPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale = 'hu' } = await params;
  const resolvedLocale = resolveLocale(locale);
  const [tPages, tContact, tGeneralRental] = await Promise.all([
    getTranslations({ locale: resolvedLocale, namespace: 'Pages' }),
    getTranslations({ locale: resolvedLocale, namespace: 'Contact' }),
    getTranslations({ locale: resolvedLocale, namespace: 'GeneralRental' }),
  ]);

  const officesMeta = tPages.raw('offices') as {
    title: string;
    description?: string;
  };
  const schedule = tGeneralRental.raw('schedule') as Record<string, string>;
  const scheduleItems = Object.entries(schedule)
    .filter(([key]) => key.startsWith('i'))
    .map(([, value]) => value);

  return (
    <>
      <section className='relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 lg:pt-40'>
        <h1 className='text-3xl uppercase sm:text-4xl md:text-5xl lg:text-6xl leading-tight tracking-wider md:tracking-[0.08em] text-center bg-linear-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
          {officesMeta.title}
        </h1>
        {officesMeta.description ? (
          <p className='mt-4 text-base md:text-lg text-grey-dark-3 dark:text-grey-dark-2 text-center max-w-3xl mx-auto'>
            {officesMeta.description}
          </p>
        ) : null}

        <div className='mt-10 grid gap-6 lg:grid-cols-2'>
          <div className='rounded-3xl border border-grey-light-2/60 dark:border-grey-dark-2/40 bg-white/90 dark:bg-transparent backdrop-blur p-6 shadow-sm'>
            <h2 className='text-2xl font-semibold text-sky-dark dark:text-amber-light'>
              {tContact('title')}
            </h2>
            <p className='mt-4 text-sm sm:text-base text-grey-dark-3 dark:text-grey-dark-2'>
              {tContact.rich('p1', {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
            <p className='mt-3 text-sm sm:text-base text-grey-dark-3 dark:text-grey-dark-2'>
              {tContact.rich('p2', {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          </div>

          <div className='rounded-3xl border border-grey-light-2/60 dark:border-grey-dark-2/40 bg-white/90 dark:bg-transparent backdrop-blur p-6 shadow-sm'>
            <h2 className='text-2xl font-semibold text-sky-dark dark:text-amber-light'>
              {schedule.title}
            </h2>
            <ul className='mt-4 space-y-2 text-sm sm:text-base text-grey-dark-3 dark:text-grey-dark-2 list-disc list-inside'>
              {scheduleItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <QuoteRequestForm locale={resolvedLocale} />
    </>
  );
}
