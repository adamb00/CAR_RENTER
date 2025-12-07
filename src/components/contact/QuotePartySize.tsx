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

export default function QuotePartySize({
  form,
}: {
  form: UseFormReturn<QuoteRequestValues>;
}) {
  const t = useTranslations('Contact');

  return (
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
  );
}
