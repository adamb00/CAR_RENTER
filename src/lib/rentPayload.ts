import { RentFormValues } from '@/schemas/RentSchema';

type DeliveryAddress = NonNullable<
  NonNullable<RentFormValues['delivery']>['address']
>;

export type CompactRentPayload = {
  v: 2;
  adults: number | null;
  children: RentFormValues['children'];
  extras: string[];
  driver: RentFormValues['driver'];
  invoice: RentFormValues['invoice'];
  tax: RentFormValues['tax'];
  consents: RentFormValues['consents'];
  deliveryAddress: DeliveryAddress | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const isLegacyRentPayload = (value: unknown): value is RentFormValues => {
  if (!isRecord(value)) return false;
  return (
    'contact' in value &&
    'driver' in value &&
    'rentalPeriod' in value &&
    'invoice' in value
  );
};

export const isCompactRentPayload = (
  value: unknown,
): value is CompactRentPayload => {
  if (!isRecord(value)) return false;
  return value.v === 2;
};

export const parseRentPayload = (value: unknown): {
  legacy: RentFormValues | null;
  compact: CompactRentPayload | null;
} => {
  if (isLegacyRentPayload(value)) {
    return { legacy: value, compact: null };
  }
  if (isCompactRentPayload(value)) {
    return { legacy: null, compact: value };
  }
  return { legacy: null, compact: null };
};

export const buildCompactRentPayload = (
  values: RentFormValues,
): CompactRentPayload => ({
  v: 2,
  adults: typeof values.adults === 'number' ? values.adults : null,
  children: Array.isArray(values.children) ? values.children : [],
  extras: Array.isArray(values.extras) ? values.extras : [],
  driver: Array.isArray(values.driver) ? values.driver : [],
  invoice: values.invoice,
  tax: values.tax,
  consents: values.consents,
  deliveryAddress: values.delivery?.address ?? null,
});
