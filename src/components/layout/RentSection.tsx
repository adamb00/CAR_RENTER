'use client';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { DateRangePicker } from '../ui/date-range-picker';
import { formatDateValue, parseDateValue } from '@/lib/format';
import { DATE_LOCALE_MAP } from '@/lib/date_locale_map';
import { sixMonthsAhead } from '@/lib/constants';
import { CALENDAR_LOCALE_MAP } from '@/lib/calendar_locale_map';
import { enUS } from 'date-fns/locale';
import { Button } from '../ui/button';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '../ui/input';

type ValidationKey =
  | 'validation.island'
  | 'validation.startDate'
  | 'validation.endDate'
  | 'validation.age';

const createSchema = (t: (key: ValidationKey) => string) =>
  z.object({
    island: z.string().min(1, t('validation.island')),
    startDate: z.string().min(1, t('validation.startDate')),
    endDate: z.string().min(1, t('validation.endDate')),
    age: z.number().min(18, t('validation.age')).max(100, t('validation.age')),
  });

type RentSchemaValues = z.infer<ReturnType<typeof createSchema>>;

export default function RentSection({ locale }: { locale: string }) {
  const t = useTranslations('RentSection');
  const schema = createSchema(t);
  const [isPending, startTransition] = useTransition();
  const dateLocale = DATE_LOCALE_MAP[locale] ?? 'en-US';
  const calendarLocale = CALENDAR_LOCALE_MAP[locale] ?? enUS;
  const router = useRouter();

  const form = useForm<RentSchemaValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      island: '',
      startDate: '',
      endDate: '',
      age: 0,
    },
  });

  const rentalStartValue = form.watch('startDate');
  const rentalEndValue = form.watch('endDate');

  const days =
    rentalStartValue && rentalEndValue
      ? Math.ceil(
          (new Date(rentalEndValue).getTime() -
            new Date(rentalStartValue).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

  const onSubmit = (data: RentSchemaValues) => {
    startTransition(() => {
      if (days && days > 30) {
        router.push(
          `/${locale}/contact?island=${data.island}&startDate=${data.startDate}&endDate=${data.endDate}&age=${data.age}&days=${days}`,
        );
      } else {
        router.push(
          `/${locale}/cars?island=${data.island}&startDate=${data.startDate}&endDate=${data.endDate}&age=${data.age}&days=${days}`,
        );
      }
    });
  };
  return (
    <section
      id='about_section'
      className='section-about mb-22 2xl:mb-32  p-10 rounded-2xl'
    >
      <div className='u-center-text u-margin-bottom-big text-center mb-10'>
        <h2 className='block text-2xl md:text-4xl font-semibold uppercase leading-10 lg:leading-6 tracking-wide md:tracking-wider text-sky-dark dark:text-sky-light md:mb-24'>
          {t('title')}
        </h2>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='grid  grid-cols-1 md:grid-cols-3 gap-4 md:gap-6'
        >
          <FormField
            control={form.control}
            name='age'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('age')}</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    min={18}
                    max={100}
                    value={field.value || ''}
                    onChange={(event) => {
                      field.onChange(
                        event.target.value === ''
                          ? 0
                          : event.target.valueAsNumber,
                      );
                    }}
                    placeholder={t('age')}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='island'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pickupLocation')}</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('islandPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='lanzarote'>Lanzarote</SelectItem>
                      <SelectItem value='fuerteventura'>
                        Fuerteventura
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='startDate'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pickupDate')}</FormLabel>
                <FormControl>
                  <DateRangePicker
                    showCompare={false}
                    initialDateFrom={parseDateValue(rentalStartValue)}
                    initialDateTo={parseDateValue(rentalEndValue)}
                    maxDate={sixMonthsAhead}
                    minDate={new Date()}
                    locale={dateLocale}
                    calendarLocale={calendarLocale}
                    applyLabel={t('apply')}
                    cancelLabel={t('cancel')}
                    onUpdate={({ range }) => {
                      if (range?.from) {
                        field.onChange(formatDateValue(range.from));
                      } else {
                        field.onChange('');
                      }
                      if (range?.to) {
                        form.setValue('endDate', formatDateValue(range.to), {
                          shouldDirty: true,
                        });
                      } else {
                        form.setValue('endDate', '', {
                          shouldDirty: true,
                        });
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type='submit'
            disabled={isPending}
            className='max-w-2xs sm:w-auto bg-sky-dark text-white hover:bg-sky-dark/90 cursor-pointer'
          >
            {days && days > 30
              ? t('requestQuote')
              : t('showPrices')}
          </Button>
        </form>
      </Form>
    </section>
  );
}
