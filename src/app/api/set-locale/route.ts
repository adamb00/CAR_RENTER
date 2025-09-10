// src/app/api/set-locale/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { locale } = await req.json();
  if (typeof locale !== 'string')
    return NextResponse.json({ ok: false }, { status: 400 });
  const jar = await cookies();
  jar.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return NextResponse.json({ ok: true });
}
