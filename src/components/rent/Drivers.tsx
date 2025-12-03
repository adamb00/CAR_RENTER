import { RentFormValues } from '@/schemas/RentSchema';
import { format, parse } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
import React from 'react';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import SectionCard from '../SectionCard';
import { Button } from '../ui/button';

import { createEmptyDriver, createDriverHelpers } from '@/hooks/useDrivers';
import { useDriverPostalSelect } from '@/hooks/useDriverPostalSelect';
import { CALENDAR_LOCALE_MAP } from '@/lib/calendar_locale_map';
import { cn } from '@/lib/utils';
import { PopoverTrigger } from '@radix-ui/react-popover';
import { CalendarIcon } from 'lucide-react';
import PlacesAutocomplete from 'react-places-autocomplete';
import { Calendar } from '../ui/calendar';
import { Checkbox } from '../ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Popover, PopoverContent } from '../ui/popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export default function Drivers({
  form,
  locale,
  placesReady,
}: {
  form: UseFormReturn<RentFormValues>;
  locale: string;
  placesReady: boolean;
}) {
  const t = useTranslations('RentForm');

  const calendarLocale = CALENDAR_LOCALE_MAP[locale] ?? enUS;
  const maxExpiryDate = React.useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 20);
    date.setHours(23, 59, 59, 999);
    return date;
  }, []);
  const { driverLocationPath, driverDocumentPath, driverScalarPath } =
    React.useMemo(() => createDriverHelpers(form), [form]);

  const handlePostalSelect = useDriverPostalSelect(form);

  const {
    fields: driverFields,
    append: appendDriver,
    remove: removeDriver,
  } = useFieldArray({
    control: form.control,
    name: 'driver',
    rules: {
      maxLength: 2,
    },
  });

  const handleAddDriver = () => {
    appendDriver(createEmptyDriver());
  };

  return (
    <SectionCard
      title={t('sections.drivers.title')}
      description={t('sections.drivers.description')}
      action={
        <Button
          type='button'
          variant='outline'
          onClick={handleAddDriver}
          disabled={driverFields.length >= 2}
          className='hover:bg-foreground hover:text-background cursor-pointer'
        >
          {t('buttons.addDriver')}
        </Button>
      }
      contentClassName='space-y-8'
    >
      {driverFields.map((driverField, driverIndex) => (
        <div
          key={driverField.id ?? driverIndex}
          className='space-y-6 rounded-xl border border-border/60 bg-background/80 p-6 shadow-sm transition hover:border-border'
        >
          <section
            id='head'
            className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'
          >
            <div className='space-y-1 w-full'>
              <h3 className='text-lg font-semibold tracking-tight'>
                {driverIndex === 0
                  ? t('sections.drivers.primaryTitle')
                  : t('sections.drivers.secondaryTitle', {
                      index: driverIndex + 1,
                    })}
              </h3>
              {driverIndex === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  {t('sections.drivers.primaryInfo')}
                </p>
              ) : null}
            </div>
            {driverIndex > 0 && (
              <Button
                type='button'
                variant='outline'
                className='cursor-pointer'
                onClick={() => removeDriver(driverIndex)}
              >
                {t('buttons.removeDriver')}
              </Button>
            )}
          </section>

          <section id='name' className='grid gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name={driverScalarPath(driverIndex, 'lastName_1')}
              render={({ field }) => {
                const lastNameValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.drivers.fields.lastName1.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.drivers.fields.lastName1.placeholder'
                        )}
                        value={lastNameValue}
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
              name={driverScalarPath(driverIndex, 'lastName_2')}
              render={({ field }) => {
                const lastNameValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.drivers.fields.lastName2.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.drivers.fields.lastName2.placeholder'
                        )}
                        value={lastNameValue}
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
              name={driverScalarPath(driverIndex, 'firstName_1')}
              render={({ field }) => {
                const firstNameValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.drivers.fields.firstName1.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.drivers.fields.firstName1.placeholder'
                        )}
                        value={firstNameValue}
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
              name={driverScalarPath(driverIndex, 'firstName_2')}
              render={({ field }) => {
                const firstNameValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.drivers.fields.firstName2.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.drivers.fields.firstName2.placeholder'
                        )}
                        value={firstNameValue}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </section>

          <section id='location' className='grid gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name={driverLocationPath(driverIndex, 'postalCode')}
              render={({ field }) => {
                const postalValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.drivers.fields.postalCode.label')}
                    </FormLabel>
                    <FormControl>
                      {placesReady ? (
                        <PlacesAutocomplete
                          value={postalValue}
                          onChange={(value) => {
                            field.onChange(value);
                          }}
                          onSelect={async (address, placeId) => {
                            const resolved = await handlePostalSelect(
                              driverIndex,
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
                                    'sections.drivers.fields.postalCode.placeholder'
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

            <FormField
              control={form.control}
              name={driverLocationPath(driverIndex, 'city')}
              render={({ field }) => {
                const cityValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.drivers.fields.city.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.drivers.fields.city.placeholder'
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
              name={driverLocationPath(driverIndex, 'country')}
              render={({ field }) => {
                const countryValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.drivers.fields.country.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.drivers.fields.country.placeholder'
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
              name={driverLocationPath(driverIndex, 'street')}
              render={({ field }) => {
                const streetValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.drivers.fields.street.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.drivers.fields.street.placeholder'
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
              name={driverLocationPath(driverIndex, 'streetType')}
              render={({ field }) => {
                const streetTypeValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.drivers.fields.streetType.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.drivers.fields.streetType.placeholder'
                        )}
                        value={streetTypeValue}
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
              name={driverLocationPath(driverIndex, 'doorNumber')}
              render={({ field }) => {
                const doorValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:col-span-1'>
                    <FormLabel>
                      {t('sections.drivers.fields.doorNumber.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.drivers.fields.doorNumber.placeholder'
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
          </section>
          <section
            id='bornData'
            className='grid grid-cols-1 gap-4 md:grid-cols-3'
          >
            <FormField
              control={form.control}
              name={driverScalarPath(driverIndex, 'placeOfBirth')}
              render={({ field }) => {
                const placeValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='col-span-1'>
                    <FormLabel>
                      {t('sections.drivers.fields.placeOfBirth.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.drivers.fields.placeOfBirth.placeholder'
                        )}
                        value={placeValue}
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
              name={driverScalarPath(driverIndex, 'dateOfBirth')}
              render={({ field }) => {
                const dateValue =
                  typeof field.value === 'string' ? field.value : '';
                const selectedDate = dateValue
                  ? parse(dateValue, 'yyyy-MM-dd', new Date())
                  : undefined;

                return (
                  <FormItem className='col-span-1'>
                    <FormLabel>
                      {t('sections.drivers.fields.dateOfBirth.label')}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-auto pl-3 text-left font-normal',
                              !selectedDate && 'text-muted-foreground'
                            )}
                          >
                            {selectedDate ? (
                              format(selectedDate, 'PPP', {
                                locale: calendarLocale,
                              })
                            ) : (
                              <span>
                                {t(
                                  'sections.drivers.fields.dateOfBirth.placeholder'
                                )}
                              </span>
                            )}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={selectedDate}
                          locale={calendarLocale}
                          fromYear={1900}
                          toYear={maxExpiryDate.getFullYear()}
                          onSelect={(date) =>
                            field.onChange(
                              date ? format(date, 'yyyy-MM-dd') : ''
                            )
                          }
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          captionLayout='dropdown'
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </section>

          <section id='contact' className='flex flex-col gap-4 md:flex-row'>
            <FormField
              control={form.control}
              name={driverScalarPath(driverIndex, 'phoneNumber')}
              render={({ field }) => {
                const phoneValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:flex-1'>
                    <FormLabel>
                      {t('sections.drivers.fields.phoneNumber.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.drivers.fields.phoneNumber.placeholder'
                        )}
                        value={phoneValue}
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
              name={driverScalarPath(driverIndex, 'email')}
              render={({ field }) => {
                const emailValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='md:flex-1'>
                    <FormLabel>
                      {t('sections.drivers.fields.email.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.drivers.fields.email.placeholder'
                        )}
                        value={emailValue}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </section>
          <section
            id='document'
            className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 '
          >
            <FormField
              control={form.control}
              name={driverDocumentPath(driverIndex, 'type')}
              render={({ field }) => {
                const documentValue =
                  typeof field.value === 'string' ? field.value : undefined;
                return (
                  <FormItem className='w-full'>
                    <FormLabel>
                      {t('sections.drivers.documents.type.label')}
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={documentValue}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'sections.drivers.documents.type.placeholder'
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value='passport'>
                              {t('sections.drivers.documents.type.passport')}
                            </SelectItem>
                            <SelectItem value='id_card'>
                              {t('sections.drivers.documents.type.id_card')}
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
            <FormField
              control={form.control}
              name={driverDocumentPath(driverIndex, 'number')}
              render={({ field }) => {
                const numberValue =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className=''>
                    <FormLabel>
                      {t('sections.drivers.documents.number.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.drivers.documents.number.placeholder'
                        )}
                        value={numberValue}
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
              name={driverDocumentPath(driverIndex, 'validFrom')}
              render={({ field }) => {
                const fromValue =
                  typeof field.value === 'string' ? field.value : '';
                const selectedDate = fromValue
                  ? parse(fromValue, 'yyyy-MM-dd', new Date())
                  : undefined;
                return (
                  <FormItem className=''>
                    <FormLabel>
                      {t('sections.drivers.documents.validFrom.label')}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-auto pl-3 text-left font-normal',
                              !selectedDate && 'text-muted-foreground'
                            )}
                          >
                            {selectedDate ? (
                              format(selectedDate, 'PPP', {
                                locale: calendarLocale,
                              })
                            ) : (
                              <span>
                                {t(
                                  'sections.drivers.documents.validFrom.placeholder'
                                )}
                              </span>
                            )}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-full p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={selectedDate}
                          locale={calendarLocale}
                          onSelect={(date) =>
                            field.onChange(
                              date ? format(date, 'yyyy-MM-dd') : ''
                            )
                          }
                          disabled={(date) => date < new Date('1900-01-01')}
                          captionLayout='dropdown'
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name={driverDocumentPath(driverIndex, 'validUntil')}
              render={({ field }) => {
                const untilValue =
                  typeof field.value === 'string' ? field.value : '';
                const issuedRaw = form.getValues(
                  driverDocumentPath(driverIndex, 'validFrom')
                );
                const issuedDate =
                  typeof issuedRaw === 'string' && issuedRaw
                    ? parse(issuedRaw, 'yyyy-MM-dd', new Date())
                    : undefined;
                const selectedDate = untilValue
                  ? parse(untilValue, 'yyyy-MM-dd', new Date())
                  : undefined;
                return (
                  <FormItem className='flex flex-col md:flex-1'>
                    <FormLabel>
                      {t('sections.drivers.documents.validUntil.label')}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-auto pl-3 text-left font-normal',
                              !selectedDate && 'text-muted-foreground'
                            )}
                          >
                            {selectedDate ? (
                              format(selectedDate, 'PPP', {
                                locale: calendarLocale,
                              })
                            ) : (
                              <span>
                                {t(
                                  'sections.drivers.documents.validUntil.placeholder'
                                )}
                              </span>
                            )}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={selectedDate}
                          locale={calendarLocale}
                          fromYear={1900}
                          toYear={maxExpiryDate.getFullYear()}
                          onSelect={(date) =>
                            field.onChange(
                              date ? format(date, 'yyyy-MM-dd') : ''
                            )
                          }
                          disabled={(date) => {
                            const earliest = date < new Date('1900-01-01');
                            const beforeIssued =
                              issuedDate != null && date < issuedDate;
                            const beyondMax =
                              maxExpiryDate != null && date > maxExpiryDate;
                            return earliest || beforeIssued || beyondMax;
                          }}
                          captionLayout='dropdown'
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </section>

          <section
            id='drivingLicence'
            className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'
          >
            <FormField
              control={form.control}
              name={driverDocumentPath(driverIndex, 'drivingLicenceNumber')}
              render={({ field }) => {
                const licenceNumber =
                  typeof field.value === 'string' ? field.value : '';
                return (
                  <FormItem className='col-span-1'>
                    <FormLabel>
                      {t(
                        'sections.drivers.documents.drivingLicenceNumber.label'
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'sections.drivers.documents.drivingLicenceNumber.placeholder'
                        )}
                        value={licenceNumber}
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
              name={driverDocumentPath(driverIndex, 'drivingLicenceCategory')}
              render={({ field }) => {
                const categoryValue =
                  typeof field.value === 'string' ? field.value : undefined;
                return (
                  <FormItem className='col-span-1'>
                    <FormLabel>
                      {t(
                        'sections.drivers.documents.drivingLicenceCategory.label'
                      )}
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={categoryValue}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'sections.drivers.documents.drivingLicenceCategory.placeholder'
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {[
                              'AM',
                              'A1',
                              'A2',
                              'A',
                              'B',
                              'BE',
                              'C1',
                              'C1E',
                              'C',
                              'CE',
                              'D1',
                              'D1E',
                              'D',
                              'DE',
                              'T',
                            ].map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
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
              name={driverDocumentPath(driverIndex, 'drivingLicenceValidFrom')}
              render={({ field }) => {
                const licenceFrom =
                  typeof field.value === 'string' ? field.value : '';
                const selectedDate = licenceFrom
                  ? parse(licenceFrom, 'yyyy-MM-dd', new Date())
                  : undefined;
                return (
                  <FormItem className='col-span-1'>
                    <FormLabel>
                      {t(
                        'sections.drivers.documents.drivingLicenceValidFrom.label'
                      )}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !selectedDate && 'text-muted-foreground'
                            )}
                          >
                            {selectedDate ? (
                              format(selectedDate, 'PPP', {
                                locale: calendarLocale,
                              })
                            ) : (
                              <span>
                                {t(
                                  'sections.drivers.documents.drivingLicenceValidFrom.placeholder'
                                )}
                              </span>
                            )}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={selectedDate}
                          locale={calendarLocale}
                          onSelect={(date) =>
                            field.onChange(
                              date ? format(date, 'yyyy-MM-dd') : ''
                            )
                          }
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          captionLayout='dropdown'
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name={driverDocumentPath(driverIndex, 'drivingLicenceValidUntil')}
              render={({ field }) => {
                const licenceUntil =
                  typeof field.value === 'string' ? field.value : '';
                const licenceFromRaw = form.getValues(
                  driverDocumentPath(driverIndex, 'drivingLicenceValidFrom')
                );
                const licenceFromDate =
                  typeof licenceFromRaw === 'string' && licenceFromRaw
                    ? parse(licenceFromRaw, 'yyyy-MM-dd', new Date())
                    : undefined;
                const selectedDate = licenceUntil
                  ? parse(licenceUntil, 'yyyy-MM-dd', new Date())
                  : undefined;
                return (
                  <FormItem className='col-span-1'>
                    <FormLabel>
                      {t(
                        'sections.drivers.documents.drivingLicenceValidUntil.label'
                      )}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !selectedDate && 'text-muted-foreground'
                            )}
                          >
                            {selectedDate ? (
                              format(selectedDate, 'PPP', {
                                locale: calendarLocale,
                              })
                            ) : (
                              <span>
                                {t(
                                  'sections.drivers.documents.drivingLicenceValidUntil.placeholder'
                                )}
                              </span>
                            )}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={selectedDate}
                          locale={calendarLocale}
                          fromYear={1900}
                          toYear={maxExpiryDate.getFullYear()}
                          onSelect={(date) =>
                            field.onChange(
                              date ? format(date, 'yyyy-MM-dd') : ''
                            )
                          }
                          disabled={(date) => {
                            const earliest = date < new Date('1900-01-01');
                            const beforeIssued =
                              licenceFromDate != null && date < licenceFromDate;
                            const beyondMax =
                              maxExpiryDate != null && date > maxExpiryDate;
                            return earliest || beforeIssued || beyondMax;
                          }}
                          captionLayout='dropdown'
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </section>
          <FormField
            control={form.control}
            name={driverDocumentPath(
              driverIndex,
              'drivingLicenceIsOlderThan_3'
            )}
            render={({ field }) => (
              <FormItem className='flex items-center gap-3 rounded-md border border-border/40 bg-muted/30 p-3'>
                <FormControl>
                  <Checkbox
                    checked={Boolean(field.value)}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                </FormControl>
                <div>
                  <FormLabel className='text-sm font-medium'>
                    {t('sections.drivers.documents.drivingLicenceIsOlderThan3')}
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>
      ))}
    </SectionCard>
  );
}
