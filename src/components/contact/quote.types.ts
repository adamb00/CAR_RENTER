export type DeliveryInfo = {
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

export type PreferredChannel = 'email' | 'phone' | 'whatsapp' | 'viber';
export type QuoteCarOption = {
  id: string;
  name: string;
  seats: number;
  smallLuggage: number;
  largeLuggage: number;
};

export type QuoteRequestFormProps = {
  locale: string;
  selectedCar?: { id: string; name: string } | null;
  availableCars: QuoteCarOption[];
  prefill?: {
    name?: string;
    email?: string;
  };
};
