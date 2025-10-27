'use client';
import React, { useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';

import { RentAction } from '@/actions/RentAction';
import BaseDetails from '@/components/rent/BaseDetails';
import Children from '@/components/rent/Children';
import Contact from '@/components/rent/Contact';
import Delivery from '@/components/rent/Delivery';
import Drivers from '@/components/rent/Drivers';
import Invoice from '@/components/rent/Invoice';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { createEmptyDriver } from '@/hooks/useDrivers';
import { usePersistRentForm } from '@/hooks/usePersistRentForm';
import {
  useSetContact,
  useSetDelivery,
  useSetInvoice,
} from '@/hooks/useSetForm';
import { useWatchForm } from '@/hooks/useWatchForm';
import { useWindowWithGoogle } from '@/hooks/useWindowWithGoogle';
import { RentSchema, createRentSchema } from '@/schemas/RentSchema';
import toast from 'react-hot-toast';

type RentFormValues = z.input<typeof RentSchema>;
type RentFormResolvedValues = z.output<typeof RentSchema>;

export default function RentPage() {
  const t = useTranslations('RentForm');
  const tSchema = useTranslations('RentSchema');
  const { locale, id } = useParams<{ locale: string; id: string }>();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const rentSchema = React.useMemo(() => createRentSchema(tSchema), [tSchema]);

  const form = useForm<RentFormValues>({
    resolver: zodResolver(rentSchema) as Resolver<
      RentFormValues,
      Record<string, never>,
      RentFormResolvedValues
    >,
    defaultValues: {
      extras: [],
      adults: undefined,
      children: [],
      rentalPeriod: {
        startDate: '',
        endDate: '',
      },
      driver: [createEmptyDriver()],
      contact: {
        same: false,
        name: '',
        email: '',
      },
      invoice: {
        same: false,
        name: '',
        phoneNumber: '',
        email: '',
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
      },
    },
  });

  const { clearStoredValues, isHydrated } = usePersistRentForm(form, {
    locale,
    carId: id,
  });

  const [placesReady, setPlacesReady] = React.useState(false);
  const { extrasSelected } = useWatchForm(form);

  const isDeliveryRequired = React.useMemo(
    () =>
      Array.isArray(extrasSelected) && extrasSelected.includes('kiszallitas'),
    [extrasSelected]
  );

  useWindowWithGoogle(setPlacesReady);

  useSetContact(form, { enabled: isHydrated });

  useSetInvoice(form, { enabled: isHydrated });

  useSetDelivery(form, isDeliveryRequired, { enabled: isHydrated });

  const onSubmit = (data: RentFormValues) => {
    const parsed: RentFormResolvedValues = rentSchema.parse(data);
    startTransition(async () => {
      const res = await RentAction(parsed);
      if (res.success) {
        toast.success(t('toast.success'));
        clearStoredValues();
        setTimeout(() => {
          router.push(`/${locale}`);
        }, 2000);
      } else {
        toast.error(t('toast.error'));
      }
    });
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='relative flex flex-col max-w-8xl mx-auto px-0 sm:px-6 lg:px-8 pt-18 sm:pt-18 md:pt-22 lg:pt-28'
      >
        <h2 className='text-2xl uppercase sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-relaxed tracking-normal md:tracking-[0.1em] text-center bg-gradient-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
          {t('title')}
        </h2>
        <section className='mt-10 space-y-8'>
          <BaseDetails locale={locale} form={form} id={id} />
          <Children form={form} />
          <Drivers form={form} locale={locale} placesReady={placesReady} />
          <Contact form={form} />
          <Invoice form={form} placesReady={placesReady} />

          {isDeliveryRequired && (
            <Delivery form={form} placesReady={placesReady} />
          )}
        </section>

        <Button
          disabled={isPending}
          type='submit'
          className='self-end m-8 bg-sky-light text-sky-dark cursor-pointer hover:bg-sky-dark hover:border hover:text-white'
        >
          {t('buttons.submit')}
        </Button>
      </form>
    </Form>
  );
}
