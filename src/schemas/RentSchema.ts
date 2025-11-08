import validator from 'validator';
import { z } from 'zod';

const DEFAULT_RENT_SCHEMA_MESSAGES = {
  errors: {
    invalidStartDate: 'Érvénytelen kezdődátum',
    invalidEndDate: 'Érvénytelen záródátum',
    adultsMin: 'Legalább egy felnőtt szükséges',
    adultsInvalid: 'Kérjük add meg a felnőtt utasok számát',
    childAgeMin: 'Az életkor nem lehet negatív',
    childAgeMax: 'A gyermek életkora legfeljebb 17 év lehet',
    childHeightMin: 'A magasság nem lehet negatív',
    firstNameRequired: 'A keresztnév megadása kötelező',
    lastNameRequired: 'A vezetéknév megadása kötelező',
    countryRequired: 'Az ország megadása kötelező',
    postalCodeRequired: 'Az irányítószám megadása kötelező',
    cityRequired: 'A település megadása kötelező',
    streetRequired: 'Az utca megadása kötelező',
    doorNumberRequired: 'A házszám megadása kötelező',
    invalidDateOfBirth: 'Érvénytelen születési dátum',
    placeOfBirthRequired: 'A születési hely megadása kötelező',
    phoneRequired: 'A telefonszám megadása kötelező',
    phoneInvalid: 'Adj meg érvényes telefonszámot',
    emailRequired: 'Az email cím megadása kötelező',
    emailInvalid: 'Érvényes email címet adj meg',
    documentNumberRequired: 'Az okmány számának megadása kötelező',
    documentIssueInvalid: 'Érvénytelen okmány kiállítási dátum',
    documentExpiryInvalid: 'Érvénytelen okmány lejárati dátum',
    drivingLicenceNumberRequired: 'A jogosítvány számát kötelező megadni',
    drivingLicenceIssueInvalid: 'Érvénytelen jogosítvány kiállítási dátum',
    drivingLicenceExpiryInvalid: 'Érvénytelen jogosítvány lejárati dátum',
    contactNameRequired: 'A kapcsolattartó neve kötelező',
    contactEmailRequired: 'A kapcsolattartó email címe kötelező',
    contactEmailInvalid: 'Érvényes kapcsolattartó email címet adj meg',
    invoiceNameRequired: 'A számlázási név megadása kötelező',
    invoicePhoneRequired: 'A számlázási telefonszám megadása kötelező',
    invoiceEmailRequired: 'A számlázási email cím megadása kötelező',
    invoiceEmailInvalid: 'Érvényes számlázási email címet adj meg',
    startPast: 'A kezdődátum nem lehet múltbeli',
    startTooLate: 'A kezdődátum legfeljebb egy éven belül lehet',
    endBeforeStart: 'A záródátum nem lehet a kezdődátum előtt',
    endTooLate: 'A záródátum legfeljebb egy éven belül lehet',
    deliveryPlaceTypeRequired:
      'Válaszd ki, hogy szállás vagy repülőtér címét adod meg',
    deliveryFieldRequired: 'Kötelező mező',
  },
  fields: {
    rentalPeriod: {
      startDate: {
        invalid: 'Érvénytelen kezdődátum',
        past: 'A kezdődátum nem lehet múltbeli',
        tooLate: 'A kezdődátum legfeljebb egy éven belül lehet',
      },
      endDate: {
        invalid: 'Érvénytelen záródátum',
        beforeStart: 'A záródátum nem lehet a kezdődátum előtt',
        tooLate: 'A záródátum legfeljebb egy éven belül lehet',
      },
    },
    adults: {
      min: 'Legalább egy felnőtt szükséges',
    },
    children: {
      age: {
        min: 'Az életkor nem lehet negatív',
        max: 'A gyermek életkora legfeljebb 17 év lehet',
      },
      height: {
        min: 'A magasság nem lehet negatív',
      },
    },
    driver: {
      firstName_1: {
        required: 'A keresztnév megadása kötelező',
      },
      lastName_1: {
        required: 'A vezetéknév megadása kötelező',
      },
      location: {
        country: {
          required: 'Az ország megadása kötelező',
        },
        postalCode: {
          required: 'Az irányítószám megadása kötelező',
        },
        city: {
          required: 'A település megadása kötelező',
        },
        street: {
          required: 'Az utca megadása kötelező',
        },
        doorNumber: {
          required: 'A házszám megadása kötelező',
        },
      },
      dateOfBirth: {
        invalid: 'Érvénytelen születési dátum',
      },
      placeOfBirth: {
        required: 'A születési hely megadása kötelező',
      },

      phoneNumber: {
        required: 'A telefonszám megadása kötelező',
        invalid: 'Adj meg érvényes telefonszámot',
      },
      email: {
        required: 'Az email cím megadása kötelező',
        invalid: 'Érvényes email címet adj meg',
      },
      document: {
        number: {
          required: 'Az okmány számának megadása kötelező',
        },
        validFrom: {
          invalid: 'Érvénytelen okmány kiállítási dátum',
        },
        validUntil: {
          invalid: 'Érvénytelen okmány lejárati dátum',
        },
        drivingLicenceNumber: {
          required: 'A jogosítvány számát kötelező megadni',
        },
        drivingLicenceValidFrom: {
          invalid: 'Érvénytelen jogosítvány kiállítási dátum',
          minAge: 'A jogosítványnak legalább 3 évesnek kell lennie',
        },
        drivingLicenceValidUntil: {
          invalid: 'Érvénytelen jogosítvány lejárati dátum',
        },
      },
    },
    contact: {
      name: {
        required: 'A kapcsolattartó neve kötelező',
      },
      email: {
        required: 'A kapcsolattartó email címe kötelező',
        invalid: 'Érvényes kapcsolattartó email címet adj meg',
      },
    },
    invoice: {
      name: {
        required: 'A számlázási név megadása kötelező',
      },
      phoneNumber: {
        required: 'A számlázási telefonszám megadása kötelező',
        invalid: 'Adj meg érvényes telefonszámot',
      },
      email: {
        required: 'A számlázási email cím megadása kötelező',
        invalid: 'Érvényes számlázási email címet adj meg',
      },
      location: {
        country: {
          required: 'Az ország megadása kötelező',
        },
        postalCode: {
          required: 'Az irányítószám megadása kötelező',
        },
        city: {
          required: 'A település megadása kötelező',
        },
        street: {
          required: 'Az utca megadása kötelező',
        },
        doorNumber: {
          required: 'A házszám megadása kötelező',
        },
      },
    },
    delivery: {
      placeType: {
        required: 'Válaszd ki, hogy szállás vagy repülőtér címét adod meg',
      },
      address: {
        country: {
          required: 'Kötelező mező',
        },
        postalCode: {
          required: 'Kötelező mező',
        },
        city: {
          required: 'Kötelező mező',
        },
        street: {
          required: 'Kötelező mező',
        },
        doorNumber: {
          required: 'Kötelező mező',
        },
      },
    },
  },
} as const;

type RentSchemaMessages = typeof DEFAULT_RENT_SCHEMA_MESSAGES;

type DotNestedKeys<T> = T extends string
  ? never
  : {
      [K in Extract<keyof T, string>]: T[K] extends string
        ? `${K}`
        : `${K}.${DotNestedKeys<T[K]>}`;
    }[Extract<keyof T, string>];

type RentSchemaMessagePath = DotNestedKeys<RentSchemaMessages>;

export type RentSchemaTranslate = (path: RentSchemaMessagePath) => string;

function lookupMessage(
  messages: RentSchemaMessages,
  path: RentSchemaMessagePath
): string {
  const segments = path.split('.');
  let current: unknown = messages;

  for (const segment of segments) {
    if (
      typeof current !== 'object' ||
      current === null ||
      !(segment in current)
    ) {
      return path;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === 'string' ? current : path;
}

const defaultTranslate: RentSchemaTranslate = (path) =>
  lookupMessage(DEFAULT_RENT_SCHEMA_MESSAGES, path);

type DeliveryAddressKey =
  | 'country'
  | 'postalCode'
  | 'city'
  | 'street'
  | 'doorNumber';

export function createRentSchema(
  translate: RentSchemaTranslate = defaultTranslate
) {
  const message = (path: RentSchemaMessagePath) => translate(path);

  const deliveryAddressMessages: Record<
    DeliveryAddressKey,
    RentSchemaMessagePath
  > = {
    country: 'fields.delivery.address.country.required',
    postalCode: 'fields.delivery.address.postalCode.required',
    city: 'fields.delivery.address.city.required',
    street: 'fields.delivery.address.street.required',
    doorNumber: 'fields.delivery.address.doorNumber.required',
  };

  return z
    .object({
      extras: z.array(z.string()).optional(),
      rentalPeriod: z.object({
        startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
          message: message('fields.rentalPeriod.startDate.invalid'),
        }),
        endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
          message: message('fields.rentalPeriod.endDate.invalid'),
        }),
      }),
      adults: z.coerce
        .number({ message: message('errors.adultsInvalid') })
        .refine((value) => Number.isFinite(value), {
          message: message('errors.adultsInvalid'),
        })
        .min(1, message('fields.adults.min')),
      children: z
        .array(
          z.object({
            age: z
              .union([
                z
                  .number()
                  .min(0, message('fields.children.age.min'))
                  .max(17, message('fields.children.age.max')),
                z.literal(''), // üres input engedélyezve
              ])
              .optional()
              .transform((val) =>
                val === '' || val === undefined ? undefined : Number(val)
              ),
            height: z
              .number()
              .min(0, message('fields.children.height.min'))
              .optional(),
          })
        )
        .default([]),
      driver: z.array(
        z.object({
          firstName_1: z
            .string()
            .min(1, message('fields.driver.firstName_1.required')),
          firstName_2: z.string().optional(),
          lastName_1: z
            .string()
            .min(1, message('fields.driver.lastName_1.required')),
          lastName_2: z.string().optional(),
          location: z.object({
            country: z
              .string()
              .min(1, message('fields.driver.location.country.required')),
            postalCode: z
              .string()
              .min(1, message('fields.driver.location.postalCode.required')),
            city: z
              .string()
              .min(1, message('fields.driver.location.city.required')),
            street: z
              .string()
              .min(1, message('fields.driver.location.street.required')),
            doorNumber: z
              .string()
              .min(1, message('fields.driver.location.doorNumber.required')),
          }),
          dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), {
            message: message('fields.driver.dateOfBirth.invalid'),
          }),
          placeOfBirth: z
            .string()
            .min(1, message('fields.driver.placeOfBirth.required')),
          nameOfMother: z.string().optional(),
          phoneNumber: z
            .string()
            .trim()
            .min(1, message('fields.driver.phoneNumber.required'))
            // minden whitespace, kötőjel, zárójel eltávolítása
            .transform((value) => value.replace(/[\s\-().]/g, ''))
            .refine((value) => validator.isMobilePhone(value, 'any'), {
              message: message('fields.driver.phoneNumber.invalid'),
            }),
          email: z
            .string()
            .min(1, message('fields.driver.email.required'))
            .email(message('fields.driver.email.invalid'))
            .refine((value) => validator.isEmail(value), {
              message: message('fields.driver.email.invalid'),
            }),
          document: z.object({
            type: z.enum(['passport', 'id_card']),
            number: z
              .string()
              .min(1, message('fields.driver.document.number.required')),
            validFrom: z.string().refine((date) => !isNaN(Date.parse(date)), {
              message: message('fields.driver.document.validFrom.invalid'),
            }),
            validUntil: z.string().refine((date) => !isNaN(Date.parse(date)), {
              message: message('fields.driver.document.validUntil.invalid'),
            }),
            drivingLicenceNumber: z
              .string()
              .min(
                1,
                message('fields.driver.document.drivingLicenceNumber.required')
              ),
            drivingLicenceValidFrom: z
              .string()
              .refine((date) => !isNaN(Date.parse(date)), {
                message: message(
                  'fields.driver.document.drivingLicenceValidFrom.invalid'
                ),
              })
              .refine(
                (date) => {
                  if (!date) return false;
                  const parsed = new Date(date);
                  if (Number.isNaN(parsed.getTime())) return false;
                  const cutoff = new Date();
                  cutoff.setFullYear(cutoff.getFullYear() - 3);
                  cutoff.setHours(0, 0, 0, 0);
                  return parsed <= cutoff;
                },
                {
                  message: message(
                    'fields.driver.document.drivingLicenceValidFrom.minAge'
                  ),
                }
              ),
            drivingLicenceValidUntil: z
              .string()
              .refine((date) => !isNaN(Date.parse(date)), {
                message: message(
                  'fields.driver.document.drivingLicenceValidUntil.invalid'
                ),
              }),
            drivingLicenceIsOlderThan_3: z.boolean(),
            drivingLicenceCategory: z.enum([
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
            ]),
          }),
        })
      ),
      contact: z.object({
        same: z.boolean(),
        name: z.string().min(1, message('fields.contact.name.required')),
        email: z
          .string()
          .min(1, message('fields.contact.email.required'))
          .email(message('fields.contact.email.invalid'))
          .refine((value) => validator.isEmail(value), {
            message: message('fields.contact.email.invalid'),
          }),
      }),
      invoice: z.object({
        same: z.boolean(),
        name: z.string().min(1, message('fields.invoice.name.required')),
        phoneNumber: z
          .string()
          .trim()
          .min(1, message('fields.invoice.phoneNumber.required'))
          .transform((value) => value.replace(/[\s\-().]/g, ''))
          .refine((value) => validator.isMobilePhone(value, 'any'), {
            message: message('fields.invoice.phoneNumber.invalid'),
          }),
        email: z
          .string()
          .min(1, message('fields.invoice.email.required'))
          .email(message('fields.invoice.email.invalid'))
          .refine((value) => validator.isEmail(value), {
            message: message('fields.invoice.email.invalid'),
          }),
        location: z.object({
          country: z
            .string()
            .min(1, message('fields.invoice.location.country.required')),
          postalCode: z
            .string()
            .min(1, message('fields.invoice.location.postalCode.required')),
          city: z
            .string()
            .min(1, message('fields.invoice.location.city.required')),
          street: z
            .string()
            .min(1, message('fields.invoice.location.street.required')),
          doorNumber: z
            .string()
            .min(1, message('fields.invoice.location.doorNumber.required')),
        }),
      }),
      delivery: z
        .object({
          placeType: z.enum(['accommodation', 'airport']).optional(),
          locationName: z.string().max(200).optional(),
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
      tax: z.object({
        id: z.string().optional(),
        companyName: z.string().optional(),
      }),
    })
    .superRefine(({ rentalPeriod, extras, delivery, children }, ctx) => {
      const start = new Date(rentalPeriod.startDate);
      const end = new Date(rentalPeriod.endDate);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const maxDate = new Date(today);
      maxDate.setFullYear(maxDate.getFullYear() + 1);

      if (start < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: message('fields.rentalPeriod.startDate.past'),
          path: ['rentalPeriod', 'startDate'],
        });
      }

      if (start > maxDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: message('fields.rentalPeriod.startDate.tooLate'),
          path: ['rentalPeriod', 'startDate'],
        });
      }

      if (end < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: message('fields.rentalPeriod.endDate.beforeStart'),
          path: ['rentalPeriod', 'endDate'],
        });
      }

      if (end > maxDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: message('fields.rentalPeriod.endDate.tooLate'),
          path: ['rentalPeriod', 'endDate'],
        });
      }

      const extrasList = Array.isArray(extras) ? extras : [];
      const deliveryRequired = extrasList.includes('kiszallitas');

      if (!deliveryRequired) {
        return;
      }

      const deliveryData = delivery ?? {};
      const placeType = deliveryData.placeType;
      const address = deliveryData.address ?? {};

      if (!placeType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: message('fields.delivery.placeType.required'),
          path: ['delivery', 'placeType'],
        });
      }

      // Csak a kötelező címmezők (street és doorNumber opcionális marad)
      const requiredAddressKeys: DeliveryAddressKey[] = [
        'country',
        'postalCode',
        'city',
      ];
      requiredAddressKeys.forEach((key) => {
        const value = address[key];
        if (typeof value !== 'string' || value.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: message(deliveryAddressMessages[key]),
            path: ['delivery', 'address', key],
          });
        }
      });

      const childList = Array.isArray(children) ? children : [];
      if (childList.length > 0) {
        childList.forEach((child, idx) => {
          if (child?.age === undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: message('errors.deliveryFieldRequired'),
              path: ['children', idx, 'age'],
            });
          }
          if (child?.height === undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: message('errors.deliveryFieldRequired'),
              path: ['children', idx, 'height'],
            });
          }
        });
      }
    });
}

export const RentSchema = createRentSchema();

export type RentFormValues = z.input<typeof RentSchema>;
