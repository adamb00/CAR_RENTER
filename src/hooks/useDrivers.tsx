import { RentFormValues } from '@/schemas/RentSchema';
import { FieldPath, UseFormReturn } from 'react-hook-form';

type Driver = RentFormValues['driver'][number];
type DriverLocationKey = keyof Driver['location'];
type DriverFieldKey = keyof Driver;
type DriverScalarKey = Exclude<DriverFieldKey, 'location' | 'document'>;
type DriverDocumentKey = keyof Driver['document'];

export const createEmptyDriver = (): Driver => ({
  firstName_1: '',
  lastName_1: '',
  location: {
    country: '',
    postalCode: '',
    city: '',
    street: '',
    doorNumber: '',
  },
  dateOfBirth: '',
  placeOfBirth: '',
  nameOfMother: '',
  phoneNumber: '',
  email: '',
  document: {
    type: 'passport',
    number: '',
    validFrom: '',
    validUntil: '',
    drivingLicenceNumber: '',
    drivingLicenceValidFrom: '',
    drivingLicenceValidUntil: '',
    drivingLicenceCategory: 'B',
    drivingLicenceIsOlderThan_3: false,
  },
});

export const createDriverHelpers = (form: UseFormReturn<RentFormValues>) => {
  const updateLocationField = (
    driverIndex: number,
    key: DriverLocationKey,
    value: string
  ) => {
    const path = driverLocationPath(driverIndex, key);
    form.setValue(path, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };
  const driverLocationPath = <K extends DriverLocationKey>(
    index: number,
    key: K
  ): FieldPath<RentFormValues> =>
    `driver.${index}.location.${key}` as FieldPath<RentFormValues>;

  const driverDocumentPath = <K extends DriverDocumentKey>(
    index: number,
    key: K
  ): FieldPath<RentFormValues> =>
    `driver.${index}.document.${key}` as FieldPath<RentFormValues>;

  const driverScalarPath = <K extends DriverScalarKey>(
    index: number,
    key: K
  ): FieldPath<RentFormValues> =>
    `driver.${index}.${key}` as FieldPath<RentFormValues>;

  return {
    driverLocationPath,
    driverDocumentPath,
    driverScalarPath,
    updateLocationField,
  };
};
