import { NextRequest, NextResponse } from 'next/server';

import { findNearestDeliveryPrice } from '@/lib/delivery-prices';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address') ?? '';
  const city = request.nextUrl.searchParams.get('city') ?? '';
  const island = request.nextUrl.searchParams.get('island') ?? '';

  try {
    const estimate = await findNearestDeliveryPrice({
      address,
      city,
      island,
    });

    return NextResponse.json({
      estimate,
    });
  } catch (error) {
    console.error('Delivery price lookup failed', error);
    return NextResponse.json(
      {
        estimate: null,
      },
      {
        status: 503,
      },
    );
  }
}
