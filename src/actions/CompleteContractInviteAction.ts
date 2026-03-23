'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

import { finalizeBookingContractInvite } from '@/lib/booking-contract';
import { hashContractInviteToken, isContractInviteExpired } from '@/lib/contract-invite';
import { recordNotification } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';
import { resolveLocale } from '@/lib/seo/seo';

const completeContractInviteSchema = z.object({
  token: z.string().min(1),
  locale: z.string().min(2),
  signerName: z.string().min(1),
  renterSignatureData: z.string().min(1),
});

export async function completeContractInviteAction(
  input: z.infer<typeof completeContractInviteSchema>
) {
  const parsed = completeContractInviteSchema.safeParse(input);
  const locale = resolveLocale(parsed.success ? parsed.data.locale : input.locale);
  const t = await getTranslations({ locale, namespace: 'RentContract' });

  if (!parsed.success) {
    return { error: t('actionErrors.invalidContractData') };
  }

  const tokenHash = hashContractInviteToken(parsed.data.token);
  const invite = await prisma.bookingContractInvites.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      bookingId: true,
      recipientEmail: true,
      contractText: true,
      lessorSignatureData: true,
      expiresAt: true,
      completedAt: true,
      revokedAt: true,
      RentRequests: {
        select: {
          humanId: true,
        },
      },
    },
  });

  if (!invite || invite.revokedAt) {
    return { error: t('actionErrors.invalidLink') };
  }

  if (invite.completedAt) {
    return { error: t('actionErrors.alreadyReturned') };
  }

  if (isContractInviteExpired(invite.expiresAt, invite.completedAt)) {
    return { error: t('actionErrors.expiredLink') };
  }

  const result = await finalizeBookingContractInvite({
    bookingId: invite.bookingId,
    recipientEmail: invite.recipientEmail,
    contractText: invite.contractText,
    signerName: parsed.data.signerName,
    renterSignatureData: parsed.data.renterSignatureData,
    lessorSignatureData: invite.lessorSignatureData,
  });

  if (result.error) {
    return {
      error: t(`actionErrors.${result.error}`),
    };
  }

  const now = new Date();
  await prisma.bookingContractInvites.update({
    where: { id: invite.id },
    data: {
      completedAt: now,
      updatedAt: now,
    },
  });

  await recordNotification({
    type: 'contract_invite_completed',
    title: 'Szerződés visszaküldve',
    description: `A bérlő visszaküldte az aláírt szerződést (${invite.RentRequests?.humanId ?? invite.bookingId}).`,
    href: `/bookings/${invite.bookingId}/edit`,
    eventKey: `contract-invite-completed:${invite.bookingId}:${invite.id}`,
    tone: 'info',
    referenceId: invite.bookingId,
  });

  revalidatePath(`/${locale}/rent/contract/${parsed.data.token}`);

  return { success: t('actionSuccess.returned') };
}
