import { useTranslations } from 'next-intl';
import { UseFormReturn } from 'react-hook-form';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RENTAL_DAYS_OPTIONS } from '@/lib/constants';
import { QuoteRequestValues } from './QuoteRequestForm';

export default function QuoteRentalDays({
  form,
}: {
  form: UseFormReturn<QuoteRequestValues>;
}) {
  const t = useTranslations('Contact');

  return (
    <FormField
      control={form.control}
      name='rentalDays'
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('form.fields.rentalDays.label')}</FormLabel>
          <FormControl>
            <Select
              value={field.value ? String(field.value) : undefined}
              onValueChange={(value) => field.onChange(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('form.fields.rentalDays.placeholder')} />
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
  );
}
