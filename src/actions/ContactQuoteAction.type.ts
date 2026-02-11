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
