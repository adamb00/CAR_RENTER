import { BOOKING_DATA_FIELDS } from '@/lib/constants';
import { Prisma } from '@prisma/client';

export type BookingDataKey = (typeof BOOKING_DATA_FIELDS)[number];

export type RentCompletionRecord = {
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
