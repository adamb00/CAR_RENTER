import type { Metadata } from 'next';
import { buildPageMetadata, resolveLocale } from '@/lib/seo';
import HomeClient from './HomeClient';

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
    pageKey: 'home',
    path: '',
    imagePath: '/header_image.webp',
  });
}

export default function HomePage() {
  return <HomeClient />;
}
