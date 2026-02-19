import { BOOKING_DATA_FIELDS } from '@/lib/constants';
import { Prisma } from '@prisma/client';

export type BookingDataKey = (typeof BOOKING_DATA_FIELDS)[number];

export type RentCompletionRecord = {
  id: string;
  humanId: string | null;
  contactEmail: string;
  contactName: string;
  contactPhone: string | null;
  rentalStart: Date | null;
  rentalEnd: Date | null;
  rentalDays: number | null;
  payload: Prisma.JsonValue | null;
  carId: string | null;
  quoteId: string | null;
  BookingDeliveryDetails: {
    placeType: string | null;
    locationName: string | null;
    addressLine: string | null;
    arrivalFlight: string | null;
    departureFlight: string | null;
    arrivalHour: string | null;
    arrivalMinute: string | null;
  } | null;
  contactQuote: {
    bookingRequestData: Prisma.JsonValue | null;
  } | null;
};
