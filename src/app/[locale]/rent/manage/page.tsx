import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getSiteUrl, resolveLocale } from '@/lib/seo';
import { LOCALES } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mailer';
import { recordNotification } from '@/lib/notifications';
import { RENT_STATUS_CANCELLED } from '@/lib/requestStatus';
import { appendRentUpdateLog } from '@/lib/rentUpdateLog';

const RENT_ID_REGEX = /^[0-9a-fA-F-]{36}$/;
const HUMAN_ID_REGEX = /^[0-9]{4}\/[0-9A-Za-z-]+$/;

type PageParams = { locale: string };
type SearchParams = { action?: string; result?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: resolvedLocale,
    namespace: 'RentManage',
  });
  const siteUrl = getSiteUrl();
  const path = '/rent/manage';
  const canonical = `${siteUrl}/${resolvedLocale}${path}`;

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, `${siteUrl}/${loc}${path}`])
      ),
    },
    openGraph: {
      type: 'website',
      locale: resolvedLocale,
      url: canonical,
      title: t('meta.title'),
      description: t('meta.description'),
      images: [
        {
          url: `${siteUrl}/header_image.webp`,
          width: 1200,
          height: 630,
          alt: t('meta.title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.title'),
      description: t('meta.description'),
      images: [`${siteUrl}/header_image.webp`],
    },
  };
}

export default async function ManageRentCancelPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams?: Promise<SearchParams>;
}) {
  const [routeParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<SearchParams>({}),
  ]);
  const { locale } = routeParams;
  const resolvedLocale = resolveLocale(locale);
  const tManage = await getTranslations({
    locale: resolvedLocale,
    namespace: 'RentManage',
  });
  const resultParam = resolvedSearchParams?.result;
  const alert = buildAlertBanner(resultParam, tManage);

  return (
    <section className='relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-10'>
      <div className='text-center space-y-4'>
        <p className='text-xs uppercase tracking-[0.6em] text-slate-500 dark:text-slate-300'>
          {tManage('meta.kicker')}
        </p>
        <h1 className='text-3xl md:text-4xl lg:text-5xl font-semibold tracking-wide bg-linear-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
          {tManage('title')}
        </h1>
        <p className='text-base md:text-lg text-grey-dark-3 dark:text-grey-dark-2'>
          {tManage('description')}
        </p>
      </div>

      <div className='space-y-4'>
        {alert}

        <CancelForm locale={resolvedLocale} tManage={tManage} />
      </div>
    </section>
  );
}

function buildAlertBanner(
  resultParam: string | undefined,
  tManage: Awaited<ReturnType<typeof getTranslations>>
) {
  if (!resultParam) return null;
  const variant = resultParam === 'success' ? 'success' : 'error';
  const message =
    resultParam === 'success'
      ? tManage('alerts.cancelSuccess')
      : resultParam === 'invalid'
      ? tManage('cancelErrors.invalid')
      : resultParam === 'notfound'
      ? tManage('cancelErrors.notFound')
      : resultParam === 'mismatch'
      ? tManage('cancelErrors.mismatch')
      : tManage('cancelErrors.generic');

  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3 text-sm shadow-sm',
        variant === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-rose-200 bg-rose-50 text-rose-900'
      )}
    >
      {message}
    </div>
  );
}

function CancelForm({
  locale,
  tManage,
}: {
  locale: string;
  tManage: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <form
      action={cancelRentRequestAction}
      className='rounded-3xl border border-grey-light-2/60 dark:border-grey-dark-2/50 bg-white/90 dark:bg-slate-900/40 backdrop-blur p-6 shadow-sm space-y-5'
    >
      <input type='hidden' name='locale' value={locale} />
      <div className='space-y-2'>
        <label
          htmlFor='rent-id'
          className='text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground'
        >
          {tManage('summary.bookingId')}
        </label>
        <Input
          id='rent-id'
          name='rentId'
          required
          placeholder='2025/0001'
        />
      </div>
      <div className='space-y-2'>
        <label
          htmlFor='contact-email'
          className='text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground'
        >
          {tManage('summary.contactEmail')}
        </label>
        <Input
          id='contact-email'
          name='contactEmail'
          type='email'
          required
          placeholder='you@example.com'
        />
      </div>
      <div className='space-y-2'>
        <label
          htmlFor='cancel-reason'
          className='text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground'
        >
          {tManage('cancel.reasonLabel')}
        </label>
        <Textarea
          id='cancel-reason'
          name='reason'
          placeholder={tManage('cancel.reasonPlaceholder')}
          className='min-h-[140px] resize-none'
        />
        <p className='text-xs text-grey-dark-3 dark:text-grey-dark-2'>
          {tManage('cancel.helper')}
        </p>
      </div>
      <Button
        type='submit'
        className='w-full md:w-auto rounded-full bg-sky-dark px-6 py-2 text-sm font-semibold tracking-[0.3em] text-white hover:bg-sky-dark/90 dark:bg-sky-light dark:text-slate-900 dark:hover:bg-sky-light/90'
      >
        {tManage('cancel.button')}
      </Button>
    </form>
  );
}

async function cancelRentRequestAction(formData: FormData) {
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

  if ((!rentIdCandidate && !humanIdCandidate) || contactEmailInput.length === 0) {
    return redirectWith('invalid');
  }

  const rent = await prisma.rentRequest.findFirst({
    where: rentIdCandidate ? { id: rentIdCandidate } : { humanId: humanIdCandidate },
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
        description: `${rent.contactName} (${rent.contactEmail ?? 'n/a'}) lemondta a foglalást.`,
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
