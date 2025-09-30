import createMiddleware from 'next-intl/middleware';
import { LOCALES, DEFAULT_LOCALE } from '@/i18n/config';

export default createMiddleware({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localeDetection: true,
});

export const config = {
  // Exclude Next.js internals, files, and API routes from locale handling
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
