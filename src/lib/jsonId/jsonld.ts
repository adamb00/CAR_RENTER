import type {
  BlogPost,
  BlogPostData,
} from '../../app/[locale]/blog/blog.type';
import { escapeForJson } from '../escapeForJson';
import {
  BlogPostingStructuredData,
  BlogStructuredData,
  BuildBlogJsonLdOptions,
  BuildBlogPostsJsonLdOptions,
  BuildFaqJsonLdOptions,
  BuildBlogPostJsonLdOptions,
} from './jsonId.types';

export function buildBlogPostsJsonLd({
  posts,
  locale,
  pageUrl,
  siteUrl,
  brand,
  fallbackImagePath = '/header_image.webp',
}: BuildBlogPostsJsonLdOptions): BlogPostingStructuredData[] {
  const normalizedPageUrl = pageUrl.endsWith('/')
    ? pageUrl.slice(0, -1)
    : pageUrl;
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '');

  return posts
    .filter((post): post is BlogPost & { slug: string } => {
      return typeof post.slug === 'string' && post.slug.length > 0;
    })
    .map((post, index) => {
      const slug = post.slug!;
      const url = `${normalizedPageUrl}/${slug}`;
      const isoDate = post.publishDateISO ?? post.publishDate;
      const imagePath = post.image?.src ?? fallbackImagePath;
      const imageUrl = imagePath.startsWith('http')
        ? imagePath
        : `${normalizedSiteUrl}${imagePath}`;

      return {
        '@type': 'BlogPosting',
        '@id': `${url}#blogPosting`,
        position: index + 1,
        headline: post.title,
        description: post.excerpt,
        datePublished: isoDate,
        dateModified: isoDate,
        inLanguage: locale,
        mainEntityOfPage: url,
        image: {
          '@type': 'ImageObject',
          url: imageUrl,
          caption: post.image?.alt ?? post.title,
        },
        author: {
          '@type': 'Organization',
          name: brand,
        },
        publisher: {
          '@type': 'Organization',
          name: brand,
          url: normalizedSiteUrl,
          logo: {
            '@type': 'ImageObject',
            url: `${normalizedSiteUrl}/logo_white.png`,
          },
        },
      };
    });
}

export function JSONIdString({
  title,
  description,
  ...options
}: BuildBlogJsonLdOptions): BlogStructuredData {
  const posts = buildBlogPostsJsonLd(options);
  const normalizedPageUrl = options.pageUrl.endsWith('/')
    ? options.pageUrl.slice(0, -1)
    : options.pageUrl;

  const blogJsonId = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${normalizedPageUrl}#blog`,
    name: title,
    description,
    inLanguage: options.locale,
    url: normalizedPageUrl,
    blogPost: posts,
  };

  return escapeForJson(
    JSON.stringify(blogJsonId, null, 2)
  ) as unknown as BlogStructuredData;
}

export function buildFaqJsonLdString({
  locale,
  pageUrl,
  items,
}: BuildFaqJsonLdOptions) {
  const normalizedPageUrl = pageUrl.endsWith('/')
    ? `${pageUrl.slice(0, -1)}#faq`
    : `${pageUrl}#faq`;

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': normalizedPageUrl,
    inLanguage: locale,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return escapeForJson(JSON.stringify(faqJsonLd, null, 2));
}

export function buildBlogPostJsonLdString({
  locale,
  siteUrl,
  slug,
  post,
}: BuildBlogPostJsonLdOptions) {
  const postUrl = `${siteUrl}/${locale}/blog/${slug}`;
  const imageUrl = `${siteUrl}${post.meta.image?.src ?? '/header_image.webp'}`;
  const articleBody = post.sections
    .flatMap((section) => section.paragraphs)
    .join('\n\n');

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

  return escapeForJson(JSON.stringify(jsonLd, null, 2));
}
