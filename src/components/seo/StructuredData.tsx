'use server';

import { Locale } from '@/i18n/config';
import { getSiteUrl } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';

const CONTACT_EMAIL = 'info@zodiacsrentacar.com';
const CONTACT_PHONE = '+34 683 192 422';

const LOCATIONS = [
  {
    id: 'fuerteventura-office',
    name: 'Zodiacs Rent a Car – Fuerteventura',
    streetAddress: 'Calle Juan de Austria 111',
    addressLocality: 'Puerto del Rosario',
    addressRegion: 'Las Palmas',
    postalCode: '35600',
    addressCountry: 'ES',
    latitude: 28.5017,
    longitude: -13.8622,
    geoRadiusMeters: 60000,
  },
  {
    id: 'lanzarote-office',
    name: 'Zodiacs Rent a Car – Lanzarote',
    streetAddress: 'Avenida de las Playas 41',
    addressLocality: 'Puerto del Carmen',
    addressRegion: 'Las Palmas',
    postalCode: '35510',
    addressCountry: 'ES',
    latitude: 28.923,
    longitude: -13.665,
    geoRadiusMeters: 55000,
  },
];

type StructuredDataProps = {
  locale: Locale;
};

export async function StructuredData({ locale }: StructuredDataProps) {
  const t = await getTranslations({ locale, namespace: 'SEO' });
  const siteUrl = getSiteUrl();

  const organizationNode = {
    '@type': ['Organization', 'AutoRental'],
    '@id': `${siteUrl}/#organization`,
    name: t('brand'),
    url: siteUrl,
    description: t('siteDescription'),
    image: `${siteUrl}/header_image.webp`,
    logo: `${siteUrl}/logo_white.png`,
    email: process.env.CONTACT_EMAIL || CONTACT_EMAIL,
    telephone: process.env.CONTACT_PHONE || CONTACT_PHONE,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        telephone: process.env.CONTACT_PHONE || CONTACT_PHONE,
        email: process.env.CONTACT_EMAIL || CONTACT_EMAIL,
        availableLanguage: ['hu', 'es', 'en'],
      },
    ],
    areaServed: [
      { '@type': 'Place', name: 'Fuerteventura' },
      { '@type': 'Place', name: 'Lanzarote' },
    ],
    serviceType: ['car rental', 'airport transfer'],
  };

  const locationNodes = LOCATIONS.map((location) => ({
    '@type': ['LocalBusiness', 'AutoRental'],
    '@id': `${siteUrl}/#${location.id}`,
    name: location.name,
    parentOrganization: { '@id': `${siteUrl}/#organization` },
    image: `${siteUrl}/header_image.webp`,
    url: siteUrl,
    email: process.env.CONTACT_EMAIL || CONTACT_EMAIL,
    telephone: process.env.CONTACT_PHONE || CONTACT_PHONE,
    address: {
      '@type': 'PostalAddress',
      streetAddress: location.streetAddress,
      addressLocality: location.addressLocality,
      addressRegion: location.addressRegion,
      postalCode: location.postalCode,
      addressCountry: location.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: location.latitude,
      longitude: location.longitude,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
        ],
        opens: '08:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday', 'Sunday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: location.latitude,
        longitude: location.longitude,
      },
      geoRadius: location.geoRadiusMeters,
    },
  }));

  const graph = [
    organizationNode,
    ...locationNodes,
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: t('brand'),
      url: siteUrl,
      inLanguage: locale,
      description: t('siteDescription'),
      publisher: { '@id': `${siteUrl}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/${locale}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
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
