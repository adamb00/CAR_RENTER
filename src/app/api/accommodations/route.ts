import { NextRequest, NextResponse } from 'next/server';

import { searchAccommodationRegistry } from '@/lib/accommodations/canary-registry';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 25;

const parseLimit = (value: string | null): number => {
  if (!value) return DEFAULT_LIMIT;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(parsed, MAX_LIMIT));
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? '';
  const limit = parseLimit(request.nextUrl.searchParams.get('limit'));

  try {
    const items = await searchAccommodationRegistry({
      query,
      limit,
    });

    return NextResponse.json({
      items,
    });
  } catch (error) {
    console.error('Accommodation registry lookup failed', error);
    return NextResponse.json(
      {
        items: [],
      },
      {
        status: 503,
      }
    );
  }
}
