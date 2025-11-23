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

function getLocaleFromPathname(pathname: string): Locale | null {
  const seg = pathname.split('/')[1]?.toLowerCase();
  return LOCALES.includes(seg as Locale) ? (seg as Locale) : null;
}

function getCountryFromRequest(req: NextRequest): string | null {
  const { geo } = req as NextRequestWithGeo;
  const geoCountry = geo?.country?.toUpperCase();
  if (geoCountry) return geoCountry;

  const headerCountry = req.headers.get('x-vercel-ip-country');
  return headerCountry ? headerCountry.toUpperCase() : null;
}

function detectLocaleFromRequest(req: NextRequest): Locale | null {
  const country = getCountryFromRequest(req);
  if (country) {
    const mapped = LANG_BY_COUNTRY[country];
    if (mapped && LOCALES.includes(mapped)) return mapped;
  }

  const accept = req.headers.get('accept-language') || '';
  return matchLocaleFromAccept(accept);
}

const LOCALE_COOKIE_OPTIONS = {
  path: '/' as const,
  maxAge: 60 * 60 * 24 * 365,
};

function withLocaleCookie(res: NextResponse, locale: Locale) {
  res.cookies.set('NEXT_LOCALE', locale, LOCALE_COOKIE_OPTIONS);
  return res;
}

function buildLocalizedPath(
  pathname: string,
  locale: Locale,
  existingLocale: Locale | null,
): string {
  if (existingLocale) {
    const segments = pathname.split('/');
    segments[1] = locale;
    const rebuilt = segments.join('/');
    return rebuilt || `/${locale}`;
  }

  if (pathname === '/') return `/${locale}`;
  return `/${locale}${pathname}`;
}

function redirectToLocale(
  req: NextRequest,
  locale: Locale,
  existingLocale: Locale | null,
) {
  const url = req.nextUrl.clone();
  url.pathname = buildLocalizedPath(req.nextUrl.pathname, locale, existingLocale);
  const res = NextResponse.redirect(url);
  return withLocaleCookie(res, locale);
}

export function proxy(req: NextRequest) {
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

  const pathLocale = getLocaleFromPathname(pathname);
  const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value as
    | Locale
    | undefined;
  const validCookie = cookieLocale && LOCALES.includes(cookieLocale);

  if (pathLocale) {
    if (!validCookie) {
      const detected = detectLocaleFromRequest(req) ?? DEFAULT_LOCALE;
      if (detected !== pathLocale) {
        return redirectToLocale(req, detected, pathLocale);
      }
    }

    const res = NextResponse.next();
    if (!validCookie || cookieLocale !== pathLocale) {
      return withLocaleCookie(res, pathLocale);
    }

    return res;
  }

  const targetLocale =
    (validCookie ? (cookieLocale as Locale) : null) ??
    detectLocaleFromRequest(req) ??
    DEFAULT_LOCALE;

  return redirectToLocale(req, targetLocale, null);
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
