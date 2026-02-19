'use server';

import { DEFAULT_LOCALE } from '@/i18n/config';
import { buildRentPdf } from '@/lib/build-rent-pdf';
import { getCarById } from '@/lib/cars';
import { renderBrandEmail } from '@/lib/emailTemplates';
import { getNextHumanId } from '@/lib/humanId';
import { sendMail } from '@/lib/mailer';
import { recordNotification } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';
import { appendRentUpdateLog } from '@/lib/rentUpdateLog';
import {
  CONTACT_STATUS_QUOTE_ACCEPTED,
  RENT_STATUS_NEW,
} from '@/lib/requestStatus';
import { buildCompactRentPayload } from '@/lib/rentPayload';
import { resolveLocale } from '@/lib/seo/seo';
import { RentFormValues, RentSchema } from '@/schemas/RentSchema';
import { getTranslations } from 'next-intl/server';

type PricingSnapshotInput = {
  rentalFee: string | null;
  insurance: string | null;
  deposit: string | null;
  deliveryFee: string | null;
  extrasFee: string | null;
  tip: string | null;
};

type BookingRequestPricingRecord = Partial<
  Record<keyof PricingSnapshotInput, unknown>
>;

const PRICING_FIELDS: (keyof PricingSnapshotInput)[] = [
  'rentalFee',
  'insurance',
  'deposit',
  'deliveryFee',
  'extrasFee',
  'tip',
];

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const hasAnyValue = (values: Array<string | null>): boolean =>
  values.some((value) => typeof value === 'string' && value.length > 0);

type DeliveryAddressInput =
  | NonNullable<RentFormValues['delivery']>['address']
  | null
  | undefined;

const formatDeliveryAddressLine = (
  address?: DeliveryAddressInput,
): string | null => {
  const normalized = [
    normalizeText(address?.country),
    normalizeText(address?.postalCode),
    normalizeText(address?.city),
    normalizeText(address?.street),
    normalizeText(address?.doorNumber),
  ].filter((segment): segment is string => Boolean(segment));

  return normalized.length > 0 ? normalized.join(', ') : null;
};

const selectBookingRequestRecord = (
  raw: unknown,
  offerIndex?: number,
): BookingRequestPricingRecord | null => {
  if (!raw || typeof raw !== 'object') return null;
  if (Array.isArray(raw)) {
    const safeIndex =
      typeof offerIndex === 'number' &&
      Number.isInteger(offerIndex) &&
      offerIndex >= 0
        ? offerIndex
        : 0;
    const selected = raw[safeIndex] ?? raw[0];
    if (!selected || typeof selected !== 'object' || Array.isArray(selected)) {
      return null;
    }
    return selected as BookingRequestPricingRecord;
  }
  return raw as BookingRequestPricingRecord;
};

const parsePricingSnapshot = (
  raw: unknown,
  offerIndex?: number,
): PricingSnapshotInput | null => {
  const record = selectBookingRequestRecord(raw, offerIndex);
  if (!record) return null;

  const snapshot = PRICING_FIELDS.reduce<PricingSnapshotInput>(
    (acc, key) => {
      acc[key] = normalizeText(record[key]);
      return acc;
    },
    {
      rentalFee: null,
      insurance: null,
      deposit: null,
      deliveryFee: null,
      extrasFee: null,
      tip: null,
    },
  );

  return hasAnyValue(Object.values(snapshot)) ? snapshot : null;
};

const loadPricingSnapshot = async (
  quoteId: string | undefined,
  offerIndex?: number,
): Promise<PricingSnapshotInput | null | undefined> => {
  if (!quoteId) return undefined;

  try {
    const quote = await prisma.contactQuote.findUnique({
      where: { id: quoteId },
      select: { bookingRequestData: true },
    });

    return parsePricingSnapshot(quote?.bookingRequestData, offerIndex);
  } catch (error) {
    console.error('Failed to load pricing snapshot from quote', error);
    return null;
  }
};

const syncBookingAuxTables = async (
  bookingId: string,
  formData: RentFormValues,
  pricingSnapshot: PricingSnapshotInput | null | undefined,
): Promise<void> => {
  const prismaAny = prisma as any;
  const deliveryTable = prismaAny?.bookingDeliveryDetails;
  const pricingTable = prismaAny?.bookingPricingSnapshots;

  if (
    !deliveryTable ||
    typeof deliveryTable.upsert !== 'function' ||
    !pricingTable ||
    typeof pricingTable.upsert !== 'function'
  ) {
    return;
  }

  try {
    const delivery = formData.delivery;
    const deliveryData = {
      placeType: normalizeText(delivery?.placeType),
      locationName: normalizeText(delivery?.locationName),
      addressLine: formatDeliveryAddressLine(delivery?.address),
      arrivalFlight: normalizeText(delivery?.arrivalFlight),
      departureFlight: normalizeText(delivery?.departureFlight),
      arrivalHour: normalizeText(delivery?.arrivalHour),
      arrivalMinute: normalizeText(delivery?.arrivalMinute),
    };
    const hasDeliveryData = hasAnyValue(Object.values(deliveryData));

    if (hasDeliveryData) {
      await deliveryTable.upsert({
        where: { bookingId },
        update: {
          ...deliveryData,
          updatedAt: new Date(),
        },
        create: {
          bookingId,
          ...deliveryData,
        },
      });
    } else if (typeof deliveryTable.deleteMany === 'function') {
      await deliveryTable.deleteMany({ where: { bookingId } });
    }

    if (pricingSnapshot !== undefined) {
      if (pricingSnapshot) {
        await pricingTable.upsert({
          where: { bookingId },
          update: {
            ...pricingSnapshot,
            updatedAt: new Date(),
          },
          create: {
            bookingId,
            ...pricingSnapshot,
          },
        });
      } else if (typeof pricingTable.deleteMany === 'function') {
        await pricingTable.deleteMany({ where: { bookingId } });
      }
    }
  } catch (error) {
    console.error('Failed to sync booking aux tables', error);
  }
};

export const RentAction = async (values: RentFormValues) => {
  const validatedFields = await RentSchema.safeParseAsync(values);

  if (!validatedFields.success) {
    return { error: 'Hibás adatok. Kérjük próbáld meg újból!' };
  }

  const locale = resolveLocale(validatedFields.data.locale ?? DEFAULT_LOCALE);
  const tEmail = await getTranslations({ locale, namespace: 'Emails' });
  const tRentForm = await getTranslations({ locale, namespace: 'RentForm' });
  const pdfBuffer = await buildRentPdf(validatedFields.data);
  const pdfFileName = `berles-${validatedFields.data.rentalPeriod.startDate}-${validatedFields.data.contact.name}.pdf`;
  const contactPhone = validatedFields.data.driver?.[0]?.phoneNumber ?? null;
  const rentIdFromPayload = validatedFields.data.rentId ?? null;
  const isModifyRequest = Boolean(rentIdFromPayload);
  let humanId: string | null = null;
  const pricingSnapshot = await loadPricingSnapshot(
    validatedFields.data.quoteId,
    validatedFields.data.offer,
  );

  type DeliveryAddress =
    | NonNullable<RentFormValues['delivery']>['address']
    | null
    | undefined;

  const formatAddress = (address?: DeliveryAddress): string => {
    if (!address) return 'n/a';
    const parts = [
      address.country,
      address.postalCode,
      address.city,
      address.street,
      address.doorNumber,
    ]
      .filter(
        (segment) => typeof segment === 'string' && segment.trim().length > 0,
      )
      .map((segment) => (segment as string).trim());
    return parts.length > 0 ? parts.join(', ') : 'n/a';
  };

  const normalizeRowValue = (value?: string | number | null): string => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? String(value) : 'n/a';
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : 'n/a';
    }
    return 'n/a';
  };

  const formatFriendlyDate = (value?: string): string => {
    if (!value) return 'n/a';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatExtrasLabel = (values?: string[]): string => {
    const extrasList = values ?? [];
    if (extrasList.length === 0) return 'n/a';
    return extrasList
      .map((extra) => {
        try {
          return tRentForm(`extras.options.${extra}`);
        } catch {
          return extra.replace(/_/g, ' ');
        }
      })
      .join(', ');
  };

  const formatDeliveryType = (type?: string): string => {
    if (!type) return 'n/a';
    if (type === 'airport') {
      return tRentForm('sections.delivery.fields.placeType.airport');
    }
    if (type === 'accommodation') {
      return tRentForm('sections.delivery.fields.placeType.accommodation');
    }
    if (type === 'office') {
      return tRentForm('sections.delivery.fields.placeType.office');
    }
    return type;
  };

  const toDateTime = (value?: string | null): string | null => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  };

  const normalizeRentalDays = (value?: number | null): number | null => {
    if (typeof value !== 'number') return null;
    return Number.isFinite(value) && value > 0 ? value : null;
  };

  const computeReminderDate = (value?: string | null): Date | undefined => {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }
    const reminderTime = parsed.getTime() - 48 * 60 * 60 * 1000;
    return new Date(reminderTime);
  };

  const requestedPeriod = `${formatFriendlyDate(
    validatedFields.data.rentalPeriod.startDate,
  )} → ${formatFriendlyDate(validatedFields.data.rentalPeriod.endDate)}`;

  let rentRecordId: string | null = rentIdFromPayload;
  const rentReminderAt = computeReminderDate(
    validatedFields.data.rentalPeriod.startDate,
  );

  if (isModifyRequest && rentIdFromPayload) {
    try {
      const existingRent = await prisma.rentRequest.findUnique({
        where: { id: rentIdFromPayload },
        select: {
          id: true,
          locale: true,
          carId: true,
          humanId: true,
          quoteId: true,
          contactName: true,
          contactEmail: true,
          contactPhone: true,
          rentalStart: true,
          rentalEnd: true,
          rentalDays: true,
          BookingDeliveryDetails: {
            select: {
              placeType: true,
              locationName: true,
              arrivalFlight: true,
              departureFlight: true,
              arrivalHour: true,
              arrivalMinute: true,
            },
          },
          updated: true,
        },
      });
      if (!existingRent) {
        return { error: 'A megadott foglalás nem található.' };
      }
      humanId = existingRent.humanId ?? existingRent.id;
      const rentChanges = summarizeRentChanges(
        toCoreRentSnapshotFromRecord(existingRent),
        toCoreRentSnapshotFromForm(validatedFields.data, locale),
      );
      const updatedMarker = appendRentUpdateLog(existingRent.updated ?? null, {
        action: 'self-service:modify',
        rentId: rentIdFromPayload,
        changes: rentChanges,
      });

      await prisma.rentRequest.update({
        where: { id: rentIdFromPayload },
        data: {
          locale,
          carId: validatedFields.data.carId ?? null,
          quoteId: validatedFields.data.quoteId ?? null,
          contactName: validatedFields.data.contact.name,
          contactEmail: validatedFields.data.contact.email,
          contactPhone,
          rentalStart: toDateTime(validatedFields.data.rentalPeriod.startDate),
          rentalEnd: toDateTime(validatedFields.data.rentalPeriod.endDate),
          rentalDays: normalizeRentalDays(validatedFields.data.rentalDays),
          updated: updatedMarker,
          payload: buildCompactRentPayload(validatedFields.data),
        },
      });
      await syncBookingAuxTables(
        rentIdFromPayload,
        validatedFields.data,
        pricingSnapshot,
      );

      await recordNotification({
        type: 'rent_request',
        title: 'Bérlés módosítva',
        description: `${validatedFields.data.contact.name} (${validatedFields.data.contact.email}) frissítette a foglalását – ${requestedPeriod}`,
        href: `/${rentIdFromPayload}`,
        tone: 'info',
        referenceId: rentIdFromPayload,
        metadata: {
          rentId: rentIdFromPayload,
          humanId,
          quoteId: validatedFields.data.quoteId ?? existingRent.quoteId ?? null,
          carId: validatedFields.data.carId ?? null,
          rentalStart: validatedFields.data.rentalPeriod.startDate,
          rentalEnd: validatedFields.data.rentalPeriod.endDate,
          action: 'modify',
          changes: rentChanges,
        },
      });
    } catch (error) {
      console.error('Failed to update rent request', error);
      return {
        error: 'Nem sikerült módosítani a foglalást. Kérjük, próbáld újra.',
      };
    }
  } else {
    humanId = await getNextHumanId('RentRequests');
    try {
      const createdRent = await prisma.rentRequest.create({
        data: {
          locale,
          carId: validatedFields.data.carId ?? null,
          quoteId: validatedFields.data.quoteId ?? null,
          humanId,
          contactName: validatedFields.data.contact.name,
          contactEmail: validatedFields.data.contact.email,
          contactPhone,
          rentalStart: toDateTime(validatedFields.data.rentalPeriod.startDate),
          rentalEnd: toDateTime(validatedFields.data.rentalPeriod.endDate),
          rentalDays: normalizeRentalDays(validatedFields.data.rentalDays),
          status: RENT_STATUS_NEW,
          updated: null,
          payload: buildCompactRentPayload(validatedFields.data),
        },
        select: { id: true },
      });
      rentRecordId = createdRent.id;
      await syncBookingAuxTables(
        createdRent.id,
        validatedFields.data,
        pricingSnapshot,
      );

      const rentNotificationHref = rentRecordId ? `/${rentRecordId}` : '/';

      await recordNotification({
        type: 'rent_request',
        title: 'Új bérlési igény érkezett',
        description: `${validatedFields.data.contact.name} (${validatedFields.data.contact.email}) – ${requestedPeriod}`,
        href: rentNotificationHref,
        tone: 'success',
        referenceId: createdRent.id,
        notifyAt: rentReminderAt,
        metadata: {
          rentId: createdRent.id,
          humanId,
          quoteId: validatedFields.data.quoteId ?? null,
          carId: validatedFields.data.carId ?? null,
          rentalStart: validatedFields.data.rentalPeriod.startDate,
          rentalEnd: validatedFields.data.rentalPeriod.endDate,
          action: 'create',
        },
      });

      if (validatedFields.data.quoteId) {
        console.log('val', validatedFields.data);

        try {
          await prisma.contactQuote.update({
            where: { id: validatedFields.data.quoteId },
            data: {
              status: CONTACT_STATUS_QUOTE_ACCEPTED,
              offerAccepted: validatedFields.data.offer ?? null,
              updated: 'RentAction',
            },
          });
        } catch (updateQuoteError) {
          console.error(
            'Failed to mark contact quote as done',
            updateQuoteError,
          );
        }
      }
    } catch (error) {
      console.error('Failed to store rent request', error);
      return {
        error: 'Nem sikerült rögzíteni a foglalást. Kérjük, próbáld újra.',
      };
    }
  }

  const formData = validatedFields.data;
  const period = `${formatFriendlyDate(
    formData.rentalPeriod.startDate,
  )} → ${formatFriendlyDate(formData.rentalPeriod.endDate)}`;
  const rentalDaysValue = formData.rentalDays ?? 'n/a';
  const extrasLabel = formatExtrasLabel(formData.extras);
  const adultsCount =
    formData.adults !== undefined && formData.adults !== null
      ? String(formData.adults)
      : 'n/a';
  const childrenCount =
    formData.children && formData.children.length > 0
      ? String(formData.children.length)
      : '0';
  const primaryDriver = formData.driver?.[0];
  const driverNameSegments = [
    primaryDriver?.firstName_1,
    primaryDriver?.lastName_1,
  ].filter(
    (segment) => typeof segment === 'string' && segment.trim().length > 0,
  );
  const driverName =
    driverNameSegments.length > 0 ? driverNameSegments.join(' ') : 'n/a';
  const driverEmail = primaryDriver?.email ?? 'n/a';
  const driverPhone = primaryDriver?.phoneNumber ?? 'n/a';
  const delivery = formData.delivery;
  const arrivalFlight = delivery?.arrivalFlight ?? 'n/a';
  const departureFlight = delivery?.departureFlight ?? 'n/a';
  const deliveryPlaceType = formatDeliveryType(delivery?.placeType);
  const deliveryLocationName = delivery?.locationName ?? 'n/a';
  const deliveryAddress = formatAddress(delivery?.address ?? null);
  const invoice = formData.invoice;
  const invoiceAddress = formatAddress(invoice?.location ?? null);
  const invoiceName = invoice?.name ?? formData.contact.name ?? 'n/a';
  const invoiceEmail = invoice?.email ?? formData.contact.email ?? 'n/a';
  const invoicePhone = invoice?.phoneNumber ?? 'n/a';
  const quoteIdValue = formData.quoteId ?? 'n/a';
  const selectedCar =
    formData.carId && typeof formData.carId === 'string'
      ? await getCarById(formData.carId)
      : null;
  const carNameValue = selectedCar
    ? `${selectedCar.manufacturer} ${selectedCar.model}`
    : (formData.carId ?? 'n/a');

  await sendMail({
    to: process.env.MAIL_USER || 'info@zodiacsrentacar.com',
    subject: `Új foglalás | ${validatedFields.data.contact.name} részére`,
    text: 'A csatolt PDF tartalmazza a foglalás részleteit.',
    replyTo: validatedFields.data.contact.email,
    attachments: [
      {
        filename: pdfFileName.replace(/\s+/g, '_'),
        content: pdfBuffer,
      },
    ],
  });

  const emailRowData = [
    { key: 'period', value: period },
    { key: 'rentalDays', value: rentalDaysValue },
    { key: 'adults', value: adultsCount },
    { key: 'children', value: childrenCount },
    { key: 'extras', value: extrasLabel },
    { key: 'contactName', value: formData.contact.name },
    { key: 'contactEmail', value: formData.contact.email },
    { key: 'driverName', value: driverName },
    { key: 'driverPhone', value: driverPhone },
    { key: 'driverEmail', value: driverEmail },
    { key: 'deliveryType', value: deliveryPlaceType },
    { key: 'deliveryLocation', value: deliveryLocationName },
    { key: 'deliveryAddress', value: deliveryAddress },
    { key: 'arrivalFlight', value: arrivalFlight },
    { key: 'departureFlight', value: departureFlight },
    { key: 'invoiceName', value: invoiceName },
    { key: 'invoiceEmail', value: invoiceEmail },
    { key: 'invoicePhone', value: invoicePhone },
    { key: 'invoiceAddress', value: invoiceAddress },
    { key: 'carModel', value: carNameValue },
    { key: 'quoteId', value: quoteIdValue },
  ] as const;

  const localizedRows = emailRowData.map(({ key, value }) => ({
    label: tEmail(`rent.rows.${key}`),
    value: normalizeRowValue(value),
  }));

  const emailTextLines = [
    tEmail('rent.intro'),
    '',
    ...localizedRows.map(({ label, value }) => `${label}: ${value}`),
  ];

  await sendMail({
    to:
      validatedFields.data.contact.email ||
      validatedFields.data.driver[0].email,
    subject: tEmail('rent.subject'),
    text: emailTextLines
      .filter((line): line is string => typeof line === 'string')
      .join('\n'),
    html: renderBrandEmail({
      title: tEmail('rent.title'),
      intro: tEmail('rent.intro'),
      rows: localizedRows,
      footerNote: tEmail('rent.footerNote'),
      securityNote: tEmail('securityDisclaimer'),
    }),
  });

  return {
    success: true,
    rentId: rentRecordId ?? rentIdFromPayload ?? undefined,
  };
};

type RentChangeMap = Record<
  string,
  {
    before: string | null;
    after: string | null;
  }
>;

type CoreRentSnapshot = Record<string, string | null>;

type ExistingRentRecord = {
  locale: string;
  carId: string | null;
  quoteId: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  rentalStart: Date | null;
  rentalEnd: Date | null;
  rentalDays: number | null;
  BookingDeliveryDetails: {
    placeType: string | null;
    locationName: string | null;
    arrivalFlight: string | null;
    departureFlight: string | null;
    arrivalHour: string | null;
    arrivalMinute: string | null;
  } | null;
};

function summarizeRentChanges(
  previous: CoreRentSnapshot,
  next: CoreRentSnapshot,
): RentChangeMap {
  const changes: RentChangeMap = {};
  const allKeys = new Set([
    ...Object.keys(previous),
    ...Object.keys(next),
  ]);

  for (const key of allKeys) {
    const before = previous[key] ?? null;
    const after = next[key] ?? null;
    if (before === after) continue;
    changes[key] = { before, after };
  }

  return changes;
}

function normalizeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

function normalizeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return parsed.toISOString().slice(0, 10);
}

function toCoreRentSnapshotFromRecord(record: ExistingRentRecord): CoreRentSnapshot {
  return {
    locale: normalizeValue(record.locale),
    carId: normalizeValue(record.carId),
    quoteId: normalizeValue(record.quoteId),
    contactName: normalizeValue(record.contactName),
    contactEmail: normalizeValue(record.contactEmail),
    contactPhone: normalizeValue(record.contactPhone),
    rentalStart: normalizeDate(record.rentalStart),
    rentalEnd: normalizeDate(record.rentalEnd),
    rentalDays: normalizeValue(record.rentalDays),
    deliveryPlaceType: normalizeValue(record.BookingDeliveryDetails?.placeType),
    deliveryLocationName: normalizeValue(
      record.BookingDeliveryDetails?.locationName,
    ),
    deliveryArrivalFlight: normalizeValue(
      record.BookingDeliveryDetails?.arrivalFlight,
    ),
    deliveryDepartureFlight: normalizeValue(
      record.BookingDeliveryDetails?.departureFlight,
    ),
    deliveryArrivalHour: normalizeValue(record.BookingDeliveryDetails?.arrivalHour),
    deliveryArrivalMinute: normalizeValue(
      record.BookingDeliveryDetails?.arrivalMinute,
    ),
  };
}

function toCoreRentSnapshotFromForm(
  values: RentFormValues,
  locale: string,
): CoreRentSnapshot {
  const delivery = values.delivery;
  return {
    locale: normalizeValue(locale),
    carId: normalizeValue(values.carId),
    quoteId: normalizeValue(values.quoteId),
    contactName: normalizeValue(values.contact?.name),
    contactEmail: normalizeValue(values.contact?.email),
    contactPhone: normalizeValue(values.driver?.[0]?.phoneNumber),
    rentalStart: normalizeDate(values.rentalPeriod?.startDate),
    rentalEnd: normalizeDate(values.rentalPeriod?.endDate),
    rentalDays: normalizeValue(values.rentalDays),
    deliveryPlaceType: normalizeValue(delivery?.placeType),
    deliveryLocationName: normalizeValue(delivery?.locationName),
    deliveryArrivalFlight: normalizeValue(delivery?.arrivalFlight),
    deliveryDepartureFlight: normalizeValue(delivery?.departureFlight),
    deliveryArrivalHour: normalizeValue(delivery?.arrivalHour),
    deliveryArrivalMinute: normalizeValue(delivery?.arrivalMinute),
  };
}
