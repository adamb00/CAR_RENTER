import { prisma } from '@/lib/prisma';
import { RequestStatus } from '@/lib/requestStatus';

export type ContactQuoteRecord = {
  id: string;
  locale: string;
  name: string;
  email: string;
  phone: string;
  preferredChannel: 'email' | 'phone' | 'whatsapp' | 'viber';
  extras: string[];
  rentalStart?: string | null;
  rentalEnd?: string | null;
  arrivalFlight?: string | null;
  departureFlight?: string | null;
  partySize?: string | null;
  children?: string | null;
  carId?: string | null;
  delivery?: {
    placeType?: string;
    locationName?: string;
    address?: {
      country?: string;
      postalCode?: string;
      city?: string;
      street?: string;
      doorNumber?: string;
    };
  };
  status: RequestStatus;
};

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

const normalizeDelivery = (
  value: unknown
): ContactQuoteRecord['delivery'] => {
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
      country: typeof address.country === 'string' ? address.country : undefined,
      postalCode:
        typeof address.postalCode === 'string' ? address.postalCode : undefined,
      city: typeof address.city === 'string' ? address.city : undefined,
      street: typeof address.street === 'string' ? address.street : undefined,
      doorNumber:
        typeof address.doorNumber === 'string' ? address.doorNumber : undefined,
    };
  }
  if (
    delivery.placeType ||
    delivery.locationName ||
    delivery.address
  ) {
    return delivery;
  }
  return undefined;
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
      arrivalFlight: true,
      departureFlight: true,
      partySize: true,
      children: true,
      carId: true,
      delivery: true,
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
    arrivalFlight: record.arrivalFlight ?? null,
    departureFlight: record.departureFlight ?? null,
    partySize: record.partySize ?? null,
    children: record.children ?? null,
    carId: record.carId ?? null,
    delivery: normalizeDelivery(record.delivery),
    status: record.status as RequestStatus,
  };
}
