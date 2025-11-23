import { RentFormValues } from '@/schemas/RentSchema';
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useDelivery } from './useDelivery';
import { useInvoice } from './useInvoice';
import { useWatchForm } from './useWatchForm';

type Invoice = RentFormValues['invoice'];
type InvoiceLocationKey = keyof Invoice['location'];

type Delivery = NonNullable<RentFormValues['delivery']>;
type DeliveryAddress = NonNullable<Delivery['address']>;
type DeliveryLocationKey = keyof DeliveryAddress;

type HookOptions = {
  enabled?: boolean;
};

export function useSetContact(
  form: UseFormReturn<RentFormValues>,
  options: HookOptions = {}
) {
  const { enabled = true } = options;
  const { isContactSame, primaryDriverEmail, primaryDriverName } =
    useWatchForm(form);

  React.useEffect(() => {
    if (!enabled) return;
    if (!isContactSame) return;
    form.setValue('contact.name', primaryDriverName, {
      shouldDirty: false,
      shouldTouch: true,
    });
    form.setValue('contact.email', primaryDriverEmail ?? '', {
      shouldDirty: false,
      shouldTouch: true,
    });
  }, [enabled, form, isContactSame, primaryDriverName, primaryDriverEmail]);

  React.useEffect(() => {
    if (!enabled) return;
    if (isContactSame) return;
    form.setValue('contact.name', '', {
      shouldDirty: false,
      shouldTouch: false,
    });
    form.setValue('contact.email', '', {
      shouldDirty: false,
      shouldTouch: false,
    });
  }, [enabled, form, isContactSame]);
}

export function useSetInvoice(
  form: UseFormReturn<RentFormValues>,
  options: HookOptions = {}
) {
  const { enabled = true } = options;
  const { invoiceLocationPath } = useInvoice(form);
  const {
    isInvoiceSame,
    primaryDriverCity,
    primaryDriverCountry,
    primaryDriverDoorNumber,
    primaryDriverEmail,
    primaryDriverName,
    primaryDriverPhoneNumber,
    primaryDriverStreet,
    primaryDriverPostalCode,
  } = useWatchForm(form);

  React.useEffect(() => {
    if (!enabled) return;
    if (!isInvoiceSame) return;

    const normalize = (value: unknown) =>
      typeof value === 'string' ? value.trim() : '';

    form.setValue('invoice.name', primaryDriverName, {
      shouldDirty: false,
      shouldTouch: true,
    });
    form.setValue('invoice.email', primaryDriverEmail ?? '', {
      shouldDirty: false,
      shouldTouch: true,
    });
    form.setValue(
      'invoice.phoneNumber',
      typeof primaryDriverPhoneNumber === 'string'
        ? primaryDriverPhoneNumber
        : '',
      {
        shouldDirty: false,
        shouldTouch: true,
      }
    );

    const driverLocation: Record<InvoiceLocationKey, string> = {
      country: normalize(primaryDriverCountry),
      postalCode: normalize(primaryDriverPostalCode),
      city: normalize(primaryDriverCity),
      street: normalize(primaryDriverStreet),
      doorNumber: normalize(primaryDriverDoorNumber),
    };

    (Object.entries(driverLocation) as [InvoiceLocationKey, string][]).forEach(
      ([key, value]) => {
        form.setValue(invoiceLocationPath(key), value, {
          shouldDirty: false,
          shouldTouch: true,
        });
      }
    );
  }, [
    enabled,
    form,
    isInvoiceSame,
    primaryDriverName,
    primaryDriverEmail,
    primaryDriverPhoneNumber,
    primaryDriverCountry,
    primaryDriverPostalCode,
    primaryDriverCity,
    primaryDriverStreet,
    primaryDriverDoorNumber,
    invoiceLocationPath,
  ]);
  React.useEffect(() => {
    if (!enabled) return;
    if (isInvoiceSame) return;

    form.setValue('invoice.name', '', {
      shouldDirty: false,
      shouldTouch: false,
    });
    form.setValue('invoice.email', '', {
      shouldDirty: false,
      shouldTouch: false,
    });
    form.setValue('invoice.phoneNumber', '', {
      shouldDirty: false,
      shouldTouch: false,
    });

    (
      [
        'country',
        'postalCode',
        'city',
        'street',
        'doorNumber',
      ] as InvoiceLocationKey[]
    ).forEach((key) => {
      form.setValue(invoiceLocationPath(key), '', {
        shouldDirty: false,
        shouldTouch: false,
      });
    });
  }, [enabled, form, isInvoiceSame, invoiceLocationPath]);
}

export function useSetDelivery(
  form: UseFormReturn<RentFormValues>,
  isDeliveryRequired: boolean,
  options: HookOptions = {}
) {
  const { enabled = true } = options;
  const { deliveryLocationPath } = useDelivery(form);

  React.useEffect(() => {
    if (!enabled) return;
    if (isDeliveryRequired) return;

    form.setValue('delivery.placeType', undefined, {
      shouldDirty: false,
      shouldTouch: false,
    });
    form.setValue('delivery.locationName', '', {
      shouldDirty: false,
      shouldTouch: false,
    });
    form.setValue('delivery.arrivalFlight', '', {
      shouldDirty: false,
      shouldTouch: false,
    });
    form.setValue('delivery.departureFlight', '', {
      shouldDirty: false,
      shouldTouch: false,
    });

    (
      [
        'country',
        'postalCode',
        'city',
        'street',
        'doorNumber',
      ] as DeliveryLocationKey[]
    ).forEach((key) => {
      form.setValue(deliveryLocationPath(key), '', {
        shouldDirty: false,
        shouldTouch: false,
      });
    });

    form.clearErrors([
      'delivery.placeType',
      'delivery.locationName',
      'delivery.arrivalFlight',
      'delivery.departureFlight',
      'delivery.address.country',
      'delivery.address.postalCode',
      'delivery.address.city',
      'delivery.address.street',
      'delivery.address.doorNumber',
    ]);
  }, [enabled, form, isDeliveryRequired, deliveryLocationPath]);
}
