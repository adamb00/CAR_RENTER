import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { QuoteRequestValues } from './QuoteRequestForm';
import { useTranslations } from 'next-intl';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';

export default function QuoteFlights({
  form,
}: {
  form: UseFormReturn<QuoteRequestValues>;
}) {
  const t = useTranslations('Contact');

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <FormField
        control={form.control}
        name='arrivalFlight'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.fields.arrivalFlight.label')}</FormLabel>
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
            <FormLabel>{t('form.fields.departureFlight.label')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t('form.fields.departureFlight.placeholder')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
