import { buildPageMetadata, getSiteUrl, resolveLocale } from '@/lib/seo';
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
    pageKey: 'faq',
    path: '/faq',
    imagePath: '/header_image.webp',
  });
}

type FaqItem = {
  question: string;
  answer: string;
};

const escapeForJson = (value: string) =>
  value
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

export default async function FAQPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale = 'hu' } = await params;
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({ locale: resolvedLocale, namespace: 'FAQ' });

  const items = t.raw('items') as FaqItem[];
  const title = t('title');
  const intro = t('intro');

  const siteUrl = getSiteUrl();
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${siteUrl}/${resolvedLocale}/faq#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  const jsonLdString = escapeForJson(JSON.stringify(faqJsonLd, null, 2));

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />
      <section className='relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 lg:pt-40 mb-10'>
        <h1 className='text-3xl uppercase sm:text-4xl md:text-5xl lg:text-6xl leading-tight tracking-wide md:tracking-[0.08em] text-center bg-gradient-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
          {title}
        </h1>
        <p className='mt-6 text-base md:text-lg text-grey-dark-3 text-center max-w-3xl mx-auto'>
          {intro}
        </p>
        <dl className='mt-12 space-y-8'>
          {items.map((item) => (
            <div
              key={item.question}
              className='rounded-2xl border border-grey-light-2/50 dark:border-grey-dark-2/40 bg-white/80 dark:bg-grey-dark-3/60 backdrop-blur px-5 py-6 sm:px-6 sm:py-8 shadow-sm'
            >
              <dt className='text-lg sm:text-xl font-semibold text-sky-dark dark:text-amber-light'>
                {item.question}
              </dt>
              <dd className='mt-3 text-sm sm:text-base text-grey-dark-3 dark:text-grey-light-1 leading-relaxed'>
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
