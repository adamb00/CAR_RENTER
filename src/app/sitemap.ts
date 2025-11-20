import type { MetadataRoute } from 'next';
import { LOCALES } from '@/i18n/config';
import { getCars } from '@/lib/cars';

const HOST = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zodiacsrentacar.com'
).replace(/\/$/, '');

const STATIC_PATHS = [
  '/',
  '/cars',
  '/about-us',
  '/faq',
  '/contact',
  '/insurance',
  '/general-rental-conditions',
  '/gtc',
  '/rental-requirements',
  '/offices',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const cars = await getCars();

  const staticEntries = STATIC_PATHS.flatMap((path) =>
    LOCALES.map((locale) => {
      const urlPath = `${locale}${path === '/' ? '' : path}`;
      return {
        url: `${HOST}/${urlPath}`,
        changeFrequency: 'monthly' as const,
        priority: path === '/' ? 1 : 0.7,
        lastModified: now,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [l, `${HOST}/${l}${path === '/' ? '' : path}`])
          ),
        },
      };
    })
  );

  const carDetailEntries = cars.flatMap((car) =>
    LOCALES.map((locale) => {
      const path = `/cars/${car.id}`;
      return {
        url: `${HOST}/${locale}${path}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        lastModified: now,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [
              l,
              `${HOST}/${l}${path}`,
            ])
          ),
        },
      };
    })
  );

  const rentEntries = cars.flatMap((car) =>
    LOCALES.map((locale) => {
      const path = `/cars/${car.id}/rent`;
      return {
        url: `${HOST}/${locale}${path}`,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
        lastModified: now,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [l, `${HOST}/${l}${path}`])
          ),
        },
      };
    })
  );

  return [...staticEntries, ...carDetailEntries, ...rentEntries];
}
