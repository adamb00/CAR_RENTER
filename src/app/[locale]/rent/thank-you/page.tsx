import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { buildPageMetadata, resolveLocale } from '@/lib/seo';
import { prisma } from '@/lib/prisma';
import { STATUS_DONE } from '@/lib/requestStatus';
import { sendMail } from '@/lib/mailer';
import { renderBrandEmail, type EmailRow } from '@/lib/emailTemplates';
import { RentFormValues } from '@/schemas/RentSchema';
import { getCarById } from '@/lib/cars';
import type { Prisma } from '@prisma/client';
import { recordNotification } from '@/lib/notifications';

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

const RENT_ID_REGEX = /^[0-9a-fA-F-]{36}$/;
const BOOKING_DATA_FIELDS = [
  'rentalFee',
  'deposit',
  'insurance',
  'extrasFee',
  'deliveryFee',
  'bookingLink',
  'adminName',
] as const;

type BookingDataKey = (typeof BOOKING_DATA_FIELDS)[number];

type RentCompletionRecord = {
  id: string;
  humanId: string | null;
  contactEmail: string;
  contactName: string;
  contactPhone: string | null;
  payload: Prisma.JsonValue | null;
  carId: string | null;
  quoteId: string | null;
  contactQuote: {
    bookingRequestData: Prisma.JsonValue | null;
  } | null;
};

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
          payload: true,
          carId: true,
          quoteId: true,
          contactQuote: {
            select: { bookingRequestData: true },
          },
        },
      });

      if (rentRecord) {
        const updateResult = await prisma.rentRequest.updateMany({
          where: { id: rentId, status: { not: STATUS_DONE } },
          data: { status: STATUS_DONE, updated: 'rent-thank-you' },
        });

        if (updateResult.count > 0) {
          await sendRentCompletionEmail(rentRecord, resolvedLocale);
          await recordNotification({
            type: 'rent_request',
            title: 'Bérlés lezárva',
            description: `${rentRecord.contactName} (${rentRecord.contactEmail}) befejezte a folyamatot a köszönő oldalon.`,
            href: `/${rentRecord.id}`,
            tone: 'success',
            referenceId: rentRecord.id,
            metadata: {
              rentId,
              humanId: rentRecord.humanId,
              origin: 'rent-thank-you',
            },
          });
        }
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
      <p className='text-lg sm:text-xl text-grey-dark-3 dark:text-grey-dark-2 max-w-3xl mx-auto'>
        {tEmails('rent.intro')}
      </p>
      <Link
        href={`/${resolvedLocale}`}
        className='inline-flex items-center justify-center rounded-2xl bg-sky-dark px-6 py-3 text-base font-semibold text-white transition hover:bg-sky-dark/80 focus-visible:outline-none focus-visible:ring focus-visible:ring-sky-dark/60'
      >
        {tEmails('rent.ctaLabel')}
      </Link>
    </div>
  );
}

const isRentPayload = (value: unknown): value is RentFormValues => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    'contact' in candidate &&
    'driver' in candidate &&
    'rentalPeriod' in candidate &&
    'invoice' in candidate
  );
};

const formatFriendlyDate = (value?: string | null, locale?: string): string => {
  if (!value) return 'n/a';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(locale ?? 'en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatAddress = (address?: {
  country?: string | null;
  postalCode?: string | null;
  city?: string | null;
  street?: string | null;
  streetType?: string | null;
  doorNumber?: string | null;
}): string => {
  if (!address) return 'n/a';
  const streetParts = [address.street, address.streetType]
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .join(' ');
  const parts = [
    address.postalCode,
    address.city,
    streetParts,
    address.doorNumber,
    address.country,
  ]
    .filter(
      (segment) => typeof segment === 'string' && segment.trim().length > 0
    )
    .map((segment) => (segment as string).trim());
  return parts.length > 0 ? parts.join(', ') : 'n/a';
};

const normalizeRowValue = (value?: string | null): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : 'n/a';
  }
  return 'n/a';
};

const formatExtrasLabel = (
  extras: unknown,
  translateRentForm: Awaited<ReturnType<typeof getTranslations>>
): string => {
  if (!Array.isArray(extras) || extras.length === 0) {
    return 'n/a';
  }
  return extras
    .filter((extra): extra is string => typeof extra === 'string')
    .map((extra) => {
      try {
        return translateRentForm(`extras.options.${extra}`);
      } catch {
        return extra.replace(/_/g, ' ');
      }
    })
    .join(', ');
};

const formatDeliveryType = (
  type: unknown,
  translateRentForm: Awaited<ReturnType<typeof getTranslations>>
): string => {
  if (type === 'airport') {
    return translateRentForm('sections.delivery.fields.placeType.airport');
  }
  if (type === 'accommodation') {
    return translateRentForm(
      'sections.delivery.fields.placeType.accommodation'
    );
  }
  return typeof type === 'string' && type.trim().length > 0 ? type : 'n/a';
};

const parseBookingData = (
  raw: Prisma.JsonValue | null | undefined
): Partial<Record<BookingDataKey, string>> => {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const record = raw as Record<string, unknown>;
  const result: Partial<Record<BookingDataKey, string>> = {};
  BOOKING_DATA_FIELDS.forEach((key) => {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      result[key] = value.trim();
    }
  });
  return result;
};

async function sendRentCompletionEmail(
  rentRequest: RentCompletionRecord,
  locale: string
) {
  if (!isRentPayload(rentRequest.payload)) {
    return;
  }

  const payload = rentRequest.payload;
  const [tEmails, tRentForm] = await Promise.all([
    getTranslations({ locale, namespace: 'Emails' }),
    getTranslations({ locale, namespace: 'RentForm' }),
  ]);

  const carInfo =
    payload.carId || rentRequest.carId
      ? await getCarById((payload.carId ?? rentRequest.carId) as string)
      : null;

  const carName = carInfo
    ? `${carInfo.manufacturer} ${carInfo.model}`.trim()
    : payload.carId ?? rentRequest.carId ?? 'n/a';

  const period = `${formatFriendlyDate(
    payload.rentalPeriod?.startDate,
    locale
  )} → ${formatFriendlyDate(payload.rentalPeriod?.endDate, locale)}`;
  const adultsCount =
    payload.adults !== undefined && payload.adults !== null
      ? String(payload.adults)
      : 'n/a';
  const childrenCount =
    Array.isArray(payload.children) && payload.children.length > 0
      ? String(payload.children.length)
      : '0';
  const primaryDriver = payload.driver?.[0];
  const driverNameSegments = [
    primaryDriver?.firstName_1,
    primaryDriver?.lastName_1,
  ].filter(
    (segment) => typeof segment === 'string' && segment.trim().length > 0
  );
  const driverName =
    driverNameSegments.length > 0 ? driverNameSegments.join(' ') : 'n/a';
  const driverPhone =
    primaryDriver?.phoneNumber ?? rentRequest.contactPhone ?? 'n/a';
  const driverEmail = primaryDriver?.email ?? rentRequest.contactEmail;
  const deliveryType = formatDeliveryType(
    payload.delivery?.placeType,
    tRentForm
  );
  const deliveryLocationName = payload.delivery?.locationName ?? 'n/a';
  const deliveryAddress = formatAddress(payload.delivery?.address ?? undefined);
  const invoice = payload.invoice;
  const invoiceName =
    invoice?.name ?? payload.contact?.name ?? rentRequest.contactName;
  const invoiceEmail =
    invoice?.email ?? payload.contact?.email ?? rentRequest.contactEmail;
  const invoicePhone = invoice?.phoneNumber ?? 'n/a';
  const invoiceAddress = formatAddress(invoice?.location ?? undefined);
  const extrasLabel = formatExtrasLabel(payload.extras, tRentForm);
  const arrivalFlight = payload.delivery?.arrivalFlight ?? 'n/a';
  const departureFlight = payload.delivery?.departureFlight ?? 'n/a';
  const bookingData = parseBookingData(
    rentRequest.contactQuote?.bookingRequestData
  );

  const rows: EmailRow[] = [
    {
      label: tEmails('rent.rows.humanId'),
      value: normalizeRowValue(rentRequest.humanId ?? rentRequest.id),
    },
    { label: tEmails('rent.rows.period'), value: normalizeRowValue(period) },
    { label: tEmails('rent.rows.carModel'), value: normalizeRowValue(carName) },
    {
      label: tEmails('rent.rows.adults'),
      value: normalizeRowValue(adultsCount),
    },
    {
      label: tEmails('rent.rows.children'),
      value: normalizeRowValue(childrenCount),
    },
    {
      label: tEmails('rent.rows.extras'),
      value: normalizeRowValue(extrasLabel),
    },
    {
      label: tEmails('rent.rows.contactName'),
      value: normalizeRowValue(
        payload.contact?.name ?? rentRequest.contactName
      ),
    },
    {
      label: tEmails('rent.rows.contactEmail'),
      value: normalizeRowValue(
        payload.contact?.email ?? rentRequest.contactEmail
      ),
    },
    {
      label: tEmails('rent.rows.driverName'),
      value: normalizeRowValue(driverName),
    },
    {
      label: tEmails('rent.rows.driverPhone'),
      value: normalizeRowValue(driverPhone),
    },
    {
      label: tEmails('rent.rows.driverEmail'),
      value: normalizeRowValue(driverEmail),
    },
    {
      label: tEmails('rent.rows.deliveryType'),
      value: normalizeRowValue(deliveryType),
    },
    {
      label: tEmails('rent.rows.deliveryLocation'),
      value: normalizeRowValue(deliveryLocationName),
    },
    {
      label: tEmails('rent.rows.deliveryAddress'),
      value: normalizeRowValue(deliveryAddress),
    },
    {
      label: tEmails('rent.rows.arrivalFlight'),
      value: normalizeRowValue(arrivalFlight),
    },
    {
      label: tEmails('rent.rows.departureFlight'),
      value: normalizeRowValue(departureFlight),
    },
    {
      label: tEmails('rent.rows.invoiceName'),
      value: normalizeRowValue(invoiceName),
    },
    {
      label: tEmails('rent.rows.invoiceEmail'),
      value: normalizeRowValue(invoiceEmail),
    },
    {
      label: tEmails('rent.rows.invoicePhone'),
      value: normalizeRowValue(invoicePhone),
    },
    {
      label: tEmails('rent.rows.invoiceAddress'),
      value: normalizeRowValue(invoiceAddress),
    },
    {
      label: tEmails('rent.rows.quoteId'),
      value: normalizeRowValue(payload.quoteId ?? rentRequest.quoteId ?? 'n/a'),
    },
  ];

  BOOKING_DATA_FIELDS.forEach((key) => {
    const value = bookingData[key];
    if (value) {
      rows.push({
        label: tEmails(`rent.rows.${key}`),
        value: value,
      });
    }
  });

  const recipient =
    payload.contact?.email ||
    rentRequest.contactEmail ||
    payload.driver?.[0]?.email;

  if (!recipient) {
    return;
  }

  const emailText = [
    tEmails('rent.intro'),
    '',
    ...rows.map((row) => `${row.label}: ${row.value}`),
  ].join('\n');

  try {
    await sendMail({
      to: recipient,
      subject: tEmails('rent.subject'),
      text: emailText,
      html: renderBrandEmail({
        title: tEmails('rent.title'),
        intro: tEmails('rent.intro'),
        rows,
        footerNote: tEmails('rent.footerNote'),
        securityNote: tEmails('securityDisclaimer'),
      }),
      replyTo: process.env.MAIL_USER || undefined,
    });
  } catch (error) {
    console.error('Failed to send rent completion email', error);
  }
}
