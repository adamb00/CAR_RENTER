import { ContactQuoteRecord } from '@/lib/contactQuotes';
import { PAYMENT_METHOD_VALUES, RentFormValues } from '@/schemas/RentSchema';
import { useTranslations } from 'next-intl';
import { UseFormReturn } from 'react-hook-form';
import { Checkbox } from '../ui/checkbox';
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

export default function Consents({
  form,
  quotePrefill,
}: {
  form: UseFormReturn<RentFormValues>;
  quotePrefill?: ContactQuoteRecord | null;
}) {
  const t = useTranslations('RentForm');
  const bookingData = Array.isArray(quotePrefill?.bookingRequestData)
    ? quotePrefill?.bookingRequestData[0]
    : quotePrefill?.bookingRequestData;
  const insurancePriceRaw = bookingData?.insurance;

  const insurancePriceText =
    typeof insurancePriceRaw === 'string' ? insurancePriceRaw.trim() : '';
  const insurancePriceMessage = insurancePriceText
    ? t('sections.booking.insurancePriceLabel', {
        price: insurancePriceText,
      })
    : t('sections.booking.insurancePricePending');

  const insuranceOptIn = form.watch('consents.insurance');

  return (
    <div className='rounded-3xl border border-grey-light-2/60 dark:border-grey-dark-2/50 bg-white/90 dark:bg-transparent backdrop-blur px-6 py-6 sm:px-8 sm:py-8 shadow-sm space-y-4'>
      <FormField
        control={form.control}
        name={'consents.insurance'}
        render={({ field }) => (
          <FormItem className='flex flex-col gap-2'>
            <div className='flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm'>
              <FormControl>
                <Checkbox
                  checked={Boolean(field.value)}
                  onCheckedChange={(checked) =>
                    field.onChange(Boolean(checked))
                  }
                />
              </FormControl>
              <div>
                <FormLabel className='font-medium leading-snug'>
                  {t('sections.booking.insuranceCheckbox')}
                </FormLabel>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {insurancePriceMessage}
                  {insurancePriceRaw ? '€' : ''}
                </p>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {Boolean(insuranceOptIn) ? (
        <div className='rounded-2xl border border-amber-500/40 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 shadow-sm dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-100'>
          {t('sections.booking.insuranceDepositNotice')}
        </div>
      ) : null}
    </div>
  );
}
