import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { buildPageMetadata, resolveLocale } from '@/lib/seo/seo';

type PageParams = { locale: string };

type ContentList = {
  title?: string;
  items?: string[];
};

type ContentSection = {
  heading: string;
  paragraphs?: string[];
  lists?: ContentList[];
};

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveLocale(locale);
  return buildPageMetadata({
    locale: resolvedLocale,
    pageKey: 'cookiePolicy',
    path: '/cookie-policy',
    imagePath: '/header_image.webp',
  });
}

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale = 'hu' } = await params;
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: 'CookiePolicy',
  });

  const intro = ensureArray<string>(t.raw('intro'));
  const sections = ensureArray<ContentSection>(t.raw('sections'));

  return (
    <div className='relative mx-auto mb-10 max-w-6xl px-4 pt-24 sm:px-6 sm:pt-28 md:pt-32 lg:px-8 lg:pt-36'>
      <h1 className='text-center text-3xl uppercase leading-tight tracking-wide text-transparent sm:text-4xl md:text-5xl lg:text-6xl'>
        <span className='bg-linear-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text'>
          {t('title')}
        </span>
      </h1>
      <p className='mt-2 text-center text-sm font-semibold uppercase text-muted-foreground'>
        {t('updated')}
      </p>

      {intro.length ? (
        <div className='mt-6 space-y-4 text-base leading-relaxed text-grey-dark-3 sm:text-lg'>
          {intro.map((paragraph, index) => (
            <p key={`cookie-intro-${index}`}>{paragraph}</p>
          ))}
        </div>
      ) : null}

      <div className='mt-10 space-y-10 text-base leading-relaxed text-grey-dark-3 sm:text-lg'>
        {sections.map((section, sectionIndex) => (
          <section
            key={`${section.heading}-${sectionIndex}`}
            className='space-y-4'
          >
            <h2 className='text-xl font-extrabold text-foreground sm:text-2xl'>
              {section.heading}
            </h2>

            {section.paragraphs?.map((paragraph, paragraphIndex) => (
              <p key={`${section.heading}-paragraph-${paragraphIndex}`}>
                {paragraph}
              </p>
            ))}

            {section.lists?.map((list, listIndex) => {
              const listItems = ensureArray<string>(list?.items);

              if (!listItems.length) {
                return null;
              }

              return (
                <div
                  key={`${section.heading}-list-${listIndex}`}
                  className='space-y-2'
                >
                  {list?.title ? (
                    <p className='font-semibold text-foreground'>
                      {list.title}
                    </p>
                  ) : null}
                  <ul className='list-disc pl-6 text-base sm:text-lg'>
                    {listItems.map((item, itemIndex) => (
                      <li
                        key={`${section.heading}-list-${listIndex}-item-${itemIndex}`}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
