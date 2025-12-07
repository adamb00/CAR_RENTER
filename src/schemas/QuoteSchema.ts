import { z } from 'zod';

import { CHANNELS } from '@/lib/constants';

type TranslationFn = (key: string, values?: Record<string, any>) => string;

type BuildQuoteRequestSchemaParams = {
  t: TranslationFn;
  tSchema: TranslationFn;
  deliveryFieldRequiredMessage: string;
};

export const buildQuoteRequestSchema = ({
  t,
  tSchema,
  deliveryFieldRequiredMessage,
}: BuildQuoteRequestSchemaParams) =>
  z
    .object({
      name: z.string().min(1, t('form.errors.nameRequired')),
      phone: z.string().min(1, t('form.errors.phoneRequired')),
      email: z
        .string()
        .min(1, t('form.errors.emailRequired'))
        .email(t('form.errors.emailInvalid')),
      preferredChannel: z.enum(CHANNELS),
      rentalStart: z.string().min(1, t('form.errors.rentalStartRequired')),
      rentalEnd: z.string().min(1, t('form.errors.rentalEndRequired')),
      arrivalFlight: z.string().optional(),
      departureFlight: z.string().optional(),
      partySize: z.string().optional(),
      children: z.string().optional(),
      carId: z.string().optional(),
      extras: z.array(z.string()).default([]),
      delivery: z
        .object({
          placeType: z.enum(['accommodation', 'airport']).optional(),
          locationName: z.string().optional(),
          address: z
            .object({
              country: z.string().optional(),
              postalCode: z.string().optional(),
              city: z.string().optional(),
              street: z.string().optional(),
              doorNumber: z.string().optional(),
            })
            .optional(),
        })
        .optional(),
      consents: z.object({
        privacy: z
          .boolean()
          .refine((val) => val, { message: t('form.errors.privacyRequired') }),
        terms: z
          .boolean()
          .refine((val) => val, { message: t('form.errors.termsRequired') }),
      }),
    })
    .superRefine((val, ctx) => {
      const hasDelivery =
        Array.isArray(val.extras) && val.extras.includes('kiszallitas');
      if (!hasDelivery) return;

      if (!val.delivery?.placeType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: tSchema('errors.deliveryPlaceTypeRequired'),
          path: ['delivery', 'placeType'],
        });
      }

      const address = val.delivery?.address ?? {};
      (['country', 'postalCode', 'city'] as const).forEach((key) => {
        const raw = address[key];
        if (!raw || (typeof raw === 'string' && raw.trim().length === 0)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: deliveryFieldRequiredMessage,
            path: ['delivery', 'address', key],
          });
        }
      });
    });

export type QuoteRequestSchema = ReturnType<typeof buildQuoteRequestSchema>;
export type QuoteRequestValues = z.infer<QuoteRequestSchema>;
