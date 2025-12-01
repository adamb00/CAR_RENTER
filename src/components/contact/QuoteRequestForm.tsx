'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useMessages, useTranslations } from 'next-intl';
import {
  useForm,
  type SubmitHandler,
  type Resolver,
  type FieldPath,
} from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { enUS } from 'date-fns/locale';
import PlacesAutocomplete from 'react-places-autocomplete';

import { submitContactQuote } from '@/actions/ContactQuoteAction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/MultiSelect';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { CALENDAR_LOCALE_MAP } from '@/lib/calendar_locale_map';
import { DATE_LOCALE_MAP } from '@/lib/date_locale_map';
import { EXTRA_VALUES } from '@/lib/extra_values';
import LegalConsents, {
  type LegalConsentItem,
} from '@/components/rent/LegalConsents';
import { trackFormSubmission } from '@/lib/analytics';
import { resolvePostalSelection } from '@/hooks/useResolvePostalSelection';
import { useWindowWithGoogle } from '@/hooks/useWindowWithGoogle';
import { useDelivery } from '@/hooks/useDelivery';

const parseDateValue = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const segments = value.split('-');
  if (segments.length !== 3) return undefined;
  const [yearRaw, monthRaw, dayRaw] = segments;
  const year = Number.parseInt(yearRaw, 10);
  const month = Number.parseInt(monthRaw, 10);
  const day = Number.parseInt(dayRaw, 10);
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return undefined;
  }
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date;
};

const formatDateValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type PreferredChannel = 'email' | 'phone' | 'whatsapp' | 'viber';
const CHANNELS: PreferredChannel[] = ['email', 'phone', 'whatsapp', 'viber'];

type DeliveryInfo = {
  placeType?: 'accommodation' | 'airport';
  locationName?: string;
  address?: {
    country?: string;
    postalCode?: string;
    city?: string;
    street?: string;
    doorNumber?: string;
  };
};

const buildSchema = (
  t: ReturnType<typeof useTranslations<'Contact'>>,
  tRent: ReturnType<typeof useTranslations<'RentForm'>>,
  deliveryFieldRequiredMessage: string
) =>
  z
    .object({
      name: z.string().min(1, t('form.errors.nameRequired')),
      phone: z.string().min(1, t('form.errors.phoneRequired')),
      email: z
        .string()
        .min(1, t('form.errors.emailRequired'))
        .email(t('form.errors.emailInvalid')),
      preferredChannel: z.enum(CHANNELS),
      rentalStart: z.string().min(1, t('form.errors.rentalStartRequired')),
      rentalEnd: z.string().min(1, t('form.errors.rentalEndRequired')),
      arrivalFlight: z.string().optional(),
      departureFlight: z.string().optional(),
      partySize: z.string().optional(),
      children: z.string().optional(),
      carId: z.string().optional(),
      extras: z.array(z.string()).default([]),
      delivery: z
        .object({
          placeType: z.enum(['accommodation', 'airport']).optional(),
          locationName: z.string().optional(),
          address: z
            .object({
              country: z.string().optional(),
              postalCode: z.string().optional(),
              city: z.string().optional(),
              street: z.string().optional(),
              doorNumber: z.string().optional(),
            })
            .optional(),
        })
        .optional(),
      consents: z.object({
        privacy: z
          .boolean()
          .refine((val) => val, { message: t('form.errors.privacyRequired') }),
        terms: z
          .boolean()
          .refine((val) => val, { message: t('form.errors.termsRequired') }),
      }),
    })
    .superRefine((val, ctx) => {
      const hasDelivery =
        Array.isArray(val.extras) && val.extras.includes('kiszallitas');
      if (!hasDelivery) return;

      const messageRequired = deliveryFieldRequiredMessage;

      if (!val.delivery?.placeType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: tRent('errors.deliveryPlaceTypeRequired'),
          path: ['delivery', 'placeType'],
        });
      }

      const address = val.delivery?.address ?? {};
      (['country', 'postalCode', 'city'] as const).forEach((key) => {
        const raw = address[key];
        if (!raw || (typeof raw === 'string' && raw.trim().length === 0)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: messageRequired,
            path: ['delivery', 'address', key],
          });
        }
      });
    });

type QuoteRequestSchema = ReturnType<typeof buildSchema>;
export type QuoteRequestValues = z.infer<QuoteRequestSchema>;

type QuoteRequestFormProps = {
  locale: string;
  selectedCar?: { id: string; name: string } | null;
};

export function QuoteRequestForm({
  locale,
  selectedCar,
}: QuoteRequestFormProps) {
  const t = useTranslations('Contact');
  const tReF = useTranslations('RentForm');
  const tRent = useTranslations('RentForm');
  const tSchema = useTranslations('RentSchema');
  const messages = useMessages();
  const deliveryFieldRequiredMessage = useMemo(() => {
    const rentFormMessages =
      messages?.RentForm as
        | { errors?: { deliveryFieldRequired?: string } }
        | undefined;
    if (rentFormMessages?.errors?.deliveryFieldRequired) {
      return rentFormMessages.errors.deliveryFieldRequired;
    }

    const rentSchemaMessages =
      messages?.RentSchema as
        | { errors?: { deliveryFieldRequired?: string } }
        | undefined;
    if (rentSchemaMessages?.errors?.deliveryFieldRequired) {
      return rentSchemaMessages.errors.deliveryFieldRequired;
    }

    return tSchema('errors.deliveryFieldRequired');
  }, [messages, tSchema]);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [placesReady, setPlacesReady] = useState(false);
  useWindowWithGoogle(setPlacesReady);

  const schema = useMemo(
    () => buildSchema(t, tRent, deliveryFieldRequiredMessage),
    [t, tRent, deliveryFieldRequiredMessage]
  );
  const defaultValues = useMemo(
    () => ({
      name: '',
      phone: '',
      email: '',
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
    [selectedCar?.id]
  );

  const form = useForm<QuoteRequestValues>({
    resolver: zodResolver(schema) as Resolver<QuoteRequestValues>,
    defaultValues,
  });

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

  const { deliveryLocationPath, handleDeliveryPostalSelect } =
    useDelivery(form);

  const dateLocale = DATE_LOCALE_MAP[locale] ?? 'en-US';
  const calendarLocale = CALENDAR_LOCALE_MAP[locale] ?? enUS;
  const today = useMemo(() => {
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    return current;
  }, []);
  const oneYearAhead = useMemo(() => {
    const future = new Date(today);
    future.setFullYear(future.getFullYear() + 1);
    return future;
  }, [today]);
  const rentalStartValue = form.watch('rentalStart');
  const rentalEndValue = form.watch('rentalEnd');
  const dateRangePickerMessages = (
    messages?.RentForm as Record<string, unknown> | null
  )?.dateRangePicker as
    | {
        apply?: string;
        cancel?: string;
      }
    | undefined;
  const consentItems = useMemo<LegalConsentItem<QuoteRequestValues>[]>(
    () => [
      {
        name: 'consents.privacy',
        label: t.rich('form.consents.privacy', {
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
        label: t.rich('form.consents.terms', {
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

  const extrasOptions = useMemo(
    () =>
      EXTRA_VALUES.map((value) => ({
        value,
        label: tRent(`extras.options.${value}`),
      })),
    [tRent]
  );

  const extrasSelected = form.watch('extras');
  const isDeliveryRequired =
    Array.isArray(extrasSelected) && extrasSelected.includes('kiszallitas');
  const deliveryTitle = tRent('sections.delivery.title');
  const deliveryDesc = tRent('sections.delivery.description');

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
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.fields.name.label')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('form.fields.name.placeholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.fields.phone.label')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('form.fields.phone.placeholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.fields.email.label')}</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        {...field}
                        placeholder={t('form.fields.email.placeholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='preferredChannel'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.fields.channel.label')}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHANNELS.map((channel) => (
                            <SelectItem key={channel} value={channel}>
                              {t(`form.channels.${channel}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name='rentalStart'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.fields.dateRange.label')}</FormLabel>
                    <FormControl>
                      <DateRangePicker
                        showCompare={false}
                        initialDateFrom={parseDateValue(rentalStartValue)}
                        initialDateTo={parseDateValue(rentalEndValue)}
                        minDate={today}
                        maxDate={oneYearAhead}
                        locale={dateLocale}
                        calendarLocale={calendarLocale}
                        applyLabel={dateRangePickerMessages?.apply}
                        cancelLabel={dateRangePickerMessages?.cancel}
                        onUpdate={({ range }) => {
                          if (range?.from) {
                            field.onChange(formatDateValue(range.from));
                          } else {
                            field.onChange('');
                          }
                          if (range?.to) {
                            form.setValue(
                              'rentalEnd',
                              formatDateValue(range.to),
                              { shouldDirty: true }
                            );
                          } else {
                            form.setValue('rentalEnd', '', {
                              shouldDirty: true,
                            });
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <input type='hidden' {...form.register('rentalEnd')} />
            </div>

            <div>
              <FormField
                control={form.control}
                name='extras'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tRent('extras.label')}</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={extrasOptions}
                        defaultValue={field.value ?? []}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className='mt-2 text-xs text-muted-foreground space-y-1'>
                      <p>{tRent('extras.packages.base')}</p>
                      <p>{tRent('extras.packages.energy')}</p>
                      <p>{tRent('extras.packages.lateArrival')}</p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='arrivalFlight'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('form.fields.arrivalFlight.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('form.fields.arrivalFlight.placeholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='departureFlight'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('form.fields.departureFlight.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t(
                          'form.fields.departureFlight.placeholder'
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isDeliveryRequired ? (
              <div className='rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-4'>
                <div>
                  <h4 className='text-base font-semibold'>{deliveryTitle}</h4>
                  <p className='text-sm text-muted-foreground'>
                    {deliveryDesc}
                  </p>
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='delivery.placeType'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {tRent('sections.delivery.fields.placeType.label')}
                        </FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={tRent(
                                  'sections.delivery.fields.placeType.placeholder'
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='accommodation'>
                                {tRent(
                                  'sections.delivery.fields.placeType.accommodation'
                                )}
                              </SelectItem>
                              <SelectItem value='airport'>
                                {tRent(
                                  'sections.delivery.fields.placeType.airport'
                                )}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='delivery.locationName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {tRent('sections.delivery.locationName.label')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={tRent(
                              'sections.delivery.locationName.placeholder'
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    // name='delivery.address.country'
                    name={deliveryLocationPath('country')}
                    render={({ field }) => {
                      const countryValue =
                        typeof field.value === 'string' ? field.value : '';
                      return (
                        <FormItem>
                          <FormLabel>
                            {tRent('sections.delivery.fields.country.label')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={countryValue}
                              placeholder={tRent(
                                'sections.delivery.fields.country.placeholder'
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    // name='delivery.address.postalCode'
                    name={deliveryLocationPath('postalCode')}
                    render={({ field }) => {
                      const postalValue =
                        typeof field.value === 'string' ? field.value : '';
                      return (
                        <FormItem>
                          <FormLabel>
                            {tRent('sections.delivery.fields.postalCode.label')}
                          </FormLabel>
                          <FormControl>
                            {placesReady ? (
                              <PlacesAutocomplete
                                value={postalValue}
                                onChange={(value) => {
                                  field.onChange(value);
                                }}
                                onSelect={async (address, placeId) => {
                                  const resolved =
                                    await handleDeliveryPostalSelect(
                                      address,
                                      placeId
                                    );
                                  if (resolved) {
                                    field.onChange(resolved);
                                  }
                                }}
                                searchOptions={{ types: ['geocode'] }}
                                debounce={200}
                                highlightFirstSuggestion
                              >
                                {({
                                  getInputProps,
                                  suggestions,
                                  getSuggestionItemProps,
                                  loading,
                                }) => (
                                  <div className='relative'>
                                    <Input
                                      {...getInputProps({
                                        placeholder: tRent(
                                          'sections.drivers.fields.postalCode.placeholder'
                                        ),
                                        onBlur: field.onBlur,
                                      })}
                                    />
                                    {(loading || suggestions.length > 0) && (
                                      <div className='absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border/60 bg-background shadow-lg'>
                                        {loading && (
                                          <div className='px-3 py-2 text-sm text-muted-foreground'>
                                            {tReF('searching')}
                                          </div>
                                        )}
                                        {suggestions.map((suggestion) => {
                                          const itemProps =
                                            getSuggestionItemProps(suggestion, {
                                              className:
                                                'cursor-pointer px-3 py-2 text-sm hover:bg-accent',
                                            });
                                          const { key, ...restProps } =
                                            itemProps as {
                                              key?: React.Key;
                                              [prop: string]: unknown;
                                            };
                                          const normalizedKey =
                                            key != null
                                              ? String(key)
                                              : suggestion.placeId ??
                                                suggestion.description;
                                          return (
                                            <div
                                              key={normalizedKey}
                                              {...restProps}
                                            >
                                              {suggestion.description}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </PlacesAutocomplete>
                            ) : (
                              <Input
                                placeholder={t(
                                  'sections.drivers.fields.postalCode.placeholder'
                                )}
                                value={postalValue}
                                onChange={(event) => {
                                  field.onChange(event.target.value);
                                }}
                                onBlur={field.onBlur}
                              />
                            )}
                            {/* <Input
                            {...field}
                            placeholder={tRent(
                              'sections.delivery.fields.postalCode.placeholder'
                            )}
                            onBlur={async (event) => {
                              field.onBlur();
                              await fillAddressFromPostal();
                            }}
                          /> */}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    // name='delivery.address.city'
                    name={deliveryLocationPath('city')}
                    render={({ field }) => {
                      const cityValue =
                        typeof field.value === 'string' ? field.value : '';
                      return (
                        <FormItem>
                          <FormLabel>
                            {tRent('sections.delivery.fields.city.label')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={cityValue}
                              placeholder={tRent(
                                'sections.delivery.fields.city.placeholder'
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    // name='delivery.address.street'
                    name={deliveryLocationPath('street')}
                    render={({ field }) => {
                      const streetValue =
                        typeof field.value === 'string' ? field.value : '';
                      return (
                        <FormItem>
                          <FormLabel>
                            {tRent('sections.delivery.fields.street.label')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={streetValue}
                              placeholder={tRent(
                                'sections.delivery.fields.street.placeholder'
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    // name='delivery.address.doorNumber'
                    name={deliveryLocationPath('doorNumber')}
                    render={({ field }) => {
                      const doorValue =
                        typeof field.value === 'string' ? field.value : '';
                      return (
                        <FormItem>
                          <FormLabel>
                            {tRent('sections.delivery.fields.doorNumber.label')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={doorValue}
                              placeholder={tRent(
                                'sections.delivery.fields.doorNumber.placeholder'
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
              </div>
            ) : null}

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='partySize'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.fields.partySize.label')}</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={1}
                        {...field}
                        placeholder={t('form.fields.partySize.placeholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='children'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.fields.children.label')}</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={0}
                        {...field}
                        placeholder={t('form.fields.children.placeholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
