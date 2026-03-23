import { NextResponse } from 'next/server';

import { buildContractPdf } from '@/lib/contract-pdf';
import {
  hashContractInviteToken,
  isContractInviteExpired,
} from '@/lib/contract-invite';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const invite = await prisma.bookingContractInvites.findUnique({
    where: { tokenHash: hashContractInviteToken(token) },
    select: {
      bookingId: true,
      signerName: true,
      contractText: true,
      lessorSignatureData: true,
      expiresAt: true,
      completedAt: true,
      revokedAt: true,
      RentRequests: {
        select: {
          humanId: true,
          BookingContracts: {
            select: {
              signerName: true,
              signedAt: true,
              contractText: true,
              signatureData: true,
              lessorSignatureData: true,
            },
          },
        },
      },
    },
  });

  if (!invite || invite.revokedAt) {
    return NextResponse.json(
      { message: 'Invalid contract link.' },
      { status: 404 }
    );
  }

  const finalizedContract = invite.RentRequests.BookingContracts;
  if (
    !finalizedContract &&
    isContractInviteExpired(invite.expiresAt, invite.completedAt)
  ) {
    return NextResponse.json(
      { message: 'Expired contract link.' },
      { status: 410 }
    );
  }

  try {
    const pdf = await buildContractPdf({
      contractText: finalizedContract?.contractText ?? invite.contractText,
      signerName: finalizedContract?.signerName ?? invite.signerName,
      signedAt: finalizedContract?.signedAt ?? null,
      renterSignatureDataUrl: finalizedContract?.signatureData ?? null,
      lessorSignatureDataUrl:
        finalizedContract?.lessorSignatureData ?? invite.lessorSignatureData,
    });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rental-agreement-${invite.RentRequests.humanId ?? invite.bookingId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('public contract pdf route', error);
    return NextResponse.json(
      { message: 'Failed to generate PDF.' },
      { status: 500 }
    );
  }
}
