// import { RentFormValues } from '@/schemas/RentSchema';
// import { FieldPath, UseFormReturn } from 'react-hook-form';
// import React from 'react';
// import { resolvePostalSelection } from './useResolvePostalSelection';

// type Delivery = NonNullable<RentFormValues['delivery']>;
// type DeliveryAddress = NonNullable<Delivery['address']>;
// type DeliveryLocationKey = keyof DeliveryAddress;

// export const useDelivery = (form: UseFormReturn<RentFormValues>) => {
//   const deliveryLocationPath = React.useCallback(
//     <K extends DeliveryLocationKey>(key: K): FieldPath<RentFormValues> =>
//       `delivery.address.${key}` as FieldPath<RentFormValues>,
//     []
//   );

//   const updateDeliveryLocationField = React.useCallback(
//     (key: DeliveryLocationKey, value: string) => {
//       const path = deliveryLocationPath(key);
//       form.setValue(path, value, {
//         shouldDirty: true,
//         shouldTouch: true,
//         shouldValidate: true,
//       });
//     },
//     [deliveryLocationPath, form]
//   );

//   const handleDeliveryPostalSelect = React.useCallback(
//     async (address: string, placeId?: string): Promise<string | undefined> => {
//       const currentCountryRaw = form.getValues(deliveryLocationPath('country'));
//       const currentCountry =
//         typeof currentCountryRaw === 'string' ? currentCountryRaw : '';

//       const resolved = await resolvePostalSelection(
//         address,
//         placeId,
//         currentCountry
//       );

//       if (!resolved) return;

//       const { postalCode, city, country, street, doorNumber } = resolved;

//       if (city) {
//         updateDeliveryLocationField('city', city);
//       }
//       if (country) {
//         updateDeliveryLocationField('country', country);
//       }
//       if (street) {
//         updateDeliveryLocationField('street', street);
//       }
//       if (doorNumber) {
//         updateDeliveryLocationField('doorNumber', doorNumber);
//       }

//       return postalCode;
//     },
//     [deliveryLocationPath, form, updateDeliveryLocationField]
//   );

//   return { deliveryLocationPath, handleDeliveryPostalSelect };
// };

import { FieldPath, UseFormReturn } from 'react-hook-form';
import React from 'react';
import { resolvePostalSelection } from './useResolvePostalSelection';

type DeliveryAddressBase = {
  country?: string;
  postalCode?: string;
  city?: string;
  street?: string;
  doorNumber?: string;
};

type DeliveryAddressFromForm<TFormValues> = TFormValues extends {
  delivery?: { address?: infer A };
}
  ? A extends DeliveryAddressBase
    ? A
    : never
  : never;

type DeliveryLocationKey<TFormValues> = keyof NonNullable<
  DeliveryAddressFromForm<TFormValues>
> &
  string;

export const useDelivery = <
  TFormValues extends {
    delivery?: {
      address?: DeliveryAddressBase;
    };
  }
>(
  form: UseFormReturn<TFormValues>
) => {
  const deliveryLocationPath = React.useCallback(
    <K extends DeliveryLocationKey<TFormValues>>(
      key: K
    ): FieldPath<TFormValues> =>
      `delivery.address.${key}` as FieldPath<TFormValues>,
    []
  );

  const updateDeliveryLocationField = React.useCallback(
    (key: DeliveryLocationKey<TFormValues>, value: string) => {
      const path = deliveryLocationPath(key);
      form.setValue(path, value as any, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [deliveryLocationPath, form]
  );

  const handleDeliveryPostalSelect = React.useCallback(
    async (address: string, placeId?: string): Promise<string | undefined> => {
      // itt nem kell feltétlen a helper, mehet fix path-ként is
      const currentCountryRaw = form.getValues(
        'delivery.address.country' as FieldPath<TFormValues>
      );
      const currentCountry =
        typeof currentCountryRaw === 'string' ? currentCountryRaw : '';

      const resolved = await resolvePostalSelection(
        address,
        placeId,
        currentCountry
      );

      if (!resolved) return;

      const { postalCode, city, country, street, doorNumber } = resolved;

      if (city) {
        updateDeliveryLocationField(
          'city' as DeliveryLocationKey<TFormValues>,
          city
        );
      }
      if (country) {
        updateDeliveryLocationField(
          'country' as DeliveryLocationKey<TFormValues>,
          country
        );
      }
      if (street) {
        updateDeliveryLocationField(
          'street' as DeliveryLocationKey<TFormValues>,
          street
        );
      }
      if (doorNumber) {
        updateDeliveryLocationField(
          'doorNumber' as DeliveryLocationKey<TFormValues>,
          doorNumber
        );
      }

      return postalCode;
    },
    [form, updateDeliveryLocationField]
  );

  return { deliveryLocationPath, handleDeliveryPostalSelect };
};
