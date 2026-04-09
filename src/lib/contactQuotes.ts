import { type ContactStatus } from '@/lib/requestStatus';
import { prisma } from '@/lib/prisma';
import type {
  BookingRequestRecord,
  ContactQuoteRecord,
} from '@/lib/contactQuotes-shared';

const toIsoString = (
  value: Date | string | null | undefined
): string | null => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return null;
};

const normalizeDelivery = (value: unknown): ContactQuoteRecord['delivery'] => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const candidate = value as Record<string, unknown>;
  const delivery: ContactQuoteRecord['delivery'] = {};
  if (typeof candidate.placeType === 'string') {
    delivery.placeType = candidate.placeType;
  }
  if (typeof candidate.locationName === 'string') {
    delivery.locationName = candidate.locationName;
  }
  if (typeof candidate.address === 'object' && candidate.address !== null) {
    const address = candidate.address as Record<string, unknown>;
    delivery.address = {
      country:
        typeof address.country === 'string' ? address.country : undefined,
      postalCode:
        typeof address.postalCode === 'string' ? address.postalCode : undefined,
      city: typeof address.city === 'string' ? address.city : undefined,
      street: typeof address.street === 'string' ? address.street : undefined,
      doorNumber:
        typeof address.doorNumber === 'string' ? address.doorNumber : undefined,
    };
  }
  if (delivery.placeType || delivery.locationName || delivery.address) {
    return delivery;
  }
  return undefined;
};

const bookingRequestFields = [
  'carId',
  'locale',
  'carName',
  'deposit',
  'adminName',
  'extrasFee',
  'insurance',
  'rentalEnd',
  'rentalFee',
  'bookingLink',
  'contactName',
  'deliveryFee',
  'rentalStart',
  'contactEmail',
] as const;

const normalizeBookingRequestData = (
  value: unknown
): ContactQuoteRecord['bookingRequestData'] => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const normalizeRecord = (
    candidate: Record<string, unknown>
  ): BookingRequestRecord | null => {
    const normalized: BookingRequestRecord = {};
    let hasValue = false;

    for (const field of bookingRequestFields) {
      const rawValue = candidate[field];
      if (typeof rawValue === 'string') {
        normalized[field] = rawValue;
        hasValue = true;
      }
    }

    return hasValue ? normalized : null;
  };

  if (Array.isArray(value)) {
    const items = value
      .map((entry) =>
        entry && typeof entry === 'object' && !Array.isArray(entry)
          ? normalizeRecord(entry as Record<string, unknown>)
          : null
      )
      .filter(Boolean) as BookingRequestRecord[];
    return items.length > 0 ? items : undefined;
  }

  return normalizeRecord(value as Record<string, unknown>) ?? undefined;
};

export async function getContactQuoteById(
  quoteId: string
): Promise<ContactQuoteRecord | null> {
  const record = await prisma.contactQuote.findUnique({
    where: { id: quoteId },
    select: {
      id: true,
      locale: true,
      name: true,
      email: true,
      phone: true,
      preferredChannel: true,
      extras: true,
      status: true,
      rentalStart: true,
      rentalEnd: true,
      rentalDays: true,
      arrivalFlight: true,
      departureFlight: true,
      partySize: true,
      children: true,
      cars: true,
      residenceCard: true,
      carId: true,
      delivery: true,
      bookingRequestData: true,
    },
  });

  if (!record) {
    return null;
  }

  return {
    id: record.id,
    locale: record.locale,
    name: record.name,
    email: record.email,
    phone: record.phone,
    preferredChannel:
      record.preferredChannel as ContactQuoteRecord['preferredChannel'],
    extras: record.extras ?? [],
    rentalStart: toIsoString(record.rentalStart),
    rentalEnd: toIsoString(record.rentalEnd),
    rentalDays: record.rentalDays ?? null,
    arrivalFlight: record.arrivalFlight ?? null,
    departureFlight: record.departureFlight ?? null,
    partySize: record.partySize ?? null,
    children: record.children ?? null,
    cars: record.cars ?? null,
    residenceCard: record.residenceCard ?? [],
    carId: record.carId ?? null,
    delivery: normalizeDelivery(record.delivery),
    status: record.status as ContactStatus,
    bookingRequestData: normalizeBookingRequestData(record.bookingRequestData),
  };
}

export type { ContactQuoteRecord } from '@/lib/contactQuotes-shared';
