import { Car } from '@/lib/cars-shared';
import { ContactQuoteRecord } from '@/lib/contactQuotes';
import { RentSchema } from '@/schemas/RentSchema';
import { FieldValues } from 'react-hook-form';
import z from 'zod';

export type RentFormValues = z.input<typeof RentSchema> & FieldValues;
export type RentFormResolvedValues = z.output<typeof RentSchema>;

export type RentPageClientProps = {
  locale: string;
  car: Pick<Car, 'id' | 'seats' | 'colors'>;
  quotePrefill?: ContactQuoteRecord | null;
  manageContext?: {
    rentId: string;
    section?: 'contact' | 'travel' | 'invoice';
    mode?: 'modify';
  };
  rentPrefill?: RentFormValues | null;
};
