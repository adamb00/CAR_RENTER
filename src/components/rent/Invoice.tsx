import React from 'react';
import SectionCard from '../SectionCard';
import { useTranslations } from 'next-intl';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { UseFormReturn } from 'react-hook-form';
import { RentFormValues } from '@/schemas/RentSchema';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import PlacesAutocomplete from 'react-places-autocomplete';
import { useInvoice } from '@/hooks/useInvoice';
import { useWatchForm } from '@/hooks/useWatchForm';

export default function Invoice({
  form,
  placesReady,
}: {
  form: UseFormReturn<RentFormValues>;
  placesReady: boolean;
}) {
  const t = useTranslations('RentForm');
  const { isInvoiceSame } = useWatchForm(form);
  const { invoiceLocationPath, handleInvoicePostalSelect } = useInvoice(form);

  return (
    <SectionCard
      title={t('sections.invoice.title')}
      description={t('sections.invoice.description')}
      contentClassName='space-y-4 '
    >
      <FormField
        control={form.control}
        name={'invoice.same'}
        render={({ field }) => (
          <FormItem className='flex items-center gap-3 rounded-full border border-border/50 bg-muted/30 px-4 py-2 text-sm'>
            <FormControl>
              <Checkbox
                checked={Boolean(field.value)}
                onCheckedChange={(checked) => field.onChange(!!checked)}
              />
            </FormControl>
            <FormLabel className='font-medium'>
              {t('sections.invoice.toggle')}
            </FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out overflow-hidden',
          isInvoiceSame
            ? 'grid-rows-[0fr] opacity-0 pointer-events-none'
            : 'grid-rows-[1fr] opacity-100'
        )}
      >
        <div className='space-y-4 mx-2'>
          <div className='grid gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name={'invoice.name'}
              render={({ field }) => {
                const invoiceName =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.invoice.fields.name.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.invoice.fields.name.placeholder'
                        )}
                        value={invoiceName}
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
              name={'invoice.email'}
              render={({ field }) => {
                const invoiceEmail =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.invoice.fields.email.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder={t(
                          'sections.invoice.fields.email.placeholder'
                        )}
                        value={invoiceEmail}
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
              name={'invoice.phoneNumber'}
              render={({ field }) => {
                const invoicePhone =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.invoice.fields.phoneNumber.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='tel'
                        placeholder={t(
                          'sections.invoice.fields.phoneNumber.placeholder'
                        )}
                        value={invoicePhone}
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
              name={invoiceLocationPath('postalCode')}
              render={({ field }) => {
                const postalValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.invoice.fields.address.postalCode.label')}
                    </FormLabel>
                    <FormControl>
                      {placesReady ? (
                        <PlacesAutocomplete
                          value={postalValue}
                          onChange={(value) => {
                            field.onChange(value);
                          }}
                          onSelect={async (address, placeId) => {
                            const resolved = await handleInvoicePostalSelect(
                              address,
                              placeId
                            );
                            if (resolved) {
                              field.onChange(resolved);
                            }
                          }}
                          searchOptions={{ types: ['geocode'] }}
                          debounce={200}
                          highlightFirstSuggestion
                        >
                          {({
                            getInputProps,
                            suggestions,
                            getSuggestionItemProps,
                            loading,
                          }) => (
                            <div className='relative'>
                              <Input
                                {...getInputProps({
                                  placeholder: t(
                                    'sections.invoice.fields.address.postalCode.placeholder'
                                  ),
                                  onBlur: field.onBlur,
                                })}
                              />
                              {(loading || suggestions.length > 0) && (
                                <div className='absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border/60 bg-background shadow-lg'>
                                  {loading && (
                                    <div className='px-3 py-2 text-sm text-muted-foreground'>
                                      {t('searching')}
                                    </div>
                                  )}
                                  {suggestions.map((suggestion) => {
                                    const itemProps = getSuggestionItemProps(
                                      suggestion,
                                      {
                                        className:
                                          'cursor-pointer px-3 py-2 text-sm hover:bg-accent',
                                      }
                                    );
                                    const { key, ...restProps } = itemProps as {
                                      key?: React.Key;
                                      [prop: string]: unknown;
                                    };
                                    const normalizedKey =
                                      key != null
                                        ? String(key)
                                        : suggestion.placeId ??
                                          suggestion.description;
                                    return (
                                      <div key={normalizedKey} {...restProps}>
                                        {suggestion.description}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </PlacesAutocomplete>
                      ) : (
                        <Input
                          placeholder={t(
                            'sections.invoice.fields.address.postalCode.placeholder'
                          )}
                          value={postalValue}
                          onChange={(event) => {
                            field.onChange(event.target.value);
                          }}
                          onBlur={field.onBlur}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4'>
            <FormField
              control={form.control}
              name={invoiceLocationPath('country')}
              render={({ field }) => {
                const countryValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.invoice.fields.address.country.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.invoice.fields.address.country.placeholder'
                        )}
                        value={countryValue}
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
              name={invoiceLocationPath('city')}
              render={({ field }) => {
                const cityValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.invoice.fields.address.city.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.invoice.fields.address.city.placeholder'
                        )}
                        value={cityValue}
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
              name={invoiceLocationPath('street')}
              render={({ field }) => {
                const streetValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.invoice.fields.address.street.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.invoice.fields.address.street.placeholder'
                        )}
                        value={streetValue}
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
              name={invoiceLocationPath('doorNumber')}
              render={({ field }) => {
                const doorValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.invoice.fields.address.doorNumber.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.invoice.fields.address.doorNumber.placeholder'
                        )}
                        value={doorValue}
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
      </div>
    </SectionCard>
  );
}
