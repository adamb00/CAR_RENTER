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

export const RESIDENT_CARD_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const RESIDENT_CARD_MAX_SIZE_MB =
  RESIDENT_CARD_MAX_SIZE_BYTES / (1024 * 1024);
export const RESIDENT_CARD_ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;
export const RESIDENT_CARD_INPUT_ACCEPT = '.pdf,.jpg,.jpeg,.png';

export type ResidentCardMimeType =
  (typeof RESIDENT_CARD_ACCEPTED_TYPES)[number];

export type ResidentCardUpload = {
  name: string;
  type: string;
  content: string;
  size: number;
};

export function inferResidentCardMimeType(
  fileName: string
): ResidentCardMimeType | null {
  const normalizedName = fileName.trim().toLowerCase();
  if (normalizedName.endsWith('.pdf')) return 'application/pdf';
  if (normalizedName.endsWith('.jpg') || normalizedName.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (normalizedName.endsWith('.png')) return 'image/png';
  return null;
}

export function normalizeResidentCardMimeType(
  type: string | undefined,
  fileName: string
): ResidentCardMimeType | null {
  if (
    type &&
    RESIDENT_CARD_ACCEPTED_TYPES.includes(type as ResidentCardMimeType)
  ) {
    return type as ResidentCardMimeType;
  }

  return inferResidentCardMimeType(fileName);
}

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
