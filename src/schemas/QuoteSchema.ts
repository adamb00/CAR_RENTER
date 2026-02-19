import { z } from 'zod';

import { CHANNELS } from '@/lib/constants';

type TranslationFn = (key: string, values?: Record<string, any>) => string;

type BuildQuoteRequestSchemaParams = {
  t: TranslationFn;
  tSchema: TranslationFn;
  deliveryFieldRequiredMessage: string;
};

const parseComparableDate = (value: string): Date | null => {
  const segments = value.split('-');
  if (segments.length === 3) {
    const [yearRaw, monthRaw, dayRaw] = segments;
    const year = Number.parseInt(yearRaw, 10);
    const month = Number.parseInt(monthRaw, 10);
    const day = Number.parseInt(dayRaw, 10);
    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day)
    ) {
      const localDate = new Date(year, month - 1, day);
      localDate.setHours(0, 0, 0, 0);
      if (!Number.isNaN(localDate.getTime())) {
        return localDate;
      }
    }
  }

  const fallback = new Date(value);
  if (Number.isNaN(fallback.getTime())) return null;
  fallback.setHours(0, 0, 0, 0);
  return fallback;
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
      rentalDays: z
        .coerce
        .number({ message: t('form.errors.rentalDaysRequired') })
        .min(1, t('form.errors.rentalDaysRequired')),
      arrivalFlight: z.string().optional(),
      departureFlight: z.string().optional(),
      partySize: z.string().optional(),
      children: z.string().optional(),
      carId: z.string().optional(),
      extras: z.array(z.string()).default([]),
      delivery: z
        .object({
          placeType: z
            .enum(['accommodation', 'airport', 'office'])
            .optional(),
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
      const startDate = parseComparableDate(val.rentalStart);
      const endDate = parseComparableDate(val.rentalEnd);
      const startDateValid = Boolean(startDate);
      const endDateValid = Boolean(endDate);

      if (!startDateValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('form.errors.rentalStartRequired'),
          path: ['rentalStart'],
        });
      }

      if (!endDateValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('form.errors.rentalEndRequired'),
          path: ['rentalEnd'],
        });
      }

      if (startDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate <= today) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: tSchema('fields.rentalPeriod.startDate.past'),
            path: ['rentalStart'],
          });
        }
      }

      if (startDate && endDate && endDate < startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: tSchema('fields.rentalPeriod.endDate.beforeStart'),
          path: ['rentalEnd'],
        });
      }

      const placeType = val.delivery?.placeType;

      if (!placeType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: tSchema('errors.deliveryPlaceTypeRequired'),
          path: ['delivery', 'placeType'],
        });
      }

      const requiresAddress =
        placeType === 'accommodation' || placeType === 'airport';

      if (requiresAddress) {
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
      }
    });

export type QuoteRequestSchema = ReturnType<typeof buildQuoteRequestSchema>;
export type QuoteRequestValues = z.infer<QuoteRequestSchema>;
