import type { MetadataRoute } from 'next';

const HOST = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zodiacsrentacar.com'
).replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: [`${HOST}/sitemap.xml`],
    host: HOST,
  };
}
