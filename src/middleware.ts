// import createMiddleware from 'next-intl/middleware';
// import { LOCALES, DEFAULT_LOCALE } from '@/i18n/config';

// export default createMiddleware({
//   locales: LOCALES,
//   defaultLocale: DEFAULT_LOCALE,
//   localeDetection: true,
// });

// export const config = {
//   // Exclude Next.js internals, files, and API routes from locale handling
//   matcher: ['/((?!api|_next|.*\\..*).*)'],
// };

// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  LOCALES,
  DEFAULT_LOCALE,
  Locale,
  LANG_BY_COUNTRY,
  matchLocaleFromAccept,
} from '@/i18n/config';

function hasLocalePrefix(pathname: string): boolean {
  const seg = pathname.split('/')[1]?.toLowerCase();
  return LOCALES.includes(seg as Locale);
}

function getCountryFromHeaders(req: NextRequest): string {
  // Vercel edge header – pl. "HU"
  return (req.headers.get('x-vercel-ip-country') || '').toUpperCase();
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  if (hasLocalePrefix(pathname)) {
    return NextResponse.next();
  }

  // 1) Cookie
  const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value as
    | Locale
    | undefined;
  let locale: Locale | null =
    cookieLocale && LOCALES.includes(cookieLocale) ? cookieLocale : null;

  // 2) Accept-Language
  if (!locale) {
    const accept = req.headers.get('accept-language') || '';
    locale = matchLocaleFromAccept(accept);
  }

  // 3) Geo header
  if (!locale) {
    const country = getCountryFromHeaders(req);
    const mapped = country && LANG_BY_COUNTRY[country];
    if (mapped && LOCALES.includes(mapped)) locale = mapped;
  }

  // 4) Fallback
  if (!locale) locale = DEFAULT_LOCALE;

  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  const res = NextResponse.redirect(url);
  res.cookies.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
