import { Car } from '@/lib/cars-shared';
import type { ContactQuoteRecord } from '@/lib/contactQuotes-shared';
import { RentSchema } from '@/schemas/RentSchema';
import type { FieldValues } from 'react-hook-form';
import z from 'zod';

export type RentFormValues = z.input<typeof RentSchema> & FieldValues;
export type RentFormResolvedValues = z.output<typeof RentSchema>;

export type RentPageClientProps = {
  locale: string;
  car: Pick<Car, 'id' | 'seats' | 'colors'>;
  quotePrefill?: ContactQuoteRecord | null;
  islandPrefill?: 'Lanzarote' | 'Fuerteventura';
  rentalPeriodPrefill?: {
    startDate?: string;
    endDate?: string;
  };
  manageContext?: {
    rentId: string;
    section?: 'contact' | 'travel' | 'invoice';
    mode?: 'modify';
  };
  rentPrefill?: RentFormValues | null;
  rentalFee?: string | undefined;
  insurance?: string | undefined;
  days?: string | string[] | undefined;
};
