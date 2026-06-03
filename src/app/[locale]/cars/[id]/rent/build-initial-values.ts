import {
  parseStoredResidentCard,
  type ContactQuoteRecord,
} from '@/lib/contactQuotes-shared';
import type { RentFormValues } from './rent.types';
import { createEmptyDriver } from '@/hooks/useDrivers';
import { parsePositiveInt, splitName } from './helpers';

const toDeliveryPlaceType = (
  value?: string | null,
): 'accommodation' | 'airport' | 'office' | undefined => {
  if (value === 'accommodation' || value === 'airport' || value === 'office') {
    return value;
  }

  return undefined;
};

export const buildInitialValues = (
  quote: ContactQuoteRecord | null | undefined,
  locale: string,
  carId: string
): RentFormValues => {
  const adultsFromQuote = parsePositiveInt(quote?.partySize);
  const childrenCount = parsePositiveInt(quote?.children);
  const rentalDaysFromQuote =
    typeof quote?.rentalDays === 'number' ? quote.rentalDays : undefined;
  const childrenArray =
    childrenCount && childrenCount > 0
      ? Array.from({ length: childrenCount }).map(() => ({
          age: undefined,
          height: undefined,
        }))
      : [];
  const driver = createEmptyDriver();
  const { firstName, lastName } = splitName(quote?.name);
  const quoteDelivery = quote?.delivery;

  return {
    locale,
    carId,
    quoteId: quote?.id,
    hasQuoteAccommodation: Boolean(quote?.accommodationId),
    rentId: undefined,
    extras: [],
    cars: quote?.cars ?? '',
    residentCard: parseStoredResidentCard(quote?.residenceCard),
    adults: adultsFromQuote,
    children: childrenArray,
    rentalPeriod: {
      startDate: quote?.rentalStart ?? '',
      endDate: quote?.rentalEnd ?? '',
    },
    rentalDays: rentalDaysFromQuote,
    driver: [
      {
        ...driver,
        firstName_1: firstName ?? driver.firstName_1,
        lastName_1: lastName ?? driver.lastName_1,
        phoneNumber: quote?.phone ?? driver.phoneNumber,
        email: quote?.email ?? driver.email,
      },
    ],
    contact: {
      same: false,
      name: quote?.name ?? '',
      email: quote?.email ?? '',
    },
    invoice: {
      same: false,
      name: quote?.name ?? '',
      phoneNumber: quote?.phone ?? '',
      email: quote?.email ?? '',
      location: {
        country: '',
        postalCode: '',
        city: '',
        street: '',
        doorNumber: '',
      },
    },
    delivery: {
      same: false,
      placeType: toDeliveryPlaceType(quoteDelivery?.placeType),
      locationName: quoteDelivery?.locationName ?? '',
      arrivalHour: '',
      arrivalMinute: '',
      arrivalFlight: quote?.arrivalFlight ?? '',
      departureFlight: quote?.departureFlight ?? '',
      address: {
        country: quoteDelivery?.address?.country ?? '',
        postalCode: quoteDelivery?.address?.postalCode ?? '',
        city: quoteDelivery?.address?.city ?? '',
        street: quoteDelivery?.address?.street ?? '',
        doorNumber: quoteDelivery?.address?.doorNumber ?? '',
      },
    },
    tax: {
      id: '',
      companyName: '',
    },
    consents: {
      privacy: false,
      terms: false,
      insurance: false,
      paymentMethod: '',
    },
  };
};
