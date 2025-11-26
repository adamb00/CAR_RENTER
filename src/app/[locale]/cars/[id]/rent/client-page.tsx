'use client';

import Link from 'next/link';
import React, { useMemo, useRef, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  useForm,
  type FieldErrors,
  type FieldError,
  type FieldValues,
  type Resolver,
} from 'react-hook-form';
import { z } from 'zod';

import { RentAction } from '@/actions/RentAction';
import BaseDetails from '@/components/rent/BaseDetails';
import Children from '@/components/rent/Children';
import Contact from '@/components/rent/Contact';
import Delivery from '@/components/rent/Delivery';
import Drivers from '@/components/rent/Drivers';
import Invoice from '@/components/rent/Invoice';
import LegalConsents, {
  type LegalConsentItem,
} from '@/components/rent/LegalConsents';
import { trackFormSubmission } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import type { Car } from '@/lib/cars';
import { type ContactQuoteRecord } from '@/lib/contactQuotes';
import toast from 'react-hot-toast';

type RentFormValues = z.input<typeof RentSchema> & FieldValues;
type RentFormResolvedValues = z.output<typeof RentSchema>;

type RentPageClientProps = {
  locale: string;
  car: Pick<Car, 'id' | 'seats' | 'colors'>;
  quotePrefill?: ContactQuoteRecord | null;
};

const parsePositiveInt = (value?: string | number | null): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : undefined;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }
  return undefined;
};

const splitName = (
  fullName?: string | null
): { firstName?: string; lastName?: string } => {
  if (!fullName) return {};
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

const buildInitialValues = (
  quote: ContactQuoteRecord | null | undefined,
  locale: string
): RentFormValues => {
  const adultsFromQuote = parsePositiveInt(quote?.partySize);
  const childrenCount = parsePositiveInt(quote?.children);
  const childrenArray =
    childrenCount && childrenCount > 0
      ? Array.from({ length: childrenCount }).map(() => ({
          age: undefined,
          height: undefined,
        }))
      : [];
  const driver = createEmptyDriver();
  const { firstName, lastName } = splitName(quote?.name);

  return {
    locale,
    extras: [],
    adults: adultsFromQuote,
    children: childrenArray,
    rentalPeriod: {
      startDate: quote?.rentalStart ?? '',
      endDate: quote?.rentalEnd ?? '',
    },
    driver: [
      {
        ...driver,
        firstName_1: firstName ?? driver.firstName_1,
        lastName_1: lastName ?? driver.lastName_1,
        phoneNumber: quote?.phone ?? driver.phoneNumber,
        email: quote?.email ?? driver.email,
      },
    ],
    contact: {
      same: false,
      name: quote?.name ?? '',
      email: quote?.email ?? '',
    },
    invoice: {
      same: false,
      name: quote?.name ?? '',
      phoneNumber: quote?.phone ?? '',
      email: quote?.email ?? '',
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
      arrivalFlight: quote?.arrivalFlight ?? '',
      departureFlight: quote?.departureFlight ?? '',
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
      companyName: '',
    },
    consents: {
      privacy: false,
      terms: false,
    },
  };
};

const mergeQuoteIntoValues = (
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

  const delivery: NonNullable<RentFormValues['delivery']> =
    values.delivery ?? {
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
    adults: adultsFromQuote ?? values.adults,
    children: childrenArray,
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
      arrivalFlight: quote.arrivalFlight ?? delivery.arrivalFlight ?? '',
      departureFlight:
        quote.departureFlight ?? delivery.departureFlight ?? '',
    },
  };
};

export default function RentPageClient({
  locale,
  car,
  quotePrefill,
}: RentPageClientProps) {
  const t = useTranslations('RentForm');
  const tCars = useTranslations('Cars');
  const tSchema = useTranslations('RentSchema');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { id } = car;

  const formRef = useRef<HTMLFormElement | null>(null);
  const [isMissingFlightsDialogOpen, setMissingFlightsDialogOpen] =
    React.useState(false);

  // Find the first field name that has a validation error (dot notation, supports arrays)
  const firstErrorPath = (
    errs: FieldErrors<RentFormValues> | undefined,
    path = ''
  ): string | null => {
    if (!errs) return null;

    // Narrowers
    const isPlainObject = (v: unknown): v is Record<string, unknown> =>
      typeof v === 'object' && v !== null && !Array.isArray(v);
    const isFieldError = (v: unknown): v is FieldError =>
      isPlainObject(v) && ('type' in v || 'message' in v);

    // Skip RHF/Zod meta keys that are not actual fields
    const SKIP_KEYS = new Set(['root', '_errors']);

    // Deterministic priority for top-level groups (matches your UI order)
    const PRIORITY = [
      'adults',
      'children',
      'driver',
      'contact',
      'invoice',
      'delivery',
      'rentalPeriod',
      'extras',
      'tax',
      'consents',
    ];

    const keys = Object.keys(errs as Record<string, unknown>)
      .filter((k) => !SKIP_KEYS.has(k) && !(k.startsWith && k.startsWith('_')))
      .sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b));

    for (const key of keys) {
      const next = (errs as Record<string, unknown>)[key];
      const nextPath = path ? `${path}.${key}` : key;
      if (next == null) continue;

      if (isFieldError(next)) {
        return nextPath;
      }

      if (Array.isArray(next)) {
        for (let i = 0; i < next.length; i++) {
          const nested = firstErrorPath(
            next[i] as unknown as FieldErrors<RentFormValues>,
            `${nextPath}.${i}`
          );
          if (nested) return nested;
        }
        continue;
      }

      if (isPlainObject(next)) {
        const nested = firstErrorPath(
          next as unknown as FieldErrors<RentFormValues>,
          nextPath
        );
        if (nested) return nested;
      }
    }

    return null;
  };

  // Scroll smoothly to the first invalid field and focus it; fallback to its section
  const scrollToFirstError = (name: string) => {
    const root: Document | HTMLElement = formRef.current ?? document;
    let el = (root as HTMLElement | Document).querySelector(
      `[name="${name}"]`
    ) as HTMLElement | null;

    if (!el) {
      const sectionName = name.split('.')[0];
      el = (root as HTMLElement | Document).querySelector(
        `[data-section="${sectionName}"]`
      ) as HTMLElement | null;
    }

    if (el) {
      const yOffset = -100; // optional offset for sticky header
      const rect = el.getBoundingClientRect();
      const scrollTop = window.pageYOffset + rect.top + yOffset;

      window.scrollTo({ top: scrollTop, behavior: 'smooth' });

      // fallback for browsers that ignore behavior: 'smooth'
      setTimeout(() => {
        try {
          el.focus?.();
        } catch {
          /* ignore focus errors */
        }
      }, 400);
    }
  };

  const onInvalid = (errors: FieldErrors<RentFormValues>) => {
    const first = firstErrorPath(errors);
    if (first) {
      scrollToFirstError(first);
    } else {
      // No concrete field found (likely `root` error): fall back to first section with any error
      const ORDER: (keyof RentFormValues)[] = [
        'adults',
        'children',
        'driver',
        'contact',
        'invoice',
        'delivery',
        'rentalPeriod',
        'extras',
        'tax',
        'consents',
      ];
      const firstSection = ORDER.find((k) =>
        Boolean((errors as FieldErrors<RentFormValues>)[k])
      );
      if (firstSection) {
        scrollToFirstError(String(firstSection));
      }
    }
    toast.error(t('toast.error'));
  };

  const rentSchema = React.useMemo(() => createRentSchema(tSchema), [tSchema]);
  const defaultValues = React.useMemo(
    () => buildInitialValues(quotePrefill, locale),
    [locale, quotePrefill]
  );

  const form = useForm<RentFormValues>({
    resolver: zodResolver(rentSchema) as Resolver<
      RentFormValues,
      Record<string, never>,
      RentFormResolvedValues
    >,
    defaultValues,
  });

  const { clearStoredValues, isHydrated } = usePersistRentForm(form, {
    locale,
    carId: id,
  });

  const [placesReady, setPlacesReady] = React.useState(false);
  const { extrasSelected } = useWatchForm(form);
  const arrivalFlightValue = form.watch('delivery.arrivalFlight');
  const departureFlightValue = form.watch('delivery.departureFlight');

  const isDeliveryRequired = React.useMemo(
    () =>
      Array.isArray(extrasSelected) && extrasSelected.includes('kiszallitas'),
    [extrasSelected]
  );
  const areFlightNumbersProvided =
    typeof arrivalFlightValue === 'string' &&
    arrivalFlightValue.trim().length > 0 &&
    typeof departureFlightValue === 'string' &&
    departureFlightValue.trim().length > 0;

  useWindowWithGoogle(setPlacesReady);

  useSetContact(form, { enabled: isHydrated });

  useSetInvoice(form, { enabled: isHydrated });

  useSetDelivery(form, isDeliveryRequired, { enabled: isHydrated });

  const hasAppliedQuotePrefill = React.useRef(false);

  React.useEffect(() => {
    if (!quotePrefill || !isHydrated || hasAppliedQuotePrefill.current) {
      return;
    }
    hasAppliedQuotePrefill.current = true;
    const mergedValues = mergeQuoteIntoValues(form.getValues(), quotePrefill);
    form.reset(mergedValues);
  }, [form, isHydrated, quotePrefill]);

  const shouldAskForFlightNumbers = React.useCallback(
    (values: RentFormResolvedValues) => {
      const arrival =
        typeof values.delivery?.arrivalFlight === 'string'
          ? values.delivery.arrivalFlight.trim()
          : '';
      const departure =
        typeof values.delivery?.departureFlight === 'string'
          ? values.delivery.departureFlight.trim()
          : '';
      return arrival.length === 0 || departure.length === 0;
    },
    []
  );

  const submitRentRequest = React.useCallback(
    (parsed: RentFormResolvedValues) => {
      const submissionMeta = {
        locale,
        carId: id,
        rentalStart: parsed.rentalPeriod.startDate,
        rentalEnd: parsed.rentalPeriod.endDate,
        extrasCount: Array.isArray(extrasSelected) ? extrasSelected.length : 0,
      };

      startTransition(async () => {
        const res = await RentAction({ ...parsed, locale });
        if (res.success) {
          toast.success(t('toast.success'));
          clearStoredValues();
          trackFormSubmission({
            formId: 'rent-request',
            status: 'success',
            ...submissionMeta,
          });
          setTimeout(() => {
            router.push(`/${locale}`);
          }, 2000);
        } else {
          toast.error(t('toast.error'));
          trackFormSubmission({
            formId: 'rent-request',
            status: 'error',
            errorMessage: res.error,
            ...submissionMeta,
          });
        }
      });
    },
    [
      clearStoredValues,
      extrasSelected,
      id,
      locale,
      router,
      startTransition,
      t,
    ]
  );

  type SubmitOptions = {
    bypassFlightCheck?: boolean;
  };

  const onSubmit = React.useCallback(
    (data: RentFormValues, options?: SubmitOptions) => {
      const parsed: RentFormResolvedValues = rentSchema.parse(data);
      const shouldPrompt = shouldAskForFlightNumbers(parsed);

      if (shouldPrompt && !options?.bypassFlightCheck) {
        setMissingFlightsDialogOpen(true);
        return;
      }

      setMissingFlightsDialogOpen(false);
      submitRentRequest(parsed);
    },
    [rentSchema, shouldAskForFlightNumbers, submitRentRequest]
  );

  const createSubmitHandler = (options?: SubmitOptions) =>
    form.handleSubmit(
      (values) => onSubmit(values, options),
      onInvalid
    );

  const consentItems = useMemo<LegalConsentItem<RentFormValues>[]>(
    () => [
      {
        name: 'consents.privacy',
        label: t.rich('sections.consents.privacyLabel', {
          link: (chunks) => (
            <Link
              href={`/${locale}/gdpr`}
              target='_blank'
              rel='noreferrer'
              className='underline underline-offset-2'
            >
              {chunks}
            </Link>
          ),
        }),
      },
      {
        name: 'consents.terms',
        label: t.rich('sections.consents.termsLabel', {
          link: (chunks) => (
            <Link
              href={`/${locale}/gtc`}
              target='_blank'
              rel='noreferrer'
              className='underline underline-offset-2'
            >
              {chunks}
            </Link>
          ),
        }),
      },
    ],
    [locale, t]
  );

  return (
    <Form {...form}>
      {isPending ? (
        <div className='fixed inset-0 z-[5000] flex flex-col items-center justify-center gap-6 bg-black/70 backdrop-blur-sm text-white'>
          <div
            className='h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-white'
            aria-hidden='true'
          />
          <p className='text-lg font-semibold'>{t('searching')}</p>
        </div>
      ) : null}
      <form
        ref={formRef}
        onSubmit={createSubmitHandler()}
        className='relative flex flex-col max-w-8xl mx-auto px-0 sm:px-6 lg:px-8 pt-18 sm:pt-18 md:pt-22 lg:pt-28'
        aria-busy={isPending}
        noValidate
      >
        <h2 className='text-2xl uppercase sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-relaxed tracking-normal md:tracking-[0.1em] text-center bg-gradient-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
          {t('title')}
        </h2>
        <section className='mt-10 space-y-8'>
          <div data-section='adults' tabIndex={-1} className='scroll-mt-28'>
            <BaseDetails
              locale={locale}
              form={form}
              car={car}
              colorsLabel={tCars('details.colors')}
              translateColor={(color) => tCars(`colors.${color}`)}
            />
          </div>

          <div data-section='children' tabIndex={-1} className='scroll-mt-28'>
            <Children form={form} />
          </div>

          <div data-section='driver' tabIndex={-1} className='scroll-mt-28'>
            <Drivers form={form} locale={locale} placesReady={placesReady} />
          </div>

          <div data-section='contact' tabIndex={-1} className='scroll-mt-28'>
            <Contact form={form} />
          </div>

          <div data-section='invoice' tabIndex={-1} className='scroll-mt-28'>
            <Invoice form={form} placesReady={placesReady} />
          </div>

          {isDeliveryRequired && (
            <div data-section='delivery' tabIndex={-1} className='scroll-mt-28'>
              <Delivery form={form} placesReady={placesReady} />
            </div>
          )}

          <div data-section='consents' tabIndex={-1} className='scroll-mt-28'>
            <LegalConsents
              form={form}
              items={consentItems}
              title={t('sections.consents.title')}
              description={t('sections.consents.description')}
              className='rounded-3xl border border-grey-light-2/60 dark:border-grey-dark-2/50 bg-white/90 dark:bg-transparent backdrop-blur px-6 py-6 sm:px-8 sm:py-8 shadow-sm'
            />
          </div>
        </section>

        <Button
          disabled={isPending}
          type='submit'
          className='self-end m-8 bg-sky-light text-sky-dark cursor-pointer hover:bg-sky-dark hover:border hover:text-white'
        >
          {t('buttons.submit')}
        </Button>
      </form>
      <Dialog
        open={isMissingFlightsDialogOpen}
        onOpenChange={setMissingFlightsDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('missingFlightsDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('missingFlightsDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name={'delivery.arrivalFlight'}
              render={({ field }) => {
                const value =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem>
                    <FormLabel>
                      {t('sections.delivery.fields.arrivalFlight.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.delivery.fields.arrivalFlight.placeholder'
                        )}
                        value={value}
                        onChange={(event) =>
                          field.onChange(event.target.value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name={'delivery.departureFlight'}
              render={({ field }) => {
                const value =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem>
                    <FormLabel>
                      {t('sections.delivery.fields.departureFlight.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.delivery.fields.departureFlight.placeholder'
                        )}
                        value={value}
                        onChange={(event) =>
                          field.onChange(event.target.value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
          <DialogFooter className='sm:justify-between'>
            <Button
              type='button'
              variant='outline'
              disabled={isPending}
              onClick={() => {
                createSubmitHandler({ bypassFlightCheck: true })();
              }}
            >
              {t('buttons.flightNumberUnknown')}
            </Button>
            <Button
              type='button'
              disabled={!areFlightNumbersProvided || isPending}
              onClick={() => {
                createSubmitHandler()();
              }}
            >
              {t('buttons.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
