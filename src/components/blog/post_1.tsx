import { BlogImage } from '@/components/blog/BlogImage';
import { type BlogPostComponentProps } from '@/lib/blog/types';
import { getSiteUrl } from '@/lib/seo';
import { Locale } from '@/i18n/config';
import Link from 'next/link';

type ResolvedLink = {
  href: string;
  label: string;
};

const resolveHref = (href: string, locale: Locale): string =>
  href.includes('{locale}') ? href.replace('{locale}', locale) : href;

const isExternal = (href: string) => href.startsWith('http');

const toResolvedLink = (link: ResolvedLink, locale: Locale): ResolvedLink => ({
  ...link,
  href: resolveHref(link.href, locale),
});

const escapeForJson = (value: string) =>
  value
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

const fallbackTitleFromSlug = (slug: string) =>
  slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const HERO_IMAGE = {
  src: '/DSC00594.jpg',
  alt: 'Atlantic coastline and golden dunes in Fuerteventura at sunset',
};

const SECTION_IMAGES: Record<
  string,
  Array<{ src: string; alt: string; caption?: string }>
> = {
  betancuria: [
    {
      src: '/BETANCURIA.jpg',
      alt: 'Panoramic view of Betancuria and the surrounding mountains',
    },
  ],
  ajuy: [
    {
      src: '/AJUY.jpg',
      alt: 'Cliffs and black sand beach of Ajuy in Fuerteventura',
    },
    {
      src: '/AJUY2.jpg',
      alt: 'Walking trail leading to the Ajuy sea caves above the Atlantic',
    },
  ],
};

export default function Post_1({ locale, slug, post }: BlogPostComponentProps) {
  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}/${locale}/blog/${slug}`;
  const imageUrl = `${siteUrl}${post.meta.image?.src ?? '/header_image.webp'}`;
  const articleBody = post.sections
    .flatMap((section) => section.paragraphs)
    .join('\n\n');

  const heroTitle = post.hero.title ?? fallbackTitleFromSlug(slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.meta.title,
    description: post.meta.description,
    datePublished: post.hero.publishDateISO,
    dateModified: post.hero.publishDateISO,
    inLanguage: locale,
    author: {
      '@type': 'Organization',
      name: post.hero.author,
    },
    publisher: {
      '@type': 'Organization',
      name: post.hero.author,
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo_white.png`,
      },
    },
    image: {
      '@type': 'ImageObject',
      url: imageUrl,
      caption: post.meta.image?.alt ?? post.meta.title,
    },
    mainEntityOfPage: postUrl,
    url: postUrl,
    articleSection: post.hero.category,
    articleBody,
  };

  const jsonLdString = escapeForJson(JSON.stringify(jsonLd, null, 2));
  const backHref = `/${locale}/blog`;

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />
      <article className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 lg:pt-36 pb-20'>
        <div className='flex justify-between'>
          <Link
            href={backHref}
            prefetch={false}
            className='inline-flex items-center gap-2 text-sm font-medium text-sky-dark dark:text-amber-light transition-colors hover:text-sky-dark/80 dark:hover:text-amber-light/80'
          >
            <span aria-hidden='true'>←</span>
            {post.backToBlog}
          </Link>
          <div className='text-xs font-semibold uppercase tracking-[0.35em] text-amber-dark/80 dark:text-amber-light/80'>
            {post.hero.category}
          </div>
        </div>
        <header className='mt-8'>
          <h1 className='mt-4 flex items-center gap-3 text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight text-sky-dark dark:text-grey-light-1'>
            {/* {post.hero.icon ? (
              <span className='text-4xl sm:text-5xl md:text-6xl leading-none'>
                {post.hero.icon}
              </span>
            ) : null} */}
            <span className='inline-block bg-gradient-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
              {heroTitle}
            </span>
          </h1>
          <p className='mt-6 text-base sm:text-lg text-grey-dark-3 dark:text-grey-light-2'>
            {post.hero.subtitle}
          </p>
          {post.hero.description ? (
            <p className='mt-4 text-sm sm:text-base text-grey-dark-2/90 dark:text-grey-light-2/90'>
              {post.hero.description}
            </p>
          ) : null}
          <div className='mt-6 flex flex-wrap items-center gap-4 text-sm text-grey-dark-2/80 dark:text-grey-light-2/70'>
            <span>{post.hero.publishDate}</span>
            <span className='hidden sm:block text-grey-light-2/70 dark:text-grey-light-3/60'>
              •
            </span>
            <span>{post.hero.readingTime}</span>
            <span className='hidden sm:block text-grey-light-2/70 dark:text-grey-light-3/60'>
              •
            </span>
            <span>{post.hero.author}</span>
          </div>
          <BlogImage
            src={HERO_IMAGE.src}
            alt={HERO_IMAGE.alt}
            className='mt-10'
            priority
          />
        </header>

        <div className='mt-12 space-y-16'>
          {post.sections.map((section) => {
            const resolvedLinks = section.links?.map((link) =>
              toResolvedLink(link, locale)
            );
            const imagesForSection = SECTION_IMAGES[section.id] ?? [];
            return (
              <section key={section.id} aria-labelledby={`${section.id}-title`}>
                <div className='space-y-6'>
                  <div className='flex items-start gap-3'>
                    {/* {section.icon ? (
                      <span className='text-2xl sm:text-3xl leading-none'>
                        {section.icon}
                      </span>
                    ) : null} */}
                    <h2
                      id={`${section.id}-title`}
                      className='text-2xl sm:text-3xl font-semibold text-sky-dark dark:text-grey-light-1 leading-snug'
                    >
                      {section.title}
                    </h2>
                  </div>
                  <div className='space-y-4 text-base text-grey-dark-3 dark:text-grey-light-2 leading-relaxed'>
                    {section.paragraphs.map((paragraph, index) => (
                      <p
                        key={`${section.id}-paragraph-${index}`}
                        dangerouslySetInnerHTML={{ __html: paragraph }}
                      />
                    ))}
                  </div>
                  {imagesForSection.length > 0 ? (
                    <div
                      className={
                        imagesForSection.length > 1
                          ? 'grid gap-5 sm:grid-cols-2'
                          : 'space-y-5'
                      }
                    >
                      {imagesForSection.map((image, index) => (
                        <BlogImage
                          key={`${section.id}-image-${index}`}
                          src={image.src}
                          alt={image.alt}
                          caption={image.caption}
                          className='mt-2'
                        />
                      ))}
                    </div>
                  ) : null}
                  {section.access ? (
                    <div className='rounded-2xl border border-grey-light-2/60 dark:border-grey-dark-2/50 bg-white/80 dark:bg-grey-dark-3/60 backdrop-blur px-5 py-4 sm:px-6 sm:py-5 text-sm sm:text-base text-grey-dark-2 dark:text-grey-light-2'>
                      <h3 className='font-semibold text-sky-dark dark:text-amber-light'>
                        {section.access.title}
                      </h3>
                      <p className='mt-2 leading-relaxed'>
                        {section.access.description}
                      </p>
                    </div>
                  ) : null}
                  {resolvedLinks && resolvedLinks.length > 0 ? (
                    <div className='flex flex-wrap gap-3'>
                      {resolvedLinks.map((link) =>
                        isExternal(link.href) ? (
                          <a
                            key={link.label}
                            href={link.href}
                            target='_blank'
                            rel='noreferrer noopener'
                            className='inline-flex items-center gap-2 rounded-full border border-sky-dark/30 dark:border-amber-light/40 px-4 py-2 text-sm font-medium text-sky-dark dark:text-amber-light transition-colors hover:border-sky-dark hover:bg-sky-dark/10 dark:hover:border-amber-light dark:hover:bg-amber-light/10'
                          >
                            {link.label}
                            <span aria-hidden='true'>↗</span>
                          </a>
                        ) : (
                          <Link
                            key={link.label}
                            href={link.href}
                            prefetch={false}
                            className='inline-flex items-center gap-2 rounded-full border border-sky-dark/30 dark:border-amber-light/40 px-4 py-2 text-sm font-medium text-sky-dark dark:text-amber-light transition-colors hover:border-sky-dark hover:bg-sky-dark/10 dark:hover:border-amber-light dark:hover:bg-amber-light/10'
                          >
                            {link.label}
                            <span aria-hidden='true'>→</span>
                          </Link>
                        )
                      )}
                    </div>
                  ) : null}
                  {section.highlights ? (
                    <div className='rounded-2xl bg-sky-light/10 dark:bg-grey-dark-3/60 border border-sky-light/30 dark:border-grey-dark-2/60 px-5 py-5 sm:px-6 sm:py-6'>
                      <h3 className='text-sm font-semibold uppercase tracking-[0.25em] text-sky-dark/80 dark:text-amber-light/80'>
                        {section.highlights.title}
                      </h3>
                      <ul className='mt-4 space-y-2 text-sm sm:text-base leading-relaxed text-grey-dark-3 dark:text-grey-light-2'>
                        {section.highlights.items.map((item) => (
                          <li key={item.label}>
                            <a
                              href={item.href}
                              target='_blank'
                              rel='noreferrer noopener'
                              className='inline-flex items-center gap-2 text-sky-dark dark:text-amber-light hover:underline'
                            >
                              {item.label}
                              <span aria-hidden='true'>↗</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {section.tip ? (
                    <div className='rounded-2xl border border-amber-dark/30 dark:border-amber-light/40 bg-amber-light/10 dark:bg-amber-dark/20 px-5 py-4 sm:px-6 sm:py-5 text-sm sm:text-base text-grey-dark-3 dark:text-grey-light-2'>
                      <h3 className='font-semibold text-amber-dark dark:text-amber-light'>
                        {section.tip.title}
                      </h3>
                      <p
                        className='mt-2 leading-relaxed'
                        dangerouslySetInnerHTML={{
                          __html: section.tip.description,
                        }}
                      />
                    </div>
                  ) : null}
                  {section.bullets ? (
                    <ul className='list-disc list-inside space-y-2 text-base text-grey-dark-3 dark:text-grey-light-2 leading-relaxed'>
                      {section.bullets.map((item, index) => (
                        <li key={`${section.id}-bullet-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {section.closing ? (
                    <p className='text-base text-grey-dark-2 dark:text-grey-light-2 leading-relaxed'>
                      {section.closing}
                    </p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>

        <section className='mt-20'>
          <div className='rounded-3xl border border-grey-light-2/60 dark:border-grey-dark-2/50 bg-white/90 dark:bg-grey-dark-3/70 backdrop-blur px-6 py-8 sm:px-8 sm:py-10 shadow-sm'>
            <h2 className='text-2xl sm:text-3xl font-semibold text-sky-dark dark:text-grey-light-1'>
              {post.cta.title}
            </h2>
            <div className='mt-4 space-y-3 text-base text-grey-dark-3 dark:text-grey-light-2 leading-relaxed'>
              {post.cta.paragraphs.map((paragraph, index) => (
                <p
                  key={`cta-paragraph-${index}`}
                  dangerouslySetInnerHTML={{ __html: paragraph }}
                />
              ))}
            </div>
            <div className='mt-6 flex flex-wrap gap-3'>
              {post.cta.buttons.map((button) => {
                const resolved = toResolvedLink(button, locale);
                const external = isExternal(resolved.href);
                const sharedClasses =
                  'inline-flex items-center gap-2 rounded-full border border-sky-dark/30 dark:border-amber-light/40 px-5 py-2 text-sm font-medium transition-colors';
                if (external) {
                  return (
                    <a
                      key={button.label}
                      href={resolved.href}
                      target='_blank'
                      rel='noreferrer noopener'
                      className={`${sharedClasses} text-sky-dark dark:text-amber-light hover:border-sky-dark hover:bg-sky-dark/10 dark:hover:border-amber-light dark:hover:bg-amber-light/10`}
                    >
                      {button.label}
                      <span aria-hidden='true'>↗</span>
                    </a>
                  );
                }

                return (
                  <Link
                    key={button.label}
                    href={resolved.href}
                    prefetch={false}
                    className={`${sharedClasses} text-sky-dark dark:text-amber-light hover:border-sky-dark hover:bg-sky-dark/10 dark:hover:border-amber-light dark:hover:bg-amber-light/10`}
                  >
                    {button.label}
                    <span aria-hidden='true'>→</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </article>
    </>
  );
}
