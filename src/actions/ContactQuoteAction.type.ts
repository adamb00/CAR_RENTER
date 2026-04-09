import type { ResidentCardUpload } from '@/components/contact/quote.types';

export type ContactQuotePayload = {
  locale: string;
  name: string;
  email: string;
  phone: string;
  preferredChannel: 'email' | 'phone' | 'whatsapp' | 'viber';
  rentalStart?: string;
  rentalEnd?: string;
  rentalDays?: number;
  arrivalFlight?: string | null;
  departureFlight?: string | null;
  partySize?: string;
  children?: string;
  cars?: string;
  residentCard?: ResidentCardUpload;
  carId?: string;
  extras?: string[];
  delivery?: {
    placeType?: 'accommodation' | 'airport' | 'office';
    locationName?: string;
    address?: {
      country?: string;
      postalCode?: string;
      city?: string;
      street?: string;
      doorNumber?: string;
    };
  };
};
