import {
  geocodeByAddress,
  geocodeByPlaceId,
} from 'react-places-autocomplete';

type ResolvedAddress = {
  postalCode: string;
  city: string;
  country: string;
  street: string;
  doorNumber: string;
};

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

const extractComponent = (components: AddressComponent[], ...types: string[]) =>
  components.find((component) =>
    types.every((type) => component.types.includes(type))
  )?.long_name ?? '';

export const resolvePostalSelection = async (
  address: string,
  placeId: string | undefined,
  fallbackCountry: string
): Promise<ResolvedAddress> => {
  const defaultResult: ResolvedAddress = {
    postalCode: address,
    city: '',
    country: fallbackCountry,
    street: '',
    doorNumber: '',
  };

  try {
    const resolveResults = async () => {
      if (!placeId) {
        return geocodeByAddress(address);
      }

      try {
        return await geocodeByPlaceId(placeId);
      } catch (error: unknown) {
        const status =
          typeof error === 'object' && error && 'status' in error
            ? (error as { status?: string }).status
            : undefined;

        if (status === 'ZERO_RESULTS') {
          return geocodeByAddress(address);
        }

        throw error;
      }
    };

    const results = await resolveResults();

    if (!results?.length) {
      return defaultResult;
    }

    const components =
      (results[0]?.address_components as AddressComponent[]) ?? [];

    const resolvedCountry =
      extractComponent(components, 'country') || fallbackCountry;

    return {
      postalCode:
        extractComponent(components, 'postal_code') || defaultResult.postalCode,
      city:
        extractComponent(components, 'locality') ||
        extractComponent(components, 'postal_town') ||
        extractComponent(components, 'administrative_area_level_2') ||
        '',
      country: resolvedCountry,
      street:
        extractComponent(components, 'route') ||
        extractComponent(components, 'street_address') ||
        '',
      doorNumber:
        extractComponent(components, 'street_number') ||
        extractComponent(components, 'subpremise') ||
        extractComponent(components, 'premise') ||
        '',
    };
  } catch (error) {
    console.warn('Postal code lookup failed', error);
    return defaultResult;
  }
};
