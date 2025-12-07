import { prisma } from '@/lib/prisma';
import { resolveLocale } from '@/lib/seo/seo';
import { redirect } from 'next/navigation';
import { appendRentUpdateLog } from '@/lib/rentUpdateLog';
import { HUMAN_ID_REGEX, RENT_ID_REGEX } from '@/lib/constants';
import { RENT_STATUS_CANCELLED } from '@/lib/requestStatus';
import { getTranslations } from 'next-intl/server';
import { sendMail } from '@/lib/mailer';
import { recordNotification } from '@/lib/notifications';

export async function cancelRentRequestAction(formData: FormData) {
  'use server';

  const locale = resolveLocale(String(formData.get('locale') ?? 'hu'));
  const rentInput = String(formData.get('rentId') ?? '').trim();
  const contactEmailInput = String(formData.get('contactEmail') ?? '')
    .trim()
    .toLowerCase();
  const reasonRaw = String(formData.get('reason') ?? '').trim();
  const reason = reasonRaw.length > 1000 ? reasonRaw.slice(0, 1000) : reasonRaw;

  const redirectBase = `/${locale}/rent/manage?action=cancel`;
  const redirectWith = (result: string) =>
    redirect(`${redirectBase}&result=${result}`);

  const rentIdCandidate = RENT_ID_REGEX.test(rentInput) ? rentInput : null;
  const humanIdCandidate = HUMAN_ID_REGEX.test(rentInput) ? rentInput : null;

  if (
    (!rentIdCandidate && !humanIdCandidate) ||
    contactEmailInput.length === 0
  ) {
    return redirectWith('invalid');
  }

  const rent = await prisma.rentRequest.findFirst({
    where: rentIdCandidate
      ? { id: rentIdCandidate }
      : { humanId: humanIdCandidate },
    select: {
      id: true,
      humanId: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      rentalStart: true,
      rentalEnd: true,
      quoteId: true,
      updated: true,
    },
  });

  if (!rent) {
    return redirectWith('notfound');
  }

  const canonicalRentId = rent.id;
  const canonicalHumanId = rent.humanId ?? rent.id;

  const storedEmail = rent.contactEmail?.trim().toLowerCase() ?? '';
  if (storedEmail && contactEmailInput !== storedEmail) {
    return redirectWith('mismatch');
  }

  try {
    const updatedMarker = appendRentUpdateLog(rent.updated, {
      action: 'self-service:cancel',
      rentId: canonicalRentId,
      providedId: rentInput,
      reason: reason || null,
    });
    await prisma.rentRequest.update({
      where: { id: canonicalRentId },
      data: {
        status: RENT_STATUS_CANCELLED,
        updated: updatedMarker,
      },
    });
  } catch (error) {
    console.error('Failed to cancel rent request', error);
    return redirectWith('error');
  }

  try {
    const tManage = await getTranslations({
      locale,
      namespace: 'RentManage',
    });
    const summaryLines = [
      `Booking ID: ${rent.humanId ?? rent.id}`,
      `Contact: ${rent.contactName} <${rent.contactEmail ?? 'n/a'}>`,
      `Phone: ${rent.contactPhone ?? 'n/a'}`,
      `Reason: ${reason || 'n/a'}`,
    ];

    await sendMail({
      to: process.env.MAIL_USER || 'info@zodiacsrentacar.com',
      subject: `Foglalás lemondva | ${rent.contactName}`,
      text: summaryLines.join('\n'),
    });

    if (rent.contactEmail) {
      await sendMail({
        to: rent.contactEmail,
        subject: tManage('tabs.cancel'),
        text: [
          tManage('alerts.cancelSuccess'),
          '',
          `Booking ID: ${rent.humanId ?? rent.id}`,
          reason ? `Reason: ${reason}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      });
    }

    await recordNotification({
      type: 'rent_request',
      title: 'Bérlés lemondva',
      description: `${rent.contactName} (${
        rent.contactEmail ?? 'n/a'
      }) lemondta a foglalást.`,
      href: `/${canonicalRentId}`,
      tone: 'warning',
      referenceId: canonicalRentId,
      metadata: {
        rentId: canonicalRentId,
        humanId: canonicalHumanId,
        contactEmail: rent.contactEmail,
        reason: reason || null,
        action: 'cancel',
        identifier: rentInput,
      },
    });
  } catch (error) {
    console.error('Failed to notify about cancellation', error);
  }

  return redirectWith('success');
}
