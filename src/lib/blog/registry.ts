import Post_1 from '@/components/blog/post_1';
import Post_2 from '@/components/blog/post_2';
import type { Locale } from '@/i18n/config';
import type { BlogPostRenderer } from '@/lib/blog/types';
import type { BlogSlugDefinition } from '@/lib/blog/slugs';
import {
  BLOG_SLUGS,
  getSlugForLocale as getSlugForLocaleBase,
  resolveLocalizedSlug,
} from '@/lib/blog/slugs';

export type BlogPostDefinition = BlogSlugDefinition & {
  component: BlogPostRenderer;
};

const COMPONENT_MAP: Record<string, BlogPostRenderer> = {
  'fuerteventura-latnivalok-autoval': Post_1,
  'fuerteventura-visszatero-aramlat-biztonsagos-furdozes': Post_2,
};

export const BLOG_POSTS: BlogPostDefinition[] = BLOG_SLUGS.map((definition) => {
  const component = COMPONENT_MAP[definition.id];
  if (!component) {
    throw new Error(`Missing component for blog post id "${definition.id}"`);
  }
  return {
    ...definition,
    component,
  };
});

const SLUG_TO_POST = BLOG_POSTS.reduce<Record<string, BlogPostDefinition>>(
  (acc, post) => {
    const variants = new Set<string>([
      post.fallbackSlug,
      ...Object.values(post.slugs),
    ]);
    variants.forEach((variant) => {
      if (variant) {
        acc[variant] = post;
      }
    });
    return acc;
  },
  {}
);

export const getPostDefinitionBySlug = (slug: string) => SLUG_TO_POST[slug];

export const getSlugForLocale = (post: BlogPostDefinition, locale: Locale) =>
  getSlugForLocaleBase(post, locale);

export { resolveLocalizedSlug };

export const getRendererBySlug = (
  slug: string
): BlogPostRenderer | undefined => {
  const def = getPostDefinitionBySlug(slug);
  return def?.component;
};

export type { BlogPostComponentProps } from '@/lib/blog/types';
