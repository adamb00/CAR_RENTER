'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useMessages, useTranslations } from 'next-intl';
import { useForm, type FieldValues } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { enUS } from 'date-fns/locale';

import { submitContactQuote } from '@/actions/ContactQuoteAction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import LegalConsents, {
  type LegalConsentItem,
} from '@/components/rent/LegalConsents';
import { trackFormSubmission } from '@/lib/analytics';

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

const buildSchema = (t: ReturnType<typeof useTranslations<'Contact'>>) =>
  z.object({
    name: z.string().min(1, t('form.errors.nameRequired')),
    phone: z.string().min(1, t('form.errors.phoneRequired')),
    email: z
      .string()
      .min(1, t('form.errors.emailRequired'))
      .email(t('form.errors.emailInvalid')),
    preferredChannel: z.enum(CHANNELS),
    rentalStart: z
      .string()
      .min(1, t('form.errors.rentalStartRequired')),
    rentalEnd: z
      .string()
      .min(1, t('form.errors.rentalEndRequired')),
    arrivalFlight: z
      .string()
      .min(1, t('form.errors.arrivalFlightRequired')),
    departureFlight: z
      .string()
      .min(1, t('form.errors.departureFlightRequired')),
    partySize: z.string().optional(),
    children: z.string().optional(),
    consents: z.object({
      privacy: z
        .boolean()
        .refine((val) => val, { message: t('form.errors.privacyRequired') }),
      terms: z
        .boolean()
        .refine((val) => val, { message: t('form.errors.termsRequired') }),
    }),
  });

type QuoteRequestValues = z.infer<ReturnType<typeof buildSchema>> & FieldValues;

export function QuoteRequestForm({ locale }: { locale: string }) {
  const t = useTranslations('Contact');
  const messages = useMessages();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const schema = useMemo(() => buildSchema(t), [t]);
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
      consents: { privacy: false, terms: false },
    }),
    []
  );

  const form = useForm<QuoteRequestValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = (values: QuoteRequestValues) => {
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

  return (
    <div className='mt-10 max-w-7xl mx-auto w-full'>
      <div className='rounded-3xl border border-grey-light-2/60 dark:border-grey-dark-2/50 bg-white/90 dark:bg-transparent backdrop-blur px-6 py-6 sm:px-8 sm:py-8 shadow-sm'>
        <h3 className='text-2xl font-semibold text-sky-dark dark:text-amber-light'>
          {t('form.title')}
        </h3>
        <p className='mt-2 text-base text-grey-dark-3 dark:text-grey-dark-2'>
          {t('form.description')}
        </p>
        <Form {...form}>
          <form
            className='mt-6 space-y-6'
            onSubmit={form.handleSubmit(onSubmit)}
          >
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
                        placeholder={t(
                          'form.fields.arrivalFlight.placeholder'
                        )}
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
