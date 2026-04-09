import type { ContactStatus } from '@/lib/requestStatus';
import type { ResidentCardUpload } from '@/components/contact/quote.types';

export type BookingRequestRecord = {
  carId?: string;
  locale?: string;
  carName?: string;
  deposit?: string;
  adminName?: string;
  extrasFee?: string;
  insurance?: string;
  rentalEnd?: string;
  rentalFee?: string;
  bookingLink?: string;
  contactName?: string;
  deliveryFee?: string;
  rentalStart?: string;
  contactEmail?: string;
};

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
  rentalDays?: number | null;
  arrivalFlight?: string | null;
  departureFlight?: string | null;
  partySize?: string | null;
  children?: string | null;
  cars?: string | null;
  residenceCard: string[];
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
  status: ContactStatus;
  bookingRequestData?: BookingRequestRecord | BookingRequestRecord[];
};

export const parseStoredResidentCard = (
  value: string[] | null | undefined
): ResidentCardUpload | undefined => {
  const storedValue = Array.isArray(value) ? value[0] : undefined;
  if (typeof storedValue !== 'string' || storedValue.trim().length === 0) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(storedValue) as Partial<ResidentCardUpload>;
    if (
      typeof parsed?.name !== 'string' ||
      typeof parsed?.type !== 'string' ||
      typeof parsed?.content !== 'string' ||
      typeof parsed?.size !== 'number' ||
      !Number.isFinite(parsed.size) ||
      parsed.size <= 0
    ) {
      return undefined;
    }

    return {
      name: parsed.name,
      type: parsed.type,
      content: parsed.content,
      size: parsed.size,
    };
  } catch {
    return undefined;
  }
};
