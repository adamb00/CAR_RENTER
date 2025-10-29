import React from 'react';
import type { Metadata } from 'next';
import { buildPageMetadata, resolveLocale } from '@/lib/seo';

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
    pageKey: 'offices',
    path: '/offices',
    imagePath: '/header_image.webp',
  });
}

export default function page() {
  return <div>page</div>;
}
