'use server';

import { buildRentPdf } from '@/lib/build-rent-pdf';
import { sendMail } from '@/lib/mailer';
import { RentFormValues, RentSchema } from '@/schemas/RentSchema';
import z from 'zod';
import { renderBrandEmail } from '@/lib/emailTemplates';
import { resolveLocale } from '@/lib/seo/seo';
import { getTranslations } from 'next-intl/server';
import { DEFAULT_LOCALE } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { getNextHumanId } from '@/lib/humanId';
import {
  CONTACT_STATUS_QUOTE_ACCEPTED,
  RENT_STATUS_FORM_SUBMITTED,
  RENT_STATUS_REGISTERED,
} from '@/lib/requestStatus';
import { getCarById } from '@/lib/cars';
import { recordNotification } from '@/lib/notifications';
import { appendRentUpdateLog } from '@/lib/rentUpdateLog';

export const RentAction = async (values: z.infer<RentFormValues>) => {
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
    return type;
  };

  const toDateTime = (value?: string | null): string | null => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
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
    validatedFields.data.rentalPeriod.startDate
  )} → ${formatFriendlyDate(validatedFields.data.rentalPeriod.endDate)}`;

  let rentRecordId: string | null = rentIdFromPayload;
  const rentReminderAt = computeReminderDate(
    validatedFields.data.rentalPeriod.startDate
  );

  if (isModifyRequest && rentIdFromPayload) {
    try {
      const existingRent = await prisma.rentRequest.findUnique({
        where: { id: rentIdFromPayload },
        select: {
          id: true,
          humanId: true,
          quoteId: true,
          contactName: true,
          contactEmail: true,
          contactPhone: true,
          rentalStart: true,
          rentalEnd: true,
          payload: true,
          updated: true,
        },
      });
      if (!existingRent) {
        return { error: 'A megadott foglalás nem található.' };
      }
      humanId = existingRent.humanId ?? existingRent.id;
      const previousPayload = isRentFormValues(existingRent.payload)
        ? (existingRent.payload as RentFormValues)
        : null;
      const rentChanges = summarizeRentChanges(
        previousPayload,
        validatedFields.data,
        {
          contactName: existingRent.contactName,
          contactEmail: existingRent.contactEmail,
          contactPhone: existingRent.contactPhone,
          rentalStart: existingRent.rentalStart,
          rentalEnd: existingRent.rentalEnd,
        }
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
          updated: updatedMarker,
          payload: validatedFields.data,
        },
      });

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
          status: RENT_STATUS_FORM_SUBMITTED,
          updated: null,
          payload: validatedFields.data,
        },
        select: { id: true },
      });
      rentRecordId = createdRent.id;

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
        try {
          await prisma.contactQuote.update({
            where: { id: validatedFields.data.quoteId },
            data: {
              status: CONTACT_STATUS_QUOTE_ACCEPTED,
              updated: 'RentAction',
            },
          });
        } catch (updateQuoteError) {
          console.error(
            'Failed to mark contact quote as done',
            updateQuoteError
          );
        }
      }
    } catch (error) {
      console.error('Failed to store rent request', error);
    }
  }

  const formData = validatedFields.data;
  const period = `${formatFriendlyDate(
    formData.rentalPeriod.startDate
  )} → ${formatFriendlyDate(formData.rentalPeriod.endDate)}`;
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
    (segment) => typeof segment === 'string' && segment.trim().length > 0
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
    : formData.carId ?? 'n/a';

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

type RentSnapshotFallbacks = {
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  rentalStart?: Date | string | null;
  rentalEnd?: Date | string | null;
};

type RentChangeMap = Record<
  string,
  {
    before: string | null;
    after: string | null;
  }
>;

const isRentFormValues = (value: unknown): value is RentFormValues => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return 'contact' in candidate && 'rentalPeriod' in candidate;
};

function summarizeRentChanges(
  previous: RentFormValues | null,
  next: RentFormValues,
  fallback: RentSnapshotFallbacks
): RentChangeMap {
  const previousRecord = flattenRentForm(previous);
  applyFallbackValues(previousRecord, fallback);
  const nextRecord = flattenRentForm(next);
  const ignoredKeys = new Set(['rentId']);
  const changes: RentChangeMap = {};
  const allKeys = new Set([
    ...Object.keys(previousRecord),
    ...Object.keys(nextRecord),
  ]);

  for (const key of allKeys) {
    if (ignoredKeys.has(key)) continue;
    const before = previousRecord[key] ?? null;
    const after = nextRecord[key] ?? null;
    if (before === after) continue;
    changes[key] = { before, after };
  }

  return changes;
}

type NormalizedRecord = Record<string, string | null>;

function normalizeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function flattenRentForm(value: RentFormValues | null): NormalizedRecord {
  const record: NormalizedRecord = {};
  if (!value) {
    return record;
  }
  Object.entries(value as Record<string, unknown>).forEach(([key, nested]) => {
    flattenValue(nested, key, record);
  });
  return record;
}

function flattenValue(value: unknown, path: string, record: NormalizedRecord) {
  if (value === null || value === undefined) {
    record[path] = null;
    return;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      record[path] = null;
      return;
    }
    value.forEach((item, index) => {
      flattenValue(item, `${path}.${index}`, record);
    });
    return;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      record[path] = null;
      return;
    }
    entries.forEach(([key, nested]) => {
      flattenValue(nested, `${path}.${key}`, record);
    });
    return;
  }
  record[path] = normalizeValue(value);
}

function applyFallbackValues(
  record: NormalizedRecord,
  fallback: RentSnapshotFallbacks
) {
  const apply = (key: string, value: unknown) => {
    const normalized = normalizeValue(value);
    if (normalized === null) return;
    if (record[key] === undefined) {
      record[key] = normalized;
    }
  };

  apply('contact.name', fallback.contactName);
  apply('contact.email', fallback.contactEmail);
  apply('driver.0.phoneNumber', fallback.contactPhone);
  apply('driver.0.email', fallback.contactEmail);
  apply('rentalPeriod.startDate', fallback.rentalStart);
  apply('rentalPeriod.endDate', fallback.rentalEnd);
}
