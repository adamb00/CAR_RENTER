export type ContactQuotePayload = {
  locale: string;
  name: string;
  email: string;
  phone: string;
  preferredChannel: 'email' | 'phone' | 'whatsapp' | 'viber';
  rentalStart?: string;
  rentalEnd?: string;
  arrivalFlight?: string | null;
  departureFlight?: string | null;
  partySize?: string;
  children?: string;
  carId?: string;
  extras?: string[];
  delivery?: {
    placeType?: 'accommodation' | 'airport';
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
