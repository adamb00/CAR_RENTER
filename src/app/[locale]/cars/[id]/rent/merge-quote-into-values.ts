import { ContactQuoteRecord } from '@/lib/contactQuotes';
import { RentFormValues } from './rent.types';
import { createEmptyDriver } from '@/hooks/useDrivers';
import { parsePositiveInt, splitName } from './helpers';

export const mergeQuoteIntoValues = (
  values: RentFormValues,
  quote: ContactQuoteRecord
): RentFormValues => {
  const adultsFromQuote = parsePositiveInt(quote.partySize);
  const childrenCount = parsePositiveInt(quote.children);
  const childrenArray =
    childrenCount && childrenCount > 0
      ? Array.from({ length: childrenCount }).map((_, idx) => ({
          age: values.children?.[idx]?.age,
          height: values.children?.[idx]?.height,
        }))
      : values.children ?? [];

  const { firstName, lastName } = splitName(quote.name);
  const firstDriver = values.driver?.[0] ?? createEmptyDriver();
  const restDrivers = values.driver?.slice(1) ?? [];

  const delivery: NonNullable<RentFormValues['delivery']> = values.delivery ?? {
    placeType: undefined,
    locationName: '',
    arrivalFlight: '',
    departureFlight: '',
    address: {
      country: '',
      postalCode: '',
      city: '',
      street: '',
      doorNumber: '',
    },
  };

  return {
    ...values,
    locale: values.locale ?? quote.locale ?? values.locale,
    carId: values.carId ?? quote.carId ?? values.carId,
    quoteId: values.quoteId ?? quote.id ?? values.quoteId,
    rentId: values.rentId,
    adults: adultsFromQuote ?? values.adults,
    children: childrenArray,
    extras: quote.extras ?? values.extras,
    rentalPeriod: {
      startDate: quote.rentalStart ?? values.rentalPeriod?.startDate ?? '',
      endDate: quote.rentalEnd ?? values.rentalPeriod?.endDate ?? '',
    },
    driver: [
      {
        ...firstDriver,
        firstName_1: firstName ?? firstDriver.firstName_1,
        lastName_1: lastName ?? firstDriver.lastName_1,
        phoneNumber: quote.phone ?? firstDriver.phoneNumber,
        email: quote.email ?? firstDriver.email,
      },
      ...restDrivers,
    ],
    contact: {
      ...values.contact,
      same: false,
      name: quote.name ?? values.contact?.name ?? '',
      email: quote.email ?? values.contact?.email ?? '',
    },
    invoice: {
      ...values.invoice,
      name: quote.name ?? values.invoice?.name ?? '',
      phoneNumber: quote.phone ?? values.invoice?.phoneNumber ?? '',
      email: quote.email ?? values.invoice?.email ?? '',
    },
    delivery: {
      ...delivery,
      placeType: ['accommodation', 'airport'].includes(
        quote.delivery?.placeType as string
      )
        ? (quote.delivery?.placeType as 'accommodation' | 'airport')
        : ['accommodation', 'airport'].includes(delivery.placeType as string)
        ? (delivery.placeType as 'accommodation' | 'airport')
        : undefined,
      locationName: quote.delivery?.locationName ?? delivery.locationName ?? '',
      address: {
        country:
          quote.delivery?.address?.country ?? delivery.address?.country ?? '',
        postalCode:
          quote.delivery?.address?.postalCode ??
          delivery.address?.postalCode ??
          '',
        city: quote.delivery?.address?.city ?? delivery.address?.city ?? '',
        street:
          quote.delivery?.address?.street ?? delivery.address?.street ?? '',
        doorNumber:
          quote.delivery?.address?.doorNumber ??
          delivery.address?.doorNumber ??
          '',
      },
      arrivalFlight: quote.arrivalFlight ?? delivery.arrivalFlight ?? '',
      departureFlight: quote.departureFlight ?? delivery.departureFlight ?? '',
    },
  };
};
