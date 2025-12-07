import { JSONIdString } from '@/lib/jsonId/jsonld';
import { buildPageMetadata, getSiteUrl, resolveLocale } from '@/lib/seo/seo';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import { BlogPost } from './blog.type';

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
    pageKey: 'blog',
    path: '/blog',
    imagePath: '/header_image.webp',
  });
}

const accentGradients = [
  'from-sky-dark/80 via-sky-light/60 to-amber-dark/80',
  'from-amber-dark/70 via-sky-dark/60 to-amber-light/70',
  'from-sky-light/80 via-amber-light/60 to-sky-dark/70',
];

export default async function BlogPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale } = await params;
  const resolvedLocale = resolveLocale(locale);

  const [blogT, seoT] = await Promise.all([
    getTranslations({ locale: resolvedLocale, namespace: 'Blog' }),
    getTranslations({ locale: resolvedLocale, namespace: 'SEO' }),
  ]);

  const title = blogT('title');
  const intro = blogT('intro');
  const readMore = blogT('readMore');
  const brand = seoT('brand');

  const rawPosts = blogT.raw('posts') as unknown;
  const posts = Array.isArray(rawPosts)
    ? (rawPosts.filter((item): item is BlogPost => {
        if (!item || typeof item !== 'object') return false;
        const candidate = item as Partial<BlogPost>;
        return (
          typeof candidate.title === 'string' &&
          typeof candidate.excerpt === 'string' &&
          typeof candidate.category === 'string' &&
          typeof candidate.readTime === 'string' &&
          typeof candidate.publishDate === 'string'
        );
      }) as BlogPost[])
    : [];

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/${resolvedLocale}/blog`;

  const jsonLdString = JSONIdString({
    posts,
    locale: resolvedLocale,
    pageUrl,
    siteUrl,
    brand,
    title,
    description: intro,
  });

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />
      <section className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 lg:pt-40 pb-16'>
        <header className='text-center max-w-3xl mx-auto'>
          <h1 className='text-3xl uppercase sm:text-4xl md:text-5xl lg:text-6xl leading-tight tracking-wide md:tracking-[0.08em] bg-linear-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
            {title}
          </h1>
          <p className='mt-6 text-base md:text-lg text-grey-dark-3 dark:text-grey-dark-2'>
            {intro}
          </p>
        </header>
        <div className='mt-12 grid gap-6 sm:gap-8 md:grid-cols-2'>
          {posts.map((post, index) => {
            const href = post.slug
              ? `/${resolvedLocale}/blog/${post.slug}`
              : '';
            const gradient =
              accentGradients[index % accentGradients.length] ??
              accentGradients[0];
            const imageAlt = post.image?.alt ?? post.title;
            return (
              <article
                key={post.title}
                className='group relative flex h-full flex-col overflow-hidden rounded-3xl border border-grey-light-2/60 dark:border-grey-dark-2/50 bg-white/90 dark:bg-transparent backdrop-blur p-6 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:border-amber-light/40'
              >
                <span
                  className={`absolute left-6 right-6 top-0 h-1 rounded-b-full bg-linear-to-r ${gradient}`}
                  aria-hidden='true'
                />
                {post.image ? (
                  <div className='relative mt-4 aspect-4/3 overflow-hidden rounded-2xl border border-grey-light-2/60 dark:border-grey-dark-2/50 bg-grey-light-1/20 dark:bg-grey-dark-3/40'>
                    <Image
                      src={post.image.src}
                      alt={imageAlt}
                      fill
                      className='object-cover transition-transform duration-500 group-hover:scale-105'
                      sizes='(min-width: 1280px) 320px, (min-width: 1024px) 28vw, (min-width: 768px) 40vw, 90vw'
                    />
                  </div>
                ) : null}
                <div className='mt-6 flex flex-1 flex-col'>
                  <div className='text-xs font-semibold uppercase tracking-[0.35em] text-amber-dark/80 dark:text-amber-light/80'>
                    {post.category}
                  </div>
                  <div className='mt-4 space-y-4'>
                    <h2 className='text-2xl font-semibold text-sky-dark dark:text-grey-dark-1'>
                      {post.title}
                    </h2>
                    <p className='text-sm sm:text-base text-grey-dark-3 dark:text-grey-dark-2 leading-relaxed'>
                      {post.excerpt}
                    </p>
                  </div>
                  <div className='mt-6 flex flex-wrap items-center gap-3 text-sm text-grey-dark-2/90 dark:text-grey-dark-2/80'>
                    <span>{post.publishDate}</span>
                    <span className='text-grey-light-2/70 dark:text-grey-dark-3/60'>
                      /
                    </span>
                    <span>{post.readTime}</span>
                  </div>
                  {href ? (
                    <Link
                      href={href}
                      prefetch={false}
                      className='mt-8 inline-flex items-center gap-2 rounded-full border border-sky-dark/30 dark:border-amber-light/40 px-5 py-2 text-sm font-medium text-sky-dark dark:text-amber-light transition-colors hover:border-sky-dark hover:bg-sky-dark/10 dark:hover:border-amber-light dark:hover:bg-amber-light/10'
                      aria-label={`${readMore}: ${post.title}`}
                    >
                      {readMore}
                      <span aria-hidden='true'>→</span>
                    </Link>
                  ) : (
                    <span className='mt-8 inline-flex items-center gap-2 rounded-full border border-grey-light-2/40 px-5 py-2 text-sm font-medium text-grey-dark-2/80'>
                      {readMore}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
