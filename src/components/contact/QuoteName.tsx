import { useTranslations } from 'next-intl';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { QuoteRequestValues } from './QuoteRequestForm';

export default function QuoteName({
  form,
}: {
  form: UseFormReturn<QuoteRequestValues>;
}) {
  const t = useTranslations('Contact');

  return (
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
  );
}
