import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import ContractPublicForm from '@/components/rent/contract/ContractPublicForm';
import {
  hashContractInviteToken,
  isContractInviteExpired,
} from '@/lib/contract-invite';
import { prisma } from '@/lib/prisma';
import { buildPageMetadata, resolveLocale } from '@/lib/seo/seo';

type PageParams = {
  locale: string;
  token: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveLocale(locale);
  return buildPageMetadata({
    locale: resolvedLocale,
    pageKey: 'rentContract',
    path: '/rent/contract',
  });
}

export default async function RentContractPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale, token } = await params;
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: 'RentContract',
  });
  const invite = await prisma.bookingContractInvites.findUnique({
    where: { tokenHash: hashContractInviteToken(token) },
    select: {
      id: true,
      bookingId: true,
      recipientEmail: true,
      signerName: true,
      contractText: true,
      expiresAt: true,
      openedAt: true,
      completedAt: true,
      revokedAt: true,
      RentRequests: {
        select: {
          humanId: true,
          BookingContracts: {
            select: {
              signerName: true,
              signedAt: true,
            },
          },
        },
      },
    },
  });

  if (!invite || invite.revokedAt) {
    return (
      <section className='mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8'>
        <div className='rounded-3xl border border-slate-200 bg-white p-8 shadow-sm'>
          <h1 className='text-3xl font-semibold text-slate-900'>
            {t('errors.invalid.title')}
          </h1>
          <p className='mt-3 text-slate-600'>
            {t('errors.invalid.description')}
          </p>
        </div>
      </section>
    );
  }

  if (!invite.openedAt) {
    await prisma.bookingContractInvites.update({
      where: { id: invite.id },
      data: {
        openedAt: new Date(),
      },
    });
  }

  const existingContract = invite.RentRequests.BookingContracts;
  if (
    !existingContract &&
    isContractInviteExpired(invite.expiresAt, invite.completedAt)
  ) {
    return (
      <section className='mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8'>
        <div className='rounded-3xl border border-slate-200 bg-white p-8 shadow-sm'>
          <h1 className='text-3xl font-semibold text-slate-900'>
            {t('errors.expired.title')}
          </h1>
          <p className='mt-3 text-slate-600'>
            {t('errors.expired.description')}
          </p>
        </div>
      </section>
    );
  }

  const pdfHref = `/api/contracts/${encodeURIComponent(token)}/pdf`;

  return (
    <section className='mx-auto max-w-4xl space-y-8 px-4 py-16 sm:px-6 lg:px-8'>
      <div className='space-y-3 text-center'>
        <p className='text-xs uppercase tracking-[0.45em] text-slate-500'>
          Zodiac Rent a Car
        </p>
        <h1 className='text-3xl font-semibold text-slate-900 md:text-5xl'>
          {t('title')}
        </h1>

        <p className='text-sm text-slate-500'>
          {t('bookingId', {
            id: invite.RentRequests.humanId ?? invite.bookingId,
          })}
        </p>
      </div>

      <ContractPublicForm
        token={token}
        locale={resolvedLocale}
        signerName={invite.signerName}
        renterEmail={invite.recipientEmail}
        contractText={invite.contractText}
        pdfHref={pdfHref}
        isCompleted={Boolean(existingContract)}
        completedSignerName={existingContract?.signerName}
        completedAt={existingContract?.signedAt.toISOString() ?? null}
      />
    </section>
  );
}
