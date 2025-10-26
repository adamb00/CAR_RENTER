import { CARS } from '@/lib/cars';
import { CALENDAR_LOCALE_MAP } from '@/lib/calendar_locale_map';
import { DATE_LOCALE_MAP } from '@/lib/date_locale_map';
import { EXTRA_VALUES } from '@/lib/extra_values';
import { RentFormValues } from '@/schemas/RentSchema';
import { useMessages, useTranslations } from 'next-intl';
import { notFound } from 'next/navigation';
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { MultiSelect } from '../MultiSelect';
import SectionCard from '../SectionCard';
import { DateRangePicker } from '../ui/date-range-picker';
import { enUS } from 'date-fns/locale';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

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
  id,
}: {
  locale: string;
  form: UseFormReturn<RentFormValues>;
  id: string;
}) {
  const t = useTranslations('RentForm');
  const messages = useMessages();
  const dateLocale = DATE_LOCALE_MAP[locale] ?? 'en-US';
  const calendarLocale = CALENDAR_LOCALE_MAP[locale] ?? enUS;
  const car = CARS.find((item) => item.id === id);

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
    [t]
  );

  if (!car) return notFound();

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
      <div className='grid gap-6 lg:grid-cols-3'>
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
                          )
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
