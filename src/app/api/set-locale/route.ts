import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LOCALES, type Locale } from '@/i18n/config';

type Body = { locale?: string };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const raw = body.locale;
  if (
    typeof raw !== 'string' ||
    !(LOCALES as readonly string[]).includes(raw)
  ) {
    return NextResponse.json(
      { ok: false, error: 'Invalid locale' },
      { status: 400 }
    );
  }

  const locale = raw as Locale;
  const jar = await cookies();

  jar.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });

  return NextResponse.json({ ok: true });
}
