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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CHANNELS } from '@/lib/constants';

export default function QuoteContact({
  form,
}: {
  form: UseFormReturn<QuoteRequestValues>;
}) {
  const t = useTranslations('Contact');
  {
    return (
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
                <Select value={field.value} onValueChange={field.onChange}>
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
    );
  }
}
