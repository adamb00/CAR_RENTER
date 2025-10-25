import { RentFormValues } from '@/schemas/RentSchema';
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { createDriverHelpers } from './useDrivers';

export const useWatchForm = (form: UseFormReturn<RentFormValues>) => {
  const { driverLocationPath } = React.useMemo(
    () => createDriverHelpers(form),
    [form]
  );

  const isContactSame = form.watch('contact.same');
  const isInvoiceSame = form.watch('invoice.same');
  const extrasSelected = form.watch('extras');

  const primaryDriverEmail = form.watch('driver.0.email');
  const primaryDriverFirstName = form.watch('driver.0.firstName_1');
  const primaryDriverFirstName_2 = form.watch('driver.0.firstName_2');
  const primaryDriverLastName = form.watch('driver.0.lastName_1');
  const primaryDriverLastName_2 = form.watch('driver.0.lastName_2');
  const primaryDriverPhoneNumber = form.watch('driver.0.phoneNumber');
  const primaryDriverCountry = form.watch(driverLocationPath(0, 'country'));
  const primaryDriverPostalCode = form.watch(
    driverLocationPath(0, 'postalCode')
  );
  const primaryDriverCity = form.watch(driverLocationPath(0, 'city'));
  const primaryDriverStreet = form.watch(driverLocationPath(0, 'street'));
  const primaryDriverDoorNumber = form.watch(
    driverLocationPath(0, 'doorNumber')
  );

  const primaryDriverName = React.useMemo(() => {
    const parts = [
      typeof primaryDriverFirstName === 'string'
        ? primaryDriverFirstName.trim()
        : '',
      typeof primaryDriverFirstName_2 === 'string'
        ? primaryDriverFirstName_2.trim()
        : '',
      typeof primaryDriverLastName === 'string'
        ? primaryDriverLastName.trim()
        : '',
      typeof primaryDriverLastName_2 === 'string'
        ? primaryDriverLastName_2.trim()
        : '',
    ].filter((part) => part.length > 0);
    return parts.join(' ').trim();
  }, [
    primaryDriverFirstName,
    primaryDriverLastName,
    primaryDriverFirstName_2,
    primaryDriverLastName_2,
  ]);

  return {
    isInvoiceSame,
    isContactSame,
    primaryDriverEmail,
    primaryDriverName,
    primaryDriverCity,
    primaryDriverCountry,
    primaryDriverPhoneNumber,
    primaryDriverStreet,
    primaryDriverDoorNumber,
    primaryDriverPostalCode,
    extrasSelected,
  };
};
