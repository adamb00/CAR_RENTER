import type { Locale } from '@/i18n/config';
import type { ReactElement } from 'react';

export type BlogPostMeta = {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  image?: {
    src: string;
    alt?: string;
  };
};

export type BlogPostData = {
  meta: BlogPostMeta;
  hero: {
    icon?: string;
    category: string;
    title?: string;
    subtitle: string;
    description?: string;
    publishDate: string;
    publishDateISO: string;
    readingTime: string;
    author: string;
  };
  sections: Array<{
    id: string;
    icon?: string;
    title: string;
    paragraphs: string[];
    access?: {
      title: string;
      description: string;
    };
    links?: Array<{
      label: string;
      href: string;
    }>;
    highlights?: {
      title: string;
      items: Array<{
        label: string;
        href: string;
      }>;
    };
    tip?: {
      title: string;
      description: string;
    };
    bullets?: string[];
    closing?: string;
  }>;
  cta: {
    title: string;
    paragraphs: string[];
    buttons: Array<{
      label: string;
      href: string;
    }>;
  };
  backToBlog: string;
};

export type BlogPostComponentProps = {
  locale: Locale;
  slug: string;
  post: BlogPostData;
};

export type BlogPostRenderer = (
  props: BlogPostComponentProps
) => ReactElement;
