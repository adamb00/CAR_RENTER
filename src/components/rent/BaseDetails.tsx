import { CALENDAR_LOCALE_MAP } from '@/lib/calendar_locale_map';
import type { Car, CarColor } from '@/lib/cars-shared';
import { CAR_COLOR_SWATCH } from '@/lib/cars-shared';
import { DATE_LOCALE_MAP } from '@/lib/date_locale_map';

import { PAYMENT_METHOD_VALUES, RentFormValues } from '@/schemas/RentSchema';
import { enUS } from 'date-fns/locale';
import { useMessages, useTranslations } from 'next-intl';
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { MultiSelect } from '../MultiSelect';
import SectionCard from '../SectionCard';
import { Badge } from '../ui/badge';
import { DateRangePicker } from '../ui/date-range-picker';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { EXTRA_VALUES, RENTAL_DAYS_OPTIONS } from '@/lib/constants';

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

export default function BaseDetails({
  locale,
  form,
  car,
  colorsLabel,
  translateColor,
}: {
  locale: string;
  form: UseFormReturn<RentFormValues>;
  car: Pick<Car, 'id' | 'seats' | 'colors'>;
  colorsLabel?: string;
  translateColor?: (color: CarColor) => string;
}) {
  const t = useTranslations('RentForm');
  const messages = useMessages();
  const dateLocale = DATE_LOCALE_MAP[locale] ?? 'en-US';
  const calendarLocale = CALENDAR_LOCALE_MAP[locale] ?? enUS;

  const getBadgeStyle = (colorKey: CarColor) => {
    const hex = CAR_COLOR_SWATCH[colorKey] ?? '#e5e7eb';
    const rgb = hex.replace('#', '');
    const r = parseInt(rgb.substring(0, 2), 16);
    const g = parseInt(rgb.substring(2, 4), 16);
    const b = parseInt(rgb.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const textColor = luminance > 0.7 ? '#0f172a' : '#f8fafc';
    return { backgroundColor: hex, color: textColor, borderColor: hex };
  };

  const today = React.useMemo(() => {
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    return current;
  }, []);

  const oneYearAhead = React.useMemo(() => {
    const future = new Date(today);
    future.setFullYear(future.getFullYear() + 1);
    return future;
  }, [today]);

  const extrasOptions = React.useMemo(
    () =>
      EXTRA_VALUES.map((value) => ({
        value,
        label: t(`extras.options.${value}`),
      })),
    [t],
  );
  const arrivalHourOptions = React.useMemo(
    () => Array.from({ length: 24 }, (_, idx) => String(idx).padStart(2, '0')),
    [],
  );
  const arrivalMinuteOptions = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, idx) =>
        String(idx * 5).padStart(2, '0'),
      ),
    [],
  );
  const isHungarianLocale = locale.toLowerCase().startsWith('hu');
  const arrivalHourLabel = isHungarianLocale
    ? 'Érkezés (óra)'
    : 'Arrival (hour)';
  const arrivalMinuteLabel =
    isHungarianLocale ? 'Érkezés (perc)' : 'Arrival (minute)';

  const dateRangePickerMessages = (
    messages?.RentForm as Record<string, unknown> | null
  )?.dateRangePicker as
    | {
        apply?: string;
        cancel?: string;
      }
    | undefined;

  return (
    <SectionCard
      title={t('sections.booking.title')}
      description={t('sections.booking.description')}
      contentClassName='space-y-8'
    >
      {Array.isArray(car.colors) && car.colors.length > 0 ? (
        <div className='rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm'>
          <p className='font-semibold uppercase tracking-wide text-muted-foreground'>
            {colorsLabel}
          </p>
          <div className='mt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-foreground/90'>
            {car.colors.map((color) => (
              <Badge
                key={`${car.id}-color-${color}`}
                variant='outline'
                className='border'
                style={getBadgeStyle(color)}
              >
                {translateColor ? translateColor(color) : t(`colors.${color}`)}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
      <div className='grid gap-6 lg:grid-cols-4'>
        <div className='lg:col-span-1'>
          <FormField
            control={form.control}
            name='extras'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm font-medium'>
                  {t('extras.label')}
                </FormLabel>
                <FormControl>
                  <MultiSelect
                    options={extrasOptions}
                    defaultValue={field.value ?? []}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className='lg:col-span-1'>
          <FormField
            control={form.control}
            name='rentalPeriod'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm font-medium'>
                  {t('rentalPeriod.label')}
                </FormLabel>
                <FormControl>
                  <DateRangePicker
                    initialDateFrom={parseDateValue(field.value?.startDate)}
                    initialDateTo={parseDateValue(field.value?.endDate)}
                    showCompare={false}
                    minDate={today}
                    maxDate={oneYearAhead}
                    onUpdate={({ range }) => {
                      if (range?.from && range?.to) {
                        field.onChange({
                          startDate: formatDateValue(range.from),
                          endDate: formatDateValue(range.to),
                        });
                      }
                    }}
                    locale={dateLocale}
                    calendarLocale={calendarLocale}
                    applyLabel={dateRangePickerMessages?.apply}
                    cancelLabel={dateRangePickerMessages?.cancel}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className='lg:col-span-1'>
          <FormField
            control={form.control}
            name='rentalDays'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm font-medium'>
                  {t('rentalDays.label')}
                </FormLabel>
                <FormControl>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('rentalDays.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {RENTAL_DAYS_OPTIONS.map((day) => (
                          <SelectItem key={day} value={String(day)}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className='lg:col-span-1'>
          <FormField
            control={form.control}
            name='adults'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm font-medium'>
                  {t('adults.label')}
                </FormLabel>
                <FormControl>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('adults.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Array.from({ length: car.seats }, (_, i) => i + 1).map(
                          (num) => (
                            <SelectItem key={num} value={String(num)}>
                              {num}
                            </SelectItem>
                          ),
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
        <FormField
          control={form.control}
          name={'delivery.arrivalFlight'}
          render={({ field }) => {
            const value = typeof field.value === 'string' ? field.value : '';
            return (
              <FormItem>
                <FormLabel>
                  {t('sections.delivery.fields.arrivalFlight.label')}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t(
                      'sections.delivery.fields.arrivalFlight.placeholder',
                    )}
                    value={value}
                    onChange={(event) => field.onChange(event.target.value)}
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
            const value = typeof field.value === 'string' ? field.value : '';
            return (
              <FormItem>
                <FormLabel>
                  {t('sections.delivery.fields.departureFlight.label')}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t(
                      'sections.delivery.fields.departureFlight.placeholder',
                    )}
                    value={value}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name={'delivery.arrivalHour'}
          render={({ field }) => {
            const value = typeof field.value === 'string' ? field.value : '';
            return (
              <FormItem>
                <FormLabel>{arrivalHourLabel}</FormLabel>
                <FormControl>
                  <Select
                    value={value || undefined}
                    onValueChange={(selectedValue) =>
                      field.onChange(selectedValue)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='HH' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {arrivalHourOptions.map((hour) => (
                          <SelectItem key={hour} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name={'delivery.arrivalMinute'}
          render={({ field }) => {
            const value = typeof field.value === 'string' ? field.value : '';
            return (
              <FormItem>
                <FormLabel>{arrivalMinuteLabel}</FormLabel>
                <FormControl>
                  <Select
                    value={value || undefined}
                    onValueChange={(selectedValue) =>
                      field.onChange(selectedValue)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='MM' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {arrivalMinuteOptions.map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            {minute}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name={'consents.paymentMethod'}
          render={({ field }) => {
            const paymentMethodValue =
              typeof field.value === 'string' ? field.value : '';
            return (
              <FormItem className='max-w-full'>
                <FormLabel className='text-sm font-medium'>
                  {t('sections.booking.paymentMethod.label')}
                </FormLabel>
                <FormControl>
                  <Select
                    value={paymentMethodValue || undefined}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          'sections.booking.paymentMethod.placeholder',
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {PAYMENT_METHOD_VALUES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {t(
                              `sections.booking.paymentMethod.options.${value}`,
                            )}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>
      <p className='text-xs text-muted-foreground leading-relaxed'>
        {t('extras.packages.base')}
        <br />
        {t('extras.packages.energy')}
        <br />
        {t('extras.packages.lateArrival')}
      </p>
    </SectionCard>
  );
}
