import { useMessages, useTranslations } from 'next-intl';
import { UseFormReturn } from 'react-hook-form';
import { QuoteRequestValues } from './QuoteRequestForm';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DateRangePicker } from '../ui/date-range-picker';
import { formatDateValue, parseDateValue } from '@/lib/format';
import { oneYearAhead, tomorrow } from '@/lib/constants';
import { DATE_LOCALE_MAP } from '@/lib/date_locale_map';
import { CALENDAR_LOCALE_MAP } from '@/lib/calendar_locale_map';
import { enUS } from 'date-fns/locale';

export default function QuoteRentalStart({
  form,
  locale,
}: {
  form: UseFormReturn<QuoteRequestValues>;
  locale: string;
}) {
  const t = useTranslations('Contact');
  const rentalStartValue = form.watch('rentalStart');
  const rentalEndValue = form.watch('rentalEnd');
  const messages = useMessages();

  const dateLocale = DATE_LOCALE_MAP[locale] ?? 'en-US';
  const calendarLocale = CALENDAR_LOCALE_MAP[locale] ?? enUS;
  const dateRangePickerMessages = (
    messages?.RentForm as Record<string, unknown> | null
  )?.dateRangePicker as
    | {
        apply?: string;
        cancel?: string;
      }
    | undefined;
  return (
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
                minDate={tomorrow}
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
                    form.setValue('rentalEnd', formatDateValue(range.to), {
                      shouldDirty: true,
                    });
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
  );
}
