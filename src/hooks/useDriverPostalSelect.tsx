import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { RentFormValues } from '@/schemas/RentSchema';
import { createDriverHelpers } from './useDrivers';
import { resolvePostalSelection } from './useResolvePostalSelection';

export const useDriverPostalSelect = (
  form: UseFormReturn<RentFormValues>
) => {
  const { driverLocationPath, updateLocationField } = React.useMemo(
    () => createDriverHelpers(form),
    [form]
  );

  return React.useCallback(
    async (
      driverIndex: number,
      address: string,
      placeId?: string
    ): Promise<string | undefined> => {
      const currentCountryRaw = form.getValues(
        driverLocationPath(driverIndex, 'country')
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
        updateLocationField(driverIndex, 'city', city);
      }
      if (country) {
        updateLocationField(driverIndex, 'country', country);
      }
      if (street) {
        updateLocationField(driverIndex, 'street', street);
      }
      if (doorNumber) {
        updateLocationField(driverIndex, 'doorNumber', doorNumber);
      }

      return postalCode;
    },
    [driverLocationPath, form, updateLocationField]
  );
};
