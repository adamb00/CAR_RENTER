import { RentFormValues } from '@/schemas/RentSchema';
import { FieldPath, UseFormReturn } from 'react-hook-form';
import React from 'react';
import { resolvePostalSelection } from './useResolvePostalSelection';

type Invoice = RentFormValues['invoice'];
type InvoiceLocationKey = keyof Invoice['location'];

export const useInvoice = (form: UseFormReturn<RentFormValues>) => {
  const invoiceLocationPath = React.useCallback(
    <K extends InvoiceLocationKey>(key: K): FieldPath<RentFormValues> =>
      `invoice.location.${key}` as FieldPath<RentFormValues>,
    []
  );

  const updateInvoiceLocationField = React.useCallback(
    (key: InvoiceLocationKey, value: string) => {
      const path = invoiceLocationPath(key);
      form.setValue(path, value, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [form, invoiceLocationPath]
  );

  const handleInvoicePostalSelect = React.useCallback(
    async (address: string, placeId?: string): Promise<string | undefined> => {
      const currentCountryRaw = form.getValues(invoiceLocationPath('country'));
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
        updateInvoiceLocationField('city', city);
      }
      if (country) {
        updateInvoiceLocationField('country', country);
      }
      if (street) {
        updateInvoiceLocationField('street', street);
      }
      if (doorNumber) {
        updateInvoiceLocationField('doorNumber', doorNumber);
      }

      return postalCode;
    },
    [form, invoiceLocationPath, updateInvoiceLocationField]
  );

  return { invoiceLocationPath, handleInvoicePostalSelect };
};
