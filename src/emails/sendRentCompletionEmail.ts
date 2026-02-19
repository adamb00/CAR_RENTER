import { RentCompletionRecord } from '@/app/[locale]/rent/thank-you/thank-you.types';
import { getCarById } from '@/lib/cars';
import { BOOKING_DATA_FIELDS } from '@/lib/constants';
import { EmailRow, renderBrandEmail } from '@/lib/emailTemplates';
import {
  formatAddress,
  formatDeliveryType,
  formatExtrasLabel,
  formatFriendlyDate,
  normalizeRowValue,
  parseBookingData,
} from '@/lib/format';
import { sendMail } from '@/lib/mailer';
import { parseCompactRentPayload } from '@/lib/rentPayload';
import { getTranslations } from 'next-intl/server';

const toDateString = (value: Date | null): string | undefined => {
  if (!value) return undefined;
  return value.toISOString().slice(0, 10);
};

export async function sendRentCompletionEmail(
  rentRequest: RentCompletionRecord,
  locale: string,
) {
  const compactPayload = parseCompactRentPayload(rentRequest.payload);
  const [tEmails, tRentForm] = await Promise.all([
    getTranslations({ locale, namespace: 'Emails' }),
    getTranslations({ locale, namespace: 'RentForm' }),
  ]);

  const carInfo =
    rentRequest.carId
      ? await getCarById(rentRequest.carId)
      : null;

  const carName = carInfo
    ? `${carInfo.manufacturer} ${carInfo.model}`.trim()
    : (rentRequest.carId ?? 'n/a');

  const period = `${formatFriendlyDate(
    toDateString(rentRequest.rentalStart),
    locale,
  )} → ${formatFriendlyDate(toDateString(rentRequest.rentalEnd), locale)}`;
  const rentalDaysValue = String(rentRequest.rentalDays ?? 'n/a');
  const adultsCount =
    compactPayload?.adults !== undefined && compactPayload.adults !== null
      ? String(compactPayload.adults)
      : 'n/a';
  const childrenCount =
    Array.isArray(compactPayload?.children) && compactPayload.children.length > 0
      ? String(compactPayload.children.length)
      : '0';
  const primaryDriver = compactPayload?.driver?.[0];
  const driverNameSegments = [
    primaryDriver?.firstName_1,
    primaryDriver?.lastName_1,
  ].filter(
    (segment) => typeof segment === 'string' && segment.trim().length > 0,
  );
  const driverName =
    driverNameSegments.length > 0 ? driverNameSegments.join(' ') : 'n/a';
  const driverPhone =
    primaryDriver?.phoneNumber ?? rentRequest.contactPhone ?? 'n/a';
  const driverEmail = primaryDriver?.email ?? rentRequest.contactEmail;
  const delivery = rentRequest.BookingDeliveryDetails;
  const deliveryType = formatDeliveryType(
    delivery?.placeType,
    tRentForm,
  );
  const deliveryLocationName = delivery?.locationName ?? 'n/a';
  const deliveryAddress = formatAddress(compactPayload?.deliveryAddress ?? undefined);
  const invoice = compactPayload?.invoice;
  const invoiceName =
    invoice?.name ?? rentRequest.contactName;
  const invoiceEmail =
    invoice?.email ?? rentRequest.contactEmail;
  const invoicePhone = invoice?.phoneNumber ?? 'n/a';
  const invoiceAddress = formatAddress(invoice?.location ?? undefined);
  const extrasLabel = formatExtrasLabel(
    compactPayload?.extras,
    tRentForm,
  );
  const arrivalFlight = delivery?.arrivalFlight ?? 'n/a';
  const departureFlight = delivery?.departureFlight ?? 'n/a';
  const bookingData = parseBookingData(
    rentRequest.contactQuote?.bookingRequestData,
  );

  const rows: EmailRow[] = [
    {
      label: tEmails('rent.rows.humanId'),
      value: normalizeRowValue(rentRequest.humanId ?? rentRequest.id),
    },
    { label: tEmails('rent.rows.period'), value: normalizeRowValue(period) },
    {
      label: tEmails('rent.rows.rentalDays'),
      value: normalizeRowValue(rentalDaysValue),
    },
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
      value: normalizeRowValue(rentRequest.contactName),
    },
    {
      label: tEmails('rent.rows.contactEmail'),
      value: normalizeRowValue(rentRequest.contactEmail),
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
      value: normalizeRowValue(rentRequest.quoteId ?? 'n/a'),
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
    rentRequest.contactEmail ||
    primaryDriver?.email;

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
