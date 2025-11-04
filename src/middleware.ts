import {
  DEFAULT_LOCALE,
  LANG_BY_COUNTRY,
  Locale,
  LOCALES,
  matchLocaleFromAccept,
} from '@/i18n/config';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_CANONICAL_HOST = 'zodiacsrentacar.com';
const CANONICAL_HOST = (() => {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!envUrl) return DEFAULT_CANONICAL_HOST;
  try {
    const hostname = new URL(envUrl).hostname;
    return hostname || DEFAULT_CANONICAL_HOST;
  } catch {
    return (
      envUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '') ||
      DEFAULT_CANONICAL_HOST
    );
  }
})();
const CANONICAL_WWW_HOST = `www.${CANONICAL_HOST}`.toLowerCase();

type NextRequestWithGeo = NextRequest & {
  geo?: {
    country?: string | null;
  };
};

function hasLocalePrefix(pathname: string): boolean {
  const seg = pathname.split('/')[1]?.toLowerCase();
  return LOCALES.includes(seg as Locale);
}

function getCountryFromRequest(req: NextRequest): string | null {
  const { geo } = req as NextRequestWithGeo;
  const geoCountry = geo?.country?.toUpperCase();
  if (geoCountry) return geoCountry;

  const headerCountry = req.headers.get('x-vercel-ip-country');
  return headerCountry ? headerCountry.toUpperCase() : null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.nextUrl.hostname.toLowerCase();

  if (hostname === CANONICAL_WWW_HOST) {
    const url = req.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

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

  // 2) Geo location (country → locale mapping)
  if (!locale) {
    const country = getCountryFromRequest(req);
    const mapped = country ? LANG_BY_COUNTRY[country] : null;
    if (mapped && LOCALES.includes(mapped)) locale = mapped;
  }

  // 3) Accept-Language
  if (!locale) {
    const accept = req.headers.get('accept-language') || '';
    locale = matchLocaleFromAccept(accept);
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
