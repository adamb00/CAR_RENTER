import { useTranslations } from 'next-intl';
import { UseFormReturn } from 'react-hook-form';
import { QuoteRequestValues } from './QuoteRequestForm';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { MultiSelect } from '../MultiSelect';
import { useMemo } from 'react';
import { EXTRA_VALUES } from '@/lib/constants';

export default function QuoteExtras({
  form,
}: {
  form: UseFormReturn<QuoteRequestValues>;
}) {
  const tRent = useTranslations('RentForm');

  const extrasOptions = useMemo(
    () =>
      EXTRA_VALUES.map((value) => ({
        value,
        label: tRent(`extras.options.${value}`),
      })),
    [tRent]
  );
  return (
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
  );
}
