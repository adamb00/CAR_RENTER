import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { LOCALES } from '@/i18n/config';

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret') ?? request.headers.get('x-revalidate-token');
    if (!REVALIDATE_SECRET || !secret || secret !== REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { carId?: string; locales?: string[] } | null;
    const targetLocales = Array.isArray(body?.locales) && body?.locales.length > 0 ? body.locales : LOCALES;
    const carId = body?.carId;

    targetLocales.forEach((locale) => {
      revalidatePath(`/${locale}/cars`);
      if (carId) {
        revalidatePath(`/${locale}/cars/${carId}`);
      }
    });

    return NextResponse.json({ revalidated: true, locales: targetLocales, carId: carId ?? null });
  } catch (error) {
    console.error('Revalidate webhook failed', error);
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
