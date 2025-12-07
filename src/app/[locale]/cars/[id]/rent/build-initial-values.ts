import { ContactQuoteRecord } from '@/lib/contactQuotes';
import { RentFormValues } from './rent.types';
import { createEmptyDriver } from '@/hooks/useDrivers';
import { parsePositiveInt, splitName } from './helpers';

export const buildInitialValues = (
  quote: ContactQuoteRecord | null | undefined,
  locale: string,
  carId: string
): RentFormValues => {
  const adultsFromQuote = parsePositiveInt(quote?.partySize);
  const childrenCount = parsePositiveInt(quote?.children);
  const childrenArray =
    childrenCount && childrenCount > 0
      ? Array.from({ length: childrenCount }).map(() => ({
          age: undefined,
          height: undefined,
        }))
      : [];
  const driver = createEmptyDriver();
  const { firstName, lastName } = splitName(quote?.name);

  return {
    locale,
    carId,
    quoteId: quote?.id,
    rentId: undefined,
    extras: [],
    adults: adultsFromQuote,
    children: childrenArray,
    rentalPeriod: {
      startDate: quote?.rentalStart ?? '',
      endDate: quote?.rentalEnd ?? '',
    },
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
      placeType: undefined,
      locationName: '',
      arrivalFlight: quote?.arrivalFlight ?? '',
      departureFlight: quote?.departureFlight ?? '',
      address: {
        country: '',
        postalCode: '',
        city: '',
        street: '',
        doorNumber: '',
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
    },
  };
};
