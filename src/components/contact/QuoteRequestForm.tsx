'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMessages, useTranslations } from 'next-intl';
import { useMemo, useState, useTransition } from 'react';
import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import toast from 'react-hot-toast';

import { submitContactQuote } from '@/actions/ContactQuoteAction';
import LegalConsents from '@/components/rent/LegalConsents';
import { Button } from '@/components/ui/button';
import { Form, FormField } from '@/components/ui/form';
import { useWindowWithGoogle } from '@/hooks/useWindowWithGoogle';
import { trackFormSubmission } from '@/lib/analytics';
import { buildConsentItems } from '@/app/[locale]/cars/[id]/rent/consent-items';
import { buildQuoteRequestSchema } from '@/schemas/QuoteSchema';
import type { QuoteRequestValues } from '@/schemas/QuoteSchema';
import { useRouter } from 'next/navigation';
import QuoteContact from './QuoteContact';
import QuoteDelivery from './QuoteDelivery';
import QuoteExtras from './QuoteExtras';
import QuoteFlights from './QuoteFlights';
import QuoteName from './QuoteName';
import QuotePartySize from './QuotePartySize';
import type {
  DeliveryInfo,
  PreferredChannel,
  QuoteRequestFormProps,
} from './quote.types';
import QuoteRentalStart from './QuoteRentalStart';

export type { QuoteRequestValues } from '@/schemas/QuoteSchema';

export function QuoteRequestForm({
  locale,
  selectedCar,
  prefill,
}: QuoteRequestFormProps) {
  const t = useTranslations('Contact');
  const tSchema = useTranslations('RentSchema');
  const messages = useMessages();
  const deliveryFieldRequiredMessage = useMemo(() => {
    const rentFormMessages = messages?.RentForm as
      | { errors?: { deliveryFieldRequired?: string } }
      | undefined;
    if (rentFormMessages?.errors?.deliveryFieldRequired) {
      return rentFormMessages.errors.deliveryFieldRequired;
    }

    const rentSchemaMessages = messages?.RentSchema as
      | { errors?: { deliveryFieldRequired?: string } }
      | undefined;
    if (rentSchemaMessages?.errors?.deliveryFieldRequired) {
      return rentSchemaMessages.errors.deliveryFieldRequired;
    }

    return tSchema('errors.deliveryFieldRequired');
  }, [messages, tSchema]);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [placesReady, setPlacesReady] = useState(false);
  useWindowWithGoogle(setPlacesReady);

  const schema = useMemo(
    () =>
      buildQuoteRequestSchema({
        t,
        tSchema,
        deliveryFieldRequiredMessage,
      }),
    [t, tSchema, deliveryFieldRequiredMessage]
  );
  const sanitizedPrefillName =
    typeof prefill?.name === 'string' ? prefill.name.trim() : '';
  const sanitizedPrefillEmail =
    typeof prefill?.email === 'string' ? prefill.email.trim() : '';

  const defaultValues = useMemo(
    () => ({
      name: sanitizedPrefillName,
      phone: '',
      email: sanitizedPrefillEmail,
      preferredChannel: 'email' as PreferredChannel,
      rentalStart: '',
      rentalEnd: '',
      arrivalFlight: '',
      departureFlight: '',
      partySize: '',
      children: '',
      carId: selectedCar?.id ?? '',
      extras: [],
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
      } as DeliveryInfo,
      consents: { privacy: false, terms: false },
    }),
    [sanitizedPrefillEmail, sanitizedPrefillName, selectedCar?.id]
  );

  const form = useForm<QuoteRequestValues>({
    resolver: zodResolver(schema) as Resolver<QuoteRequestValues>,
    defaultValues,
  });

  console.log(form.formState.errors);

  const onSubmit: SubmitHandler<QuoteRequestValues> = (values) => {
    setStatus('idle');
    const submissionMeta = {
      locale,
      preferredChannel: values.preferredChannel,
      hasChildren: Boolean(values.children && values.children !== '0'),
      hasPartySize: Boolean(values.partySize),
    };
    const { consents: _consents, ...rest } = values;
    void _consents;
    startTransition(async () => {
      const result = await submitContactQuote({ locale, ...rest });
      if (result.success) {
        setStatus('success');
        form.reset(defaultValues);
        toast.success(t('form.feedback.success'));
        trackFormSubmission({
          formId: 'contact-quote',
          status: 'success',
          ...submissionMeta,
        });
        void router.push(`/${locale}/contact/thank-you`);
      } else {
        setStatus('error');
        toast.error(t('form.feedback.error'));
        trackFormSubmission({
          formId: 'contact-quote',
          status: 'error',
          ...submissionMeta,
        });
      }
    });
  };

  const consentItems = useMemo(
    () =>
      buildConsentItems<QuoteRequestValues>({
        locale,
        t,
        privacyTranslationKey: 'form.consents.privacy',
        termsTranslationKey: 'form.consents.terms',
      }),
    [locale, t]
  );

  const extrasSelected = form.watch('extras');
  const isDeliveryRequired =
    Array.isArray(extrasSelected) && extrasSelected.includes('kiszallitas');

  return (
    <div className='my-10 max-w-7xl mx-auto w-full'>
      <div className='rounded-3xl border border-grey-light-2/60 dark:border-grey-dark-2/50 bg-white/90 dark:bg-transparent backdrop-blur px-6 py-6 sm:px-8 sm:py-8 shadow-sm'>
        <h3 className='text-2xl font-semibold text-sky-dark dark:text-amber-light'>
          {t('form.title')}
        </h3>
        <p className='mt-2 text-base text-grey-dark-3 dark:text-grey-dark-2'>
          {t('form.description')}
        </p>
        {selectedCar ? (
          <p className='mt-3 text-sm font-medium text-amber-dark'>
            {t('form.selectedCar', { carName: selectedCar.name })}
          </p>
        ) : null}
        <Form {...form}>
          <form
            className='mt-6 space-y-6'
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name='carId'
              render={({ field }) => (
                <input
                  type='hidden'
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />

            <QuoteName form={form} />

            <QuoteContact form={form} />

            <QuoteRentalStart form={form} locale={locale} />

            <QuoteExtras form={form} />

            <QuoteFlights form={form} />

            {isDeliveryRequired ? (
              <QuoteDelivery form={form} placesReady={placesReady} />
            ) : null}

            <QuotePartySize form={form} />
            <LegalConsents
              form={form}
              items={consentItems}
              className='space-y-3 rounded-2xl border border-border/60 bg-muted/40 p-4'
            />

            <div>
              <Button
                type='submit'
                disabled={isPending}
                className='w-full sm:w-auto bg-sky-dark text-white hover:bg-sky-dark/90'
              >
                {isPending ? t('form.submit.sending') : t('form.submit.idle')}
              </Button>
              <p className='sr-only' aria-live='polite' role='status'>
                {status === 'success' && t('form.feedback.success')}
                {status === 'error' && t('form.feedback.error')}
              </p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
