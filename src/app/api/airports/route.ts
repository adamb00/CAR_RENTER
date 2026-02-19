import { NextRequest, NextResponse } from 'next/server';

import { searchAirports } from '@/lib/airports/our-airports';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

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
    const items = await searchAirports({
      query,
      limit,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Airport lookup failed', error);
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
