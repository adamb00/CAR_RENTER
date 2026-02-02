import {
  BLOG_POSTS,
  getLocalesForPost,
  getPostDefinitionBySlug,
  getSlugForLocale,
  isLocaleSupportedForPost,
} from '@/lib/blog/registry';

import { getSiteUrl, resolveLocale } from '@/lib/seo/seo';
import { DEFAULT_LOCALE, LOCALES } from '@/i18n/config';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { BlogPostData, BlogPostMeta, BlogSummaryPost } from '../blog.type';

type PageParams = { locale: string; slug: string };

const isBlogSummaryPost = (value: unknown): value is BlogSummaryPost => {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as Partial<BlogSummaryPost>;
  return typeof maybe.slug === 'string';
};

export async function generateStaticParams() {
  return BLOG_POSTS.flatMap((post) =>
    getLocalesForPost(post).map((locale) => ({
      locale,
      slug: getSlugForLocale(post, locale),
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const { locale, slug } = resolvedParams;
  const resolvedLocale = resolveLocale(locale);

  const postDefinition = getPostDefinitionBySlug(slug);
  if (!postDefinition || !isLocaleSupportedForPost(postDefinition, resolvedLocale)) {
    return {};
  }

  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: 'BlogPosts',
  });

  const rawMeta = t.raw(`${postDefinition.id}.meta`) as
    | BlogPostMeta
    | undefined;
  if (!rawMeta) {
    return {};
  }

  const siteUrl = getSiteUrl();
  const slugForLocale = getSlugForLocale(postDefinition, resolvedLocale);
  const canonical =
    rawMeta.canonical ?? `${siteUrl}/${resolvedLocale}/blog/${slugForLocale}`;
  const ogImageSrc = rawMeta.image?.src ?? '/header_image.webp';
  const ogImageAlt = rawMeta.image?.alt ?? rawMeta.title;

  return {
    title: rawMeta.title,
    description: rawMeta.description,
    keywords: rawMeta.keywords,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [
          loc,
          `${siteUrl}/${loc}/blog/${getSlugForLocale(postDefinition, loc)}`,
        ])
      ),
    },
    openGraph: {
      type: 'article',
      locale: resolvedLocale,
      url: `${siteUrl}/${resolvedLocale}/blog/${slugForLocale}`,
      title: rawMeta.title,
      description: rawMeta.description,
      images: [
        {
          url: `${siteUrl}${ogImageSrc}`,
          width: 1200,
          height: 630,
          alt: ogImageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: rawMeta.title,
      description: rawMeta.description,
      images: [`${siteUrl}${ogImageSrc}`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const resolvedParams = await params;
  const { locale = DEFAULT_LOCALE, slug } = resolvedParams;
  const resolvedLocale = resolveLocale(locale);

  const postDefinition = getPostDefinitionBySlug(slug);
  if (!postDefinition || !isLocaleSupportedForPost(postDefinition, resolvedLocale)) {
    notFound();
  }

  const Component = postDefinition.component;

  const [blogPostTranslations, blogListTranslations] = await Promise.all([
    getTranslations({
      locale: resolvedLocale,
      namespace: 'BlogPosts',
    }),
    getTranslations({
      locale: resolvedLocale,
      namespace: 'Blog',
    }),
  ]);

  const rawPost = blogPostTranslations.raw(postDefinition.id) as
    | BlogPostData
    | undefined;

  if (!rawPost) {
    notFound();
  }

  const basePost: BlogPostData = {
    ...rawPost,
    backToBlog: rawPost.backToBlog ?? blogPostTranslations('backToBlog'),
  };

  let enrichedPost = basePost;

  try {
    const rawList = blogListTranslations.raw('posts') as unknown;
    if (Array.isArray(rawList)) {
      const summaryPosts = rawList.filter(isBlogSummaryPost);
      const matched = summaryPosts.find((item) => item.slug === slug);
      if (matched) {
        enrichedPost = {
          ...basePost,
          hero: {
            ...basePost.hero,
            title: matched.title ?? basePost.hero.title,
            category:
              basePost.hero.category ??
              matched.category ??
              basePost.hero.category,
          },
        };
      }
    }
  } catch {
    enrichedPost = basePost;
  }

  return <Component locale={resolvedLocale} slug={slug} post={enrichedPost} />;
}
