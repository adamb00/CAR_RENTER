'use server';

import { RentFormValues, RentSchema } from '@/schemas/RentSchema';
import z from 'zod';

export const RentAction = async (values: z.infer<RentFormValues>) => {
  const validatedFields = await RentSchema.safeParseAsync(values);

  if (!validatedFields.success) {
    return { error: 'Hibás adatok. Kérjük próbáld meg újból!' };
  }

  console.log(validatedFields.data);

  return { success: true };
};
