import { useTranslations } from 'next-intl';
import { UseFormReturn } from 'react-hook-form';
import { QuoteRequestValues } from './QuoteRequestForm';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { MultiSelect } from '../MultiSelect';
import { useMemo } from 'react';
import { EXTRA_VALUES } from '@/lib/constants';
import type { QuoteCarOption } from './quote.types';
import { Luggage, User } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

function CarCapacityIcons({ car }: { car: QuoteCarOption }) {
  return (
    <span
      aria-hidden='true'
      className='flex shrink-0 items-center gap-2 text-muted-foreground'
    >
      <span className='flex items-center gap-0.5'>
        {Array.from({ length: car.seats }).map((_, index) => (
          <User key={`${car.id}-seat-${index}`} className='h-5 w-5' />
        ))}
      </span>
      <span className='flex items-center gap-0.5'>
        {Array.from({ length: car.largeLuggage }).map((_, index) => (
          <Luggage key={`${car.id}-large-${index}`} className='h-5! w-5!' />
        ))}
      </span>
      <span className='h-4 w-px bg-slate-400' />
      <span className='flex items-center gap-0.5'>
        {Array.from({ length: car.smallLuggage }).map((_, index) => (
          <Luggage key={`${car.id}-small-${index}`} className='h-4! w-4!' />
        ))}
      </span>
    </span>
  );
}

export default function QuoteExtras({
  form,
  availableCars,
}: {
  form: UseFormReturn<QuoteRequestValues>;
  availableCars: QuoteCarOption[];
}) {
  const t = useTranslations('Contact');
  const tRent = useTranslations('RentForm');
  const selectedCarId = form.watch('carId');

  const extrasOptions = useMemo(
    () =>
      EXTRA_VALUES.map((value) => ({
        value,
        label: tRent(`extras.options.${value}`),
      })),
    [tRent],
  );
  const carOptions = useMemo(
    () =>
      availableCars.map((car) => ({
        ...car,
        description: t('form.fields.carType.option', {
          carName: car.name,
          seats: car.seats,
          smallLuggage: car.smallLuggage,
          largeLuggage: car.largeLuggage,
        }),
      })),
    [availableCars, t],
  );
  const selectedCar =
    carOptions.find((car) => car.id === selectedCarId) ?? null;

  return (
    <div className='grid grid-cols-2 gap-4 items-start'>
      <FormField
        control={form.control}
        name='extras'
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tRent('extras.label')}</FormLabel>
            <FormControl>
              <MultiSelect
                options={extrasOptions}
                defaultValue={field.value ?? []}
                onValueChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
            <div className='mt-2 text-xs text-muted-foreground space-y-1'>
              <p>{tRent('extras.packages.base')}</p>
              <p>{tRent('extras.packages.energy')}</p>
              <p>{tRent('extras.packages.lateArrival')}</p>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='carType'
        render={() => (
          <FormItem className='items-start'>
            <FormLabel>{t('form.fields.carType.label')}</FormLabel>
            <FormControl>
              <Select
                value={selectedCarId || undefined}
                onValueChange={(value) => {
                  const selectedCar = availableCars.find(
                    (car) => car.id === value,
                  );
                  form.setValue('carId', value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  form.setValue('carType', selectedCar?.name ?? '', {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              >
                <SelectTrigger className='h-auto min-h-9'>
                  {selectedCar ? (
                    <span className='flex flex-col w-full items-start justify-between gap-3 pr-2'>
                      <span className='min-w-0 truncate text-left'>
                        {selectedCar.name}
                      </span>
                    </span>
                  ) : (
                    <SelectValue
                      placeholder={t('form.fields.carType.placeholder')}
                    />
                  )}
                </SelectTrigger>
                <SelectContent className='w-full'>
                  {carOptions.map((car) => (
                    <SelectItem key={car.id} value={car.id} className='w-full'>
                      <span className='flex flex-col w-full items-start justify-between gap-3 hover:bg-sky-light rounded-2xl p-2 cursor-pointer'>
                        <span className='min-w-0 truncate'>{car.name}</span>
                        <CarCapacityIcons car={car} />
                      </span>
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
