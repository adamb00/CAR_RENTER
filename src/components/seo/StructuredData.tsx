'use server';

import { Locale } from '@/i18n/config';
import { getSiteUrl } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';

const CONTACT_EMAIL = 'info@zodiacsrentacar.com';
const CONTACT_PHONE = '+34 683 192 422';

const ADDRESS = {
  streetAddress: 'Calle Juan de Austria 111',
  addressLocality: 'Puerto del Rosario',
  addressRegion: 'Las Palmas',
  postalCode: '35600',
  addressCountry: 'ES',
};

type StructuredDataProps = {
  locale: Locale;
};

export async function StructuredData({ locale }: StructuredDataProps) {
  const t = await getTranslations({ locale, namespace: 'SEO' });
  const siteUrl = getSiteUrl();

  const graph = [
    {
      '@type': 'AutoRental',
      '@id': `${siteUrl}/#organization`,
      name: t('brand'),
      url: siteUrl,
      description: t('siteDescription'),
      image: `${siteUrl}/header_image.webp`,
      logo: `${siteUrl}/logo_white.png`,
      email: process.env.CONTACT_EMAIL || CONTACT_EMAIL,
      telephone: process.env.CONTACT_PHONE || CONTACT_PHONE,
      address: {
        '@type': 'PostalAddress',
        ...ADDRESS,
      },
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          telephone: process.env.CONTACT_PHONE || CONTACT_PHONE,
          email: process.env.CONTACT_EMAIL || CONTACT_EMAIL,
          availableLanguage: ['hu', 'es'],
        },
      ],
      areaServed: [
        { '@type': 'Place', name: 'Fuerteventura' },
        { '@type': 'Place', name: 'Lanzarote' },
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: t('brand'),
      url: siteUrl,
      inLanguage: locale,
      description: t('siteDescription'),
    },
  ];

  const payload = {
    '@context': 'https://schema.org',
    '@graph': graph,
  };

  const jsonLd = JSON.stringify(payload, null, 2)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: jsonLd }}
    />
  );
}
