import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { QuoteRequestValues } from './QuoteRequestForm';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '../ui/input';
import { useDelivery } from '@/hooks/useDelivery';
import PlacesAutocomplete from 'react-places-autocomplete';

export default function QuoteDelivery({
  form,
  placesReady,
}: {
  form: UseFormReturn<QuoteRequestValues>;
  placesReady: boolean;
}) {
  const t = useTranslations('Contact');
  const tReF = useTranslations('RentForm');
  const tRent = useTranslations('RentForm');

  const deliveryTitle = tRent('sections.delivery.title');
  const deliveryDesc = tRent('sections.delivery.description');

  const { deliveryLocationPath, handleDeliveryPostalSelect } =
    useDelivery(form);
  return (
    <div className='rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-4'>
      <div>
        <h4 className='text-base font-semibold'>{deliveryTitle}</h4>
        <p className='text-sm text-muted-foreground'>{deliveryDesc}</p>
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField
          control={form.control}
          name='delivery.placeType'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {tRent('sections.delivery.fields.placeType.label')}
              </FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={tRent(
                        'sections.delivery.fields.placeType.placeholder'
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='accommodation'>
                      {tRent(
                        'sections.delivery.fields.placeType.accommodation'
                      )}
                    </SelectItem>
                    <SelectItem value='airport'>
                      {tRent('sections.delivery.fields.placeType.airport')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='delivery.locationName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {tRent('sections.delivery.locationName.label')}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={tRent(
                    'sections.delivery.locationName.placeholder'
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField
          control={form.control}
          name={deliveryLocationPath('country')}
          render={({ field }) => {
            const countryValue =
              typeof field.value === 'string' ? field.value : '';
            return (
              <FormItem>
                <FormLabel>
                  {tRent('sections.delivery.fields.country.label')}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={countryValue}
                    placeholder={tRent(
                      'sections.delivery.fields.country.placeholder'
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name={deliveryLocationPath('postalCode')}
          render={({ field }) => {
            const postalValue =
              typeof field.value === 'string' ? field.value : '';
            return (
              <FormItem>
                <FormLabel>
                  {tRent('sections.delivery.fields.postalCode.label')}
                </FormLabel>
                <FormControl>
                  {placesReady ? (
                    <PlacesAutocomplete
                      value={postalValue}
                      onChange={(value) => {
                        field.onChange(value);
                      }}
                      onSelect={async (address, placeId) => {
                        const resolved = await handleDeliveryPostalSelect(
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
                              placeholder: tRent(
                                'sections.drivers.fields.postalCode.placeholder'
                              ),
                              onBlur: field.onBlur,
                            })}
                          />
                          {(loading || suggestions.length > 0) && (
                            <div className='absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border/60 bg-background shadow-lg'>
                              {loading && (
                                <div className='px-3 py-2 text-sm text-muted-foreground'>
                                  {tReF('searching')}
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
                        'sections.drivers.fields.postalCode.placeholder'
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
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField
          control={form.control}
          // name='delivery.address.city'
          name={deliveryLocationPath('city')}
          render={({ field }) => {
            const cityValue =
              typeof field.value === 'string' ? field.value : '';
            return (
              <FormItem>
                <FormLabel>
                  {tRent('sections.delivery.fields.city.label')}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={cityValue}
                    placeholder={tRent(
                      'sections.delivery.fields.city.placeholder'
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name={deliveryLocationPath('street')}
          render={({ field }) => {
            const streetValue =
              typeof field.value === 'string' ? field.value : '';
            return (
              <FormItem>
                <FormLabel>
                  {tRent('sections.delivery.fields.street.label')}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={streetValue}
                    placeholder={tRent(
                      'sections.delivery.fields.street.placeholder'
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField
          control={form.control}
          // name='delivery.address.doorNumber'
          name={deliveryLocationPath('doorNumber')}
          render={({ field }) => {
            const doorValue =
              typeof field.value === 'string' ? field.value : '';
            return (
              <FormItem>
                <FormLabel>
                  {tRent('sections.delivery.fields.doorNumber.label')}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={doorValue}
                    placeholder={tRent(
                      'sections.delivery.fields.doorNumber.placeholder'
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>
    </div>
  );
}
