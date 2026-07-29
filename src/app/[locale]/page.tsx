import type { Metadata } from 'next';
import { buildPageMetadata, resolveLocale } from '@/lib/seo/seo';
import HomeClient from './HomeClient';
import { getCarActions } from '@/lib/cars';

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

export default async function HomePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale } = await params;
  const actions = await getCarActions();

  const lanzaroteActions = actions.filter(
    (action) => action.island === 'lanzarote',
  );
  const fuerteventuraActions = actions.filter(
    (action) => action.island === 'fuerteventura',
  );

  return (
    <HomeClient
      locale={locale}
      actions={[fuerteventuraActions, lanzaroteActions]}
    />
  );
}
