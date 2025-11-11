export type SearchEntryConfig = {
  id: string;
  namespaces: string[];
};

export const SEARCH_ENTRY_CONFIG: SearchEntryConfig[] = [
  {
    id: 'home',
    namespaces: ['Header', 'HomeIntro', 'Explore', 'AboutSection', 'Inquire', 'Pages.home'],
  },
  {
    id: 'cars',
    namespaces: ['Cars', 'CarDetail', 'CarRent', 'RentForm', 'RentSchema', 'Pages.cars'],
  },
  {
    id: 'about',
    namespaces: ['AboutUs', 'AboutSection', 'Pages.about'],
  },
  {
    id: 'contact',
    namespaces: ['Contact', 'WhatsApp', 'Footer', 'Pages.contact'],
  },
  {
    id: 'blog',
    namespaces: ['Blog', 'Pages.blog'],
  },
  {
    id: 'blog-rip-current',
    namespaces: [
      'BlogPosts.fuerteventura-visszatero-aramlat-biztonsagos-furdozes',
      'BlogPosts',
    ],
  },
  {
    id: 'faq',
    namespaces: ['FAQ', 'Pages.faq'],
  },
  {
    id: 'gdpr',
    namespaces: ['GDPR', 'Pages.gdpr'],
  },
  {
    id: 'cookie-policy',
    namespaces: ['CookiePolicy', 'CookieConsent', 'Pages.cookiePolicy'],
  },
  {
    id: 'insurance',
    namespaces: ['Insurance', 'Pages.insurance'],
  },
  {
    id: 'rental-requirements',
    namespaces: ['RentalRequirements', 'Pages.rentalRequirements'],
  },
  {
    id: 'offices',
    namespaces: ['Pages.offices'],
  },
  {
    id: 'general-rental-conditions',
    namespaces: ['GeneralRental', 'Pages.generalRental'],
  },
  {
    id: 'gtc',
    namespaces: ['GTC', 'Pages.gtc'],
  },
];
