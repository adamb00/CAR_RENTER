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
import { FieldPath, UseFormReturn } from 'react-hook-form';
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
import { FIXED_AIRPORT_OPTIONS } from '@/lib/airports/fixed-airports';
import { Checkbox } from '../ui/checkbox';
import TimeFieldLabel from './TimeFieldLabel';

type DeliveryAddressKey =
  | 'country'
  | 'postalCode'
  | 'city'
  | 'street'
  | 'doorNumber';

const DELIVERY_ADDRESS_KEYS: readonly DeliveryAddressKey[] = [
  'country',
  'postalCode',
  'city',
  'street',
  'doorNumber',
];

const DELIVERY_ISLAND_OPTIONS = ['Lanzarote', 'Fuerteventura'] as const;

const toDeliveryIsland = (
  value?: string | null,
): (typeof DELIVERY_ISLAND_OPTIONS)[number] | undefined => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'lanzarote') return 'Lanzarote';
  if (normalized === 'fuerteventura') return 'Fuerteventura';
  return undefined;
};

export default function Delivery({
  form,
  placesReady,
}: {
  form: UseFormReturn<RentFormValues>;
  placesReady: boolean;
}) {
  const t = useTranslations('RentForm');

  const { deliveryLocationPath, handleDeliveryPostalSelect } =
    useDelivery(form);
  const placeTypeValue = form.watch('delivery.placeType');
  const deliveryIslandValue = form.watch('delivery.island');
  const returnSameValue = form.watch('delivery.same');
  const returnPlaceTypeValue = form.watch('delivery.returnLocation.placeType');
  const deliveryLocationName = form.watch('delivery.locationName');
  const deliveryCountry = form.watch('delivery.address.country');
  const deliveryPostalCode = form.watch('delivery.address.postalCode');
  const deliveryCity = form.watch('delivery.address.city');
  const deliveryStreet = form.watch('delivery.address.street');
  const deliveryDoorNumber = form.watch('delivery.address.doorNumber');
  const returnHourOptions = React.useMemo(
    () => Array.from({ length: 24 }, (_, idx) => String(idx).padStart(2, '0')),
    [],
  );
  const returnMinuteOptions = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, idx) => String(idx * 5).padStart(2, '0')),
    [],
  );
  const returnHourLabel = `${t('sections.delivery.time.return')} (${t(
    'sections.delivery.time.hour',
  )})`;
  const returnMinuteLabel = `${t('sections.delivery.time.return')} (${t(
    'sections.delivery.time.minute',
  )})`;
  const timeTooltip = t('sections.delivery.time.tooltip');
  const shouldShowLocationField =
    placeTypeValue === 'accommodation' || placeTypeValue === 'airport';
  const shouldShowAddressFields = placeTypeValue === 'accommodation';
  const shouldUseAccommodationList = placeTypeValue === 'accommodation';
  const shouldUseAirportSelect = placeTypeValue === 'airport';
  const airportOptions = React.useMemo(() => {
    const normalizedIsland = toDeliveryIsland(
      typeof deliveryIslandValue === 'string' ? deliveryIslandValue : null,
    );

    if (!normalizedIsland) return FIXED_AIRPORT_OPTIONS;

    return FIXED_AIRPORT_OPTIONS.filter((airport) => {
      if (normalizedIsland === 'Lanzarote') return airport.id === 'lanzarote';
      return airport.id === 'fuerteventura';
    });
  }, [deliveryIslandValue]);
  const shouldShowReturnLocationForm = returnSameValue === false;
  const shouldShowReturnLocationField =
    returnPlaceTypeValue === 'accommodation' ||
    returnPlaceTypeValue === 'airport';
  const shouldShowReturnAddressFields =
    returnPlaceTypeValue === 'accommodation';
  const shouldUseReturnAirportSelect = returnPlaceTypeValue === 'airport';
  const returnLocationPath = React.useCallback(
    (key: DeliveryAddressKey): FieldPath<RentFormValues> =>
      `delivery.returnLocation.address.${key}` as FieldPath<RentFormValues>,
    [],
  );

  const clearReturnLocationFields = React.useCallback(
    (markDirty = true) => {
      const resetOptions = {
        shouldDirty: markDirty,
        shouldTouch: markDirty,
        shouldValidate: false,
      } as const;

      form.setValue('delivery.returnLocation.locationName', '', resetOptions);
      DELIVERY_ADDRESS_KEYS.forEach((key) => {
        form.setValue(returnLocationPath(key), '', resetOptions);
      });

      form.clearErrors([
        'delivery.returnLocation.locationName',
        'delivery.returnLocation.address.country',
        'delivery.returnLocation.address.postalCode',
        'delivery.returnLocation.address.city',
        'delivery.returnLocation.address.street',
        'delivery.returnLocation.address.doorNumber',
      ]);
    },
    [form, returnLocationPath],
  );

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
        (accommodation.island === 'lanzarote'
          ? '35500'
          : accommodation.island === 'fuerteventura'
            ? '35600'
            : '00000');

      clearDeliverySelectionFields();
      form.setValue(
        'delivery.island',
        toDeliveryIsland(accommodation.island),
        options,
      );
      form.setValue('delivery.locationName', accommodation.name, options);
      form.setValue(deliveryLocationPath('country'), country, options);
      form.setValue(deliveryLocationPath('postalCode'), postalCode, options);
      form.setValue(deliveryLocationPath('city'), city, options);
      if (accommodation.address) {
        form.setValue(
          deliveryLocationPath('street'),
          accommodation.address,
          options,
        );
      }
    },
    [clearDeliverySelectionFields, deliveryLocationPath, form],
  );

  const handleFixedAirportSelect = React.useCallback(
    (locationName: string) => {
      const selectedAirport = FIXED_AIRPORT_OPTIONS.find(
        (airport) => airport.locationName === locationName,
      );
      if (!selectedAirport) return;

      const options = {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      } as const;

      clearDeliverySelectionFields();
      form.setValue(
        'delivery.island',
        selectedAirport.id === 'lanzarote' ? 'Lanzarote' : 'Fuerteventura',
        options,
      );
      form.setValue(
        'delivery.locationName',
        selectedAirport.locationName,
        options,
      );
      form.setValue(
        deliveryLocationPath('country'),
        selectedAirport.country,
        options,
      );
      form.setValue(
        deliveryLocationPath('postalCode'),
        selectedAirport.postalCode,
        options,
      );
      form.setValue(
        deliveryLocationPath('city'),
        selectedAirport.city,
        options,
      );
    },
    [clearDeliverySelectionFields, deliveryLocationPath, form],
  );

  const handleReturnFixedAirportSelect = React.useCallback(
    (locationName: string) => {
      const selectedAirport = FIXED_AIRPORT_OPTIONS.find(
        (airport) => airport.locationName === locationName,
      );
      if (!selectedAirport) return;

      const options = {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      } as const;

      clearReturnLocationFields();
      form.setValue(
        'delivery.returnLocation.locationName',
        selectedAirport.locationName,
        options,
      );
      form.setValue(
        returnLocationPath('country'),
        selectedAirport.country,
        options,
      );
      form.setValue(
        returnLocationPath('postalCode'),
        selectedAirport.postalCode,
        options,
      );
      form.setValue(returnLocationPath('city'), selectedAirport.city, options);
    },
    [clearReturnLocationFields, form, returnLocationPath],
  );

  React.useEffect(() => {
    if (shouldShowLocationField) return;

    form.setValue('delivery.locationName', '', {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });

    (
      ['country', 'postalCode', 'city', 'street', 'doorNumber'] as const
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
  }, [deliveryLocationPath, form, shouldShowLocationField]);

  React.useEffect(() => {
    if (shouldShowReturnLocationForm) return;

    const options = {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    } as const;

    form.setValue('delivery.returnLocation.placeType', placeTypeValue, options);
    form.setValue(
      'delivery.returnLocation.locationName',
      typeof deliveryLocationName === 'string' ? deliveryLocationName : '',
      options,
    );
    form.setValue(
      returnLocationPath('country'),
      typeof deliveryCountry === 'string' ? deliveryCountry : '',
      options,
    );
    form.setValue(
      returnLocationPath('postalCode'),
      typeof deliveryPostalCode === 'string' ? deliveryPostalCode : '',
      options,
    );
    form.setValue(
      returnLocationPath('city'),
      typeof deliveryCity === 'string' ? deliveryCity : '',
      options,
    );
    form.setValue(
      returnLocationPath('street'),
      typeof deliveryStreet === 'string' ? deliveryStreet : '',
      options,
    );
    form.setValue(
      returnLocationPath('doorNumber'),
      typeof deliveryDoorNumber === 'string' ? deliveryDoorNumber : '',
      options,
    );
  }, [
    deliveryCity,
    deliveryCountry,
    deliveryDoorNumber,
    deliveryLocationName,
    deliveryPostalCode,
    deliveryStreet,
    form,
    placeTypeValue,
    returnLocationPath,
    shouldShowReturnLocationForm,
  ]);

  React.useEffect(() => {
    if (!shouldShowReturnLocationForm) return;
    if (shouldShowReturnLocationField) return;

    form.setValue('delivery.returnLocation.locationName', '', {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
    DELIVERY_ADDRESS_KEYS.forEach((key) => {
      form.setValue(returnLocationPath(key), '', {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    });
  }, [
    form,
    returnLocationPath,
    shouldShowReturnLocationField,
    shouldShowReturnLocationForm,
  ]);

  return (
    <SectionCard
      title={t('sections.delivery.title')}
      description={t('sections.delivery.description')}
      contentClassName='space-y-4'
    >
      <div className=' grid sm:grid-cols-1 md:grid-cols-2 gap-2 w-full items-center'>
        <FormField
          control={form.control}
          name={'delivery.island'}
          render={({ field }) => {
            const selectedValue =
              typeof field.value === 'string' ? field.value : undefined;
            return (
              <FormItem>
                <FormLabel>
                  {t('sections.delivery.fields.island.label')}
                </FormLabel>
                <FormControl>
                  <Select
                    value={selectedValue}
                    onValueChange={(value) => {
                      field.onChange(value);
                      clearDeliverySelectionFields();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          'sections.delivery.fields.island.placeholder',
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {DELIVERY_ISLAND_OPTIONS.map((island) => (
                          <SelectItem key={island} value={island}>
                            {t(
                              `sections.delivery.fields.island.options.${island}`,
                            )}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name={'delivery.placeType'}
          render={({ field }) => {
            const selectedValue =
              typeof field.value === 'string' ? field.value : undefined;
            return (
              <FormItem>
                <FormLabel>
                  {t('sections.delivery.fields.placeType.label')}
                </FormLabel>
                <FormControl>
                  <Select
                    value={selectedValue}
                    onValueChange={(value) => {
                      field.onChange(value);
                      clearDeliverySelectionFields();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          'sections.delivery.fields.placeType.placeholder',
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
                            'sections.delivery.fields.placeType.accommodation',
                          )}
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
      {shouldShowLocationField ? (
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
                    {shouldUseAirportSelect
                      ? t('sections.delivery.airportSelect.label')
                      : t('sections.delivery.locationName.label')}
                  </FormLabel>
                  <FormControl>
                    {shouldUseAccommodationList ? (
                      <AccommodationAutocompleteInput
                        placeholder={t(
                          'sections.delivery.locationName.placeholder',
                        )}
                        value={nameValue}
                        onChange={(value) => field.onChange(value)}
                        onBlur={field.onBlur}
                        onSelect={handleAccommodationSelect}
                        searchingLabel={t('searching')}
                        noResultLabel={t(
                          'sections.delivery.accommodationNoResult',
                        )}
                      />
                    ) : shouldUseAirportSelect ? (
                      <Select
                        value={
                          airportOptions.some(
                            (airport) => airport.locationName === field.value,
                          )
                            ? field.value
                            : undefined
                        }
                        onValueChange={handleFixedAirportSelect}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'sections.delivery.airportSelect.placeholder',
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {airportOptions.map((airport) => (
                            <SelectItem
                              key={airport.id}
                              value={airport.locationName}
                            >
                              {t(
                                `sections.delivery.airportSelect.options.${airport.id}`,
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder={t(
                          'sections.delivery.locationName.placeholder',
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

          {shouldShowAddressFields ? (
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
                            'sections.delivery.fields.country.placeholder',
                          )}
                          value={countryValue}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
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
                                placeId,
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
                                      'sections.delivery.fields.postalCode.placeholder',
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
                                        },
                                      );
                                      const { key, ...restProps } =
                                        itemProps as {
                                          key?: React.Key;
                                          [prop: string]: unknown;
                                        };
                                      const normalizedKey =
                                        key != null
                                          ? String(key)
                                          : (suggestion.placeId ??
                                            suggestion.description);
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
                              'sections.delivery.fields.postalCode.placeholder',
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
                            'sections.delivery.fields.city.placeholder',
                          )}
                          value={cityValue}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
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
                            'sections.delivery.fields.street.placeholder',
                          )}
                          value={streetValue}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
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
                            'sections.delivery.fields.doorNumber.placeholder',
                          )}
                          value={doorValue}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
          ) : null}
        </>
      ) : null}
      <FormField
        control={form.control}
        name={'delivery.same'}
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
                  {t('sections.delivery.fields.same.label')}
                </FormLabel>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className='grid gap-4 md:grid-cols-2'>
        <FormField
          control={form.control}
          name={'delivery.returnHour'}
          render={({ field }) => (
            <FormItem>
              <TimeFieldLabel label={returnHourLabel} tooltip={timeTooltip} />
              <FormControl>
                <Select
                  value={typeof field.value === 'string' ? field.value : ''}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='--' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {returnHourOptions.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={'delivery.returnMinute'}
          render={({ field }) => (
            <FormItem>
              <TimeFieldLabel
                label={returnMinuteLabel}
                tooltip={timeTooltip}
              />
              <FormControl>
                <Select
                  value={typeof field.value === 'string' ? field.value : ''}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='--' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {returnMinuteOptions.map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {shouldShowReturnLocationForm ? (
        <div className='space-y-4 rounded-2xl border border-border/60 bg-muted/20 px-4 py-4'>
          <div className='space-y-1'>
            <h3 className='text-base font-semibold'>
              {t('sections.delivery.returnLocation.title')}
            </h3>
            <p className='text-sm text-muted-foreground'>
              {t('sections.delivery.returnLocation.description')}
            </p>
          </div>
          <FormField
            control={form.control}
            name={'delivery.returnLocation.placeType'}
            render={({ field }) => {
              const selectedValue =
                typeof field.value === 'string' ? field.value : undefined;
              return (
                <FormItem className='max-w-sm'>
                  <FormLabel>
                    {t('sections.delivery.returnLocation.placeType.label')}
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={selectedValue}
                      onValueChange={(value) => {
                        field.onChange(value);
                        clearReturnLocationFields();
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            'sections.delivery.returnLocation.placeType.placeholder',
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value='airport'>
                            {t(
                              'sections.delivery.returnLocation.placeType.airport',
                            )}
                          </SelectItem>
                          <SelectItem value='accommodation'>
                            {t(
                              'sections.delivery.returnLocation.placeType.accommodation',
                            )}
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
          {shouldShowReturnLocationField ? (
            <FormField
              control={form.control}
              name={'delivery.returnLocation.locationName'}
              render={({ field }) => {
                const nameValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='max-w-lg'>
                    <FormLabel>
                      {t('sections.delivery.returnLocation.locationName.label')}
                    </FormLabel>
                    <FormControl>
                      {shouldUseReturnAirportSelect ? (
                        <Select
                          value={
                            FIXED_AIRPORT_OPTIONS.some(
                              (airport) => airport.locationName === field.value,
                            )
                              ? field.value
                              : undefined
                          }
                          onValueChange={handleReturnFixedAirportSelect}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                'sections.delivery.returnLocation.locationName.placeholder',
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {FIXED_AIRPORT_OPTIONS.map((airport) => (
                              <SelectItem
                                key={airport.id}
                                value={airport.locationName}
                              >
                                {t(
                                  `sections.delivery.airportSelect.options.${airport.id}`,
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder={t(
                            'sections.delivery.returnLocation.locationName.placeholder',
                          )}
                          value={nameValue}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          ) : null}
          {shouldShowReturnAddressFields ? (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {DELIVERY_ADDRESS_KEYS.map((key) => (
                <FormField
                  key={key}
                  control={form.control}
                  name={returnLocationPath(key)}
                  render={({ field }) => {
                    const value =
                      typeof field.value === 'string' ? field.value : '';
                    return (
                      <FormItem
                        className={
                          key === 'street'
                            ? 'md:col-span-2 lg:col-span-2'
                            : 'md:col-span-1'
                        }
                      >
                        <FormLabel>
                          {t(`sections.delivery.fields.${key}.label`)}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t(
                              `sections.delivery.fields.${key}.placeholder`,
                            )}
                            value={value}
                            onChange={(event) =>
                              field.onChange(event.target.value)
                            }
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </SectionCard>
  );
}
