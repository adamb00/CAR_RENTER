import { PreferredChannel } from '@/components/contact/quote.types';
import { RentFormValues } from '@/schemas/RentSchema';
import { useMemo } from 'react';
import { DATE_LOCALE_MAP } from './date_locale_map';

export const SECTION_ORDER: (keyof RentFormValues)[] = [
  'adults',
  'children',
  'driver',
  'contact',
  'invoice',
  'delivery',
  'rentalPeriod',
  'extras',
  'tax',
  'consents',
];

export const RENT_ID_REGEX = /^[0-9a-fA-F-]{36}$/;
export const HUMAN_ID_REGEX = /^[0-9]{4}\/[0-9A-Za-z-]+$/;

export const BOOKING_DATA_FIELDS = [
  'rentalFee',
  'deposit',
  'insurance',
  'extrasFee',
  'deliveryFee',
  'bookingLink',
  'adminName',
] as const;

export const CHANNELS: PreferredChannel[] = [
  'email',
  'phone',
  'whatsapp',
  'viber',
];

export const EXTRA_VALUES = [
  'szorfo_deszka_rogzito',
  'gyerekules',
  'kiszallitas',
  'alap_csomag',
  'energia_csomag',
  'esti_erkezes_csomag',
] as const;

export const today = useMemo(() => {
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  return current;
}, []);

export const oneYearAhead = useMemo(() => {
  const future = new Date(today);
  future.setFullYear(future.getFullYear() + 1);
  return future;
}, [today]);
