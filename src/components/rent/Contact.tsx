import { cn } from '@/lib/utils';
import { RentFormValues } from '@/schemas/RentSchema';
import { useTranslations } from 'next-intl';
import { UseFormReturn } from 'react-hook-form';
import SectionCard from '../SectionCard';
import { Checkbox } from '../ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';

export default function Contact({
  form,
}: {
  form: UseFormReturn<RentFormValues>;
}) {
  const t = useTranslations('RentForm');
  const isContactSame = form.watch('contact.same');

  return (
    <SectionCard
      title={t('sections.contact.title')}
      description={t('sections.contact.description')}
      contentClassName='space-y-4'
    >
      <FormField
        control={form.control}
        name={'contact.same'}
        render={({ field }) => (
          <FormItem className='flex items-center gap-3 rounded-full border border-border/50 bg-muted/30 px-4 py-2 text-sm'>
            <FormControl>
              <Checkbox
                checked={Boolean(field.value)}
                onCheckedChange={(checked) => field.onChange(!!checked)}
              />
            </FormControl>
            <FormLabel className='font-medium'>
              {t('sections.contact.toggle')}
            </FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out overflow-hidden ',
          isContactSame
            ? 'grid-rows-[0fr] opacity-0 pointer-events-none'
            : 'grid-rows-[1fr] opacity-100'
        )}
      >
        <div className='grid gap-4 md:grid-cols-2 mb-4 mx-2'>
          <FormField
            control={form.control}
            name={'contact.name'}
            render={({ field }) => {
              const contactName =
                typeof field.value === 'string' ? field.value : '';
              return (
                <FormItem className='md:col-span-1'>
                  <FormLabel>
                    {t('sections.contact.fields.name.label')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'sections.contact.fields.name.placeholder'
                      )}
                      value={contactName}
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
            name={'contact.email'}
            render={({ field }) => {
              const contactEmail =
                typeof field.value === 'string' ? field.value : '';
              return (
                <FormItem className='md:col-span-1'>
                  <FormLabel>
                    {t('sections.contact.fields.email.label')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'sections.contact.fields.email.placeholder'
                      )}
                      value={contactEmail}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>
      </div>
    </SectionCard>
  );
}
