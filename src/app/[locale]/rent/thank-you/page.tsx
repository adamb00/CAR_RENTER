import { RENT_ID_REGEX } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { RENT_STATUS_ACCEPTED } from '@/lib/requestStatus';
import { buildPageMetadata, resolveLocale } from '@/lib/seo/seo';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { sendRentCompletionEmail } from '../../../../emails/sendRentCompletionEmail';

type PageParams = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveLocale(locale);
  return buildPageMetadata({
    locale: resolvedLocale,
    pageKey: 'rent',
    path: '/rent/thank-you',
    imagePath: '/header_image.webp',
  });
}

export default async function RentThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale = 'hu' }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  console.log(resolvedSearchParams);
  const resolvedLocale = resolveLocale(locale);
  const rentIdRaw = resolvedSearchParams?.rentId;
  const rentId = Array.isArray(rentIdRaw) ? rentIdRaw[0] : rentIdRaw;
  const isRentIdValid =
    typeof rentId === 'string' && RENT_ID_REGEX.test(rentId);

  if (isRentIdValid) {
    try {
      const rentRecord = await prisma.rentRequest.findUnique({
        where: { id: rentId },
        select: {
          id: true,
          humanId: true,
          contactEmail: true,
          contactName: true,
          contactPhone: true,
          rentalStart: true,
          rentalEnd: true,
          rentalDays: true,
          payload: true,
          carId: true,
          quoteId: true,
          BookingDeliveryDetails: {
            select: {
              placeType: true,
              locationName: true,
              addressLine: true,
              arrivalFlight: true,
              departureFlight: true,
              arrivalHour: true,
              arrivalMinute: true,
            },
          },
          contactQuote: {
            select: { bookingRequestData: true },
          },
        },
      });

      if (rentRecord && resolvedSearchParams.finalize === 'true') {
        const updateResult = await prisma.rentRequest.updateMany({
          where: { id: rentId, status: { not: RENT_STATUS_ACCEPTED } },
          data: { status: RENT_STATUS_ACCEPTED, updated: 'rent-thank-you' },
        });
        // if (updateResult.count > 0) {
        //   await sendRentCompletionEmail(rentRecord, resolvedLocale);
        // }
      }
    } catch (error) {
      console.error('Failed to finalize rent request', error);
    }
  }

  const tEmails = await getTranslations({
    locale: resolvedLocale,
    namespace: 'Emails',
  });

  return (
    <div className='relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center space-y-8'>
      <h1 className='text-4xl sm:text-5xl md:text-6xl font-semibold text-sky-dark dark:text-amber-light'>
        {tEmails('rent.title')}
      </h1>
      {resolvedSearchParams.finalize !== 'true' ? (
        <>
          <p className='text-lg sm:text-xl text-grey-dark-3 dark:text-grey-dark-2 max-w-3xl mx-auto'>
            {tEmails('rent.intro')}
          </p>
          <Link
            href={`/${resolvedLocale}`}
            className='inline-flex items-center justify-center rounded-2xl bg-sky-dark px-6 py-3 text-base font-semibold text-white transition hover:bg-sky-dark/80 focus-visible:outline-none focus-visible:ring focus-visible:ring-sky-dark/60'
          >
            {tEmails('rent.ctaLabel')}
          </Link>
        </>
      ) : (
        <Link
          href={`/${resolvedLocale}`}
          className='inline-flex items-center justify-center rounded-2xl bg-sky-dark px-6 py-3 text-base font-semibold text-white transition hover:bg-sky-dark/80 focus-visible:outline-none focus-visible:ring focus-visible:ring-sky-dark/60'
        >
          {tEmails('rent.ctaLabelFinalized')}
        </Link>
      )}
    </div>
  );
}
