import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { buildPageMetadata, resolveLocale } from '@/lib/seo';

type GTCList = {
  type?: 'ordered' | 'unordered';
  title?: string;
  items?: string[];
};

type GTCSection = {
  heading: string;
  paragraphs?: string[];
  lists?: GTCList[];
  notes?: string[];
};

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
    pageKey: 'gtc',
    path: '/gtc',
    imagePath: '/header_image.webp',
  });
}

export default async function GTCPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale = 'hu' } = await params;
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({ locale: resolvedLocale, namespace: 'GTC' });
  const rawSections = t.raw('sections');
  const sections: GTCSection[] = Array.isArray(rawSections)
    ? (rawSections as GTCSection[])
    : [];

  return (
    <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 lg:pt-40 mb-10'>
      <h1 className='text-3xl uppercase sm:text-4xl md:text-5xl lg:text-6xl leading-relaxed tracking-wide md:tracking-[0.1em] text-center bg-gradient-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
        {t('title')}
      </h1>

      <div className='mt-8 sm:mt-10 text-grey-dark-3 text-base sm:text-lg leading-relaxed space-y-10'>
        {sections.map((section, sectionIndex) => (
          <section
            key={`${section.heading}-${sectionIndex}`}
            className='space-y-4'
          >
            <h2 className='text-xl sm:text-2xl font-extrabold'>
              {section.heading}
            </h2>

            {section.paragraphs?.map((paragraph, paragraphIndex) => (
              <p key={`${section.heading}-paragraph-${paragraphIndex}`}>
                {paragraph}
              </p>
            ))}

            {section.lists?.map((list, listIndex) => {
              const listItems = Array.isArray(list.items) ? list.items : [];
              const isOrdered = list.type === 'ordered';

              if (!listItems.length) {
                return null;
              }

              return (
                <div
                  key={`${section.heading}-list-${listIndex}`}
                  className='space-y-2'
                >
                  {list.title ? (
                    <p className='font-semibold'>{list.title}</p>
                  ) : null}

                  {isOrdered ? (
                    <ol className='list-decimal pl-6 space-y-2'>
                      {listItems.map((item, itemIndex) => (
                        <li
                          key={`${section.heading}-list-${listIndex}-item-${itemIndex}`}
                        >
                          {item}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <ul className='list-disc pl-6 space-y-2'>
                      {listItems.map((item, itemIndex) => (
                        <li
                          key={`${section.heading}-list-${listIndex}-item-${itemIndex}`}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}

            {section.notes?.map((note, noteIndex) => (
              <p
                key={`${section.heading}-note-${noteIndex}`}
                className='text-sm text-muted-foreground italic'
              >
                {note}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
