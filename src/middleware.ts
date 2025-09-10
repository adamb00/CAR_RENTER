import createMiddleware from 'next-intl/middleware';
import { LOCALES, DEFAULT_LOCALE } from '@/i18n/config';

export default createMiddleware({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localeDetection: true,
});

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
