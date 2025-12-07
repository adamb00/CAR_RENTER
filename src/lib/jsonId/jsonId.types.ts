import type { Locale } from '@/i18n/config';

import type { BlogPost, BlogPostData } from '../../app/[locale]/blog/blog.type';
export type BlogPostingStructuredData = {
  '@type': 'BlogPosting';
  '@id': string;
  position: number;
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  inLanguage: Locale;
  mainEntityOfPage: string;
  image: {
    '@type': 'ImageObject';
    url: string;
    caption: string;
  };
  author: {
    '@type': 'Organization';
    name: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    url: string;
    logo: {
      '@type': 'ImageObject';
      url: string;
    };
  };
};

export type BuildBlogPostsJsonLdOptions = {
  posts: BlogPost[];
  locale: Locale;
  pageUrl: string;
  siteUrl: string;
  brand: string;
  fallbackImagePath?: string;
};

export type BlogStructuredData = {
  '@context': 'https://schema.org';
  '@type': 'Blog';
  '@id': string;
  name: string;
  description: string;
  inLanguage: Locale;
  url: string;
  blogPost: BlogPostingStructuredData[];
};

export type BuildBlogJsonLdOptions = BuildBlogPostsJsonLdOptions & {
  title: string;
  description: string;
};

export type BuildBlogPostJsonLdOptions = {
  locale: Locale;
  siteUrl: string;
  slug: string;
  post: BlogPostData;
};

export type FaqJsonLdItem = {
  question: string;
  answer: string;
};

export type BuildFaqJsonLdOptions = {
  locale: Locale;
  pageUrl: string;
  items: FaqJsonLdItem[];
};
