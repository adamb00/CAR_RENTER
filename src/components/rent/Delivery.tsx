import React from 'react';
import SectionCard from '../SectionCard';
import { useLocale, useTranslations } from 'next-intl';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { UseFormReturn } from 'react-hook-form';
import { RentFormValues } from '@/schemas/RentSchema';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import PlacesAutocomplete from 'react-places-autocomplete';
import { useDelivery } from '@/hooks/useDelivery';
import AccommodationAutocompleteInput from './AccommodationAutocompleteInput';
import type { AccommodationSuggestion } from '@/lib/accommodations/types';
import AirportAutocompleteInput from './AirportAutocompleteInput';
import type { AirportSuggestion } from '@/lib/airports/types';

const normalizeIsland = (value: string): 'lanzarote' | 'fuerteventura' | null => {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (normalized.includes('lanzarote')) return 'lanzarote';
  if (normalized.includes('fuerteventura')) return 'fuerteventura';
  return null;
};

const fallbackPostalCodeByIsland = (
  island: string
): string => {
  const islandKey = normalizeIsland(island);
  if (islandKey === 'lanzarote') return '35500';
  if (islandKey === 'fuerteventura') return '35600';
  return '00000';
};

export default function Delivery({
  form,
  placesReady,
}: {
  form: UseFormReturn<RentFormValues>;
  placesReady: boolean;
}) {
  const t = useTranslations('RentForm');
  const locale = useLocale();
  const accommodationNoResultLabel = locale.toLowerCase().startsWith('hu')
    ? 'Nincs talalat a hivatalos szallaslistaban'
    : 'No matching accommodation found';
  const airportNoResultLabel = locale.toLowerCase().startsWith('hu')
    ? 'Nincs talalat a lanzarotei vagy fuerteventurai repterek kozott'
    : 'No matching Lanzarote or Fuerteventura airport found';

  const { deliveryLocationPath, handleDeliveryPostalSelect } =
    useDelivery(form);
  const placeTypeValue = form.watch('delivery.placeType');
  const shouldShowDeliveryDetails =
    placeTypeValue === 'accommodation' || placeTypeValue === 'airport';
  const shouldUseAccommodationList = placeTypeValue === 'accommodation';
  const shouldUseAirportList = placeTypeValue === 'airport';

  const clearDeliverySelectionFields = React.useCallback(() => {
    const resetOptions = {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: false,
    } as const;

    form.setValue('delivery.locationName', '', resetOptions);
    (
      ['country', 'postalCode', 'city', 'street', 'doorNumber'] as const
    ).forEach((key) => {
      form.setValue(deliveryLocationPath(key), '', resetOptions);
    });

    form.clearErrors([
      'delivery.locationName',
      'delivery.address.country',
      'delivery.address.postalCode',
      'delivery.address.city',
      'delivery.address.street',
      'delivery.address.doorNumber',
    ]);
  }, [deliveryLocationPath, form]);

  const handleAccommodationSelect = React.useCallback(
    (accommodation: AccommodationSuggestion) => {
      const options = {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      } as const;
      const country = accommodation.country || 'Spain';
      const city =
        accommodation.municipality ||
        accommodation.locality ||
        accommodation.island ||
        'Fuerteventura';
      const postalCode =
        accommodation.postalCode ||
        fallbackPostalCodeByIsland(accommodation.island);

      clearDeliverySelectionFields();
      form.setValue('delivery.locationName', accommodation.name, options);
      form.setValue(deliveryLocationPath('country'), country, options);
      form.setValue(deliveryLocationPath('postalCode'), postalCode, options);
      form.setValue(deliveryLocationPath('city'), city, options);
      if (accommodation.address) {
        form.setValue(deliveryLocationPath('street'), accommodation.address, options);
      }
    },
    [clearDeliverySelectionFields, deliveryLocationPath, form]
  );

  const handleAirportSelect = React.useCallback(
    (airport: AirportSuggestion) => {
      const options = {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      } as const;

      const code = airport.iataCode || airport.ident;
      const locationName = code ? `${airport.name} (${code})` : airport.name;
      const country = airport.country || 'Spain';
      const city = airport.municipality || airport.name || 'Fuerteventura';
      const postalCode = fallbackPostalCodeByIsland(airport.island);

      clearDeliverySelectionFields();
      form.setValue('delivery.locationName', locationName, options);
      form.setValue(deliveryLocationPath('country'), country, options);
      form.setValue(deliveryLocationPath('postalCode'), postalCode, options);
      form.setValue(deliveryLocationPath('city'), city, options);
    },
    [clearDeliverySelectionFields, deliveryLocationPath, form]
  );

  React.useEffect(() => {
    if (shouldShowDeliveryDetails) return;

    form.setValue('delivery.locationName', '', {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });

    (
      [
        'country',
        'postalCode',
        'city',
        'street',
        'doorNumber',
      ] as const
    ).forEach((key) => {
      form.setValue(deliveryLocationPath(key), '', {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    });

    form.clearErrors([
      'delivery.locationName',
      'delivery.address.country',
      'delivery.address.postalCode',
      'delivery.address.city',
      'delivery.address.street',
      'delivery.address.doorNumber',
    ]);
  }, [deliveryLocationPath, form, shouldShowDeliveryDetails]);

  return (
    <SectionCard
      title={t('sections.delivery.title')}
      description={t('sections.delivery.description')}
      contentClassName='space-y-4'
    >
      <div className='space-y-3'>
        <FormField
          control={form.control}
          name={'delivery.placeType'}
          render={({ field }) => {
            const selectedValue =
              typeof field.value === 'string' ? field.value : undefined;
            return (
              <FormItem className='max-w-sm'>
                <FormLabel>
                  {t('sections.delivery.fields.placeType.label')}
                </FormLabel>
                <FormControl>
                  <Select
                    value={selectedValue}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          'sections.delivery.fields.placeType.placeholder'
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value='airport'>
                          {t('sections.delivery.fields.placeType.airport')}
                        </SelectItem>
                        <SelectItem value='accommodation'>
                          {t(
                            'sections.delivery.fields.placeType.accommodation'
                          )}
                        </SelectItem>
                        <SelectItem value='office'>
                          {t('sections.delivery.fields.placeType.office')}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>
      {shouldShowDeliveryDetails ? (
        <>
          <FormField
            control={form.control}
            name={'delivery.locationName'}
            render={({ field }) => {
              const nameValue =
                typeof field.value === 'string' ? field.value : '';
              return (
                <FormItem className='max-w-lg'>
                  <FormLabel>
                    {t('sections.delivery.locationName.label')}
                  </FormLabel>
                  <FormControl>
                    {shouldUseAccommodationList ? (
                      <AccommodationAutocompleteInput
                        placeholder={t(
                          'sections.delivery.locationName.placeholder'
                        )}
                        value={nameValue}
                        onChange={(value) => field.onChange(value)}
                        onBlur={field.onBlur}
                        onSelect={handleAccommodationSelect}
                        searchingLabel={t('searching')}
                        noResultLabel={accommodationNoResultLabel}
                      />
                    ) : shouldUseAirportList ? (
                      <AirportAutocompleteInput
                        placeholder={t(
                          'sections.delivery.locationName.placeholder'
                        )}
                        value={nameValue}
                        onChange={(value) => field.onChange(value)}
                        onBlur={field.onBlur}
                        onSelect={handleAirportSelect}
                        searchingLabel={t('searching')}
                        noResultLabel={airportNoResultLabel}
                      />
                    ) : (
                      <Input
                        placeholder={t(
                          'sections.delivery.locationName.placeholder'
                        )}
                        value={nameValue}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            <FormField
              control={form.control}
              name={deliveryLocationPath('country')}
              render={({ field }) => {
                const countryValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.delivery.fields.country.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.delivery.fields.country.placeholder'
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
              name={deliveryLocationPath('postalCode')}
              render={({ field }) => {
                const postalValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.delivery.fields.postalCode.label')}
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
                                  placeholder: t(
                                    'sections.delivery.fields.postalCode.placeholder'
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
                            'sections.delivery.fields.postalCode.placeholder'
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
            <FormField
              control={form.control}
              name={deliveryLocationPath('city')}
              render={({ field }) => {
                const cityValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.delivery.fields.city.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.delivery.fields.city.placeholder'
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
              name={deliveryLocationPath('street')}
              render={({ field }) => {
                const streetValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-2 lg:col-span-2'>
                    <FormLabel>
                      {t('sections.delivery.fields.street.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.delivery.fields.street.placeholder'
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
              name={deliveryLocationPath('doorNumber')}
              render={({ field }) => {
                const doorValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.delivery.fields.doorNumber.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.delivery.fields.doorNumber.placeholder'
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
        </>
      ) : null}
    </SectionCard>
  );
}
