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
export type QuoteRequestFormProps = {
  locale: string;
  selectedCar?: { id: string; name: string } | null;
  prefill?: {
    name?: string;
    email?: string;
  };
};
