'use server';

import { buildRentPdf } from '@/lib/build-rent-pdf';
import { sendMail } from '@/lib/mailer';
import { RentFormValues, RentSchema } from '@/schemas/RentSchema';
import z from 'zod';
import { renderBrandEmail } from '@/lib/emailTemplates';
import { getSiteUrl, resolveLocale } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import { DEFAULT_LOCALE } from '@/i18n/config';

export const RentAction = async (values: z.infer<RentFormValues>) => {
  const validatedFields = await RentSchema.safeParseAsync(values);

  if (!validatedFields.success) {
    return { error: 'Hibás adatok. Kérjük próbáld meg újból!' };
  }

  const locale = resolveLocale(validatedFields.data.locale ?? DEFAULT_LOCALE);
  const tEmail = await getTranslations({ locale, namespace: 'Emails' });
  const pdfBuffer = await buildRentPdf(validatedFields.data);
  const pdfFileName = `berles-${validatedFields.data.rentalPeriod.startDate}-${validatedFields.data.contact.name}.pdf`;
  const siteUrl = getSiteUrl();

  await sendMail({
    to: process.env.MAIL_USER || 'info@zodiacsrentacar.com',
    subject: `Új foglalás | ${validatedFields.data.contact.name} részére`,
    text: 'A csatolt PDF tartalmazza a foglalás részleteit.',
    replyTo: validatedFields.data.contact.email,
    attachments: [
      {
        filename: pdfFileName.replace(/\s+/g, '_'),
        content: pdfBuffer,
      },
    ],
  });
  await sendMail({
    to:
      validatedFields.data.contact.email ||
      validatedFields.data.driver[0].email,
    subject: tEmail('rent.subject'),
    text: [
      tEmail('rent.intro'),
      '',
      `${tEmail('rent.rows.period')}: ${
        validatedFields.data.rentalPeriod.startDate
      } → ${validatedFields.data.rentalPeriod.endDate}`,
      `${tEmail('rent.rows.contactName')}: ${
        validatedFields.data.contact.name
      }`,
      `${tEmail('rent.rows.contactEmail')}: ${
        validatedFields.data.contact.email
      }`,
      `${tEmail('rent.rows.phone')}: ${
        validatedFields.data.driver[0].phoneNumber
      }`,
      validatedFields.data.delivery?.arrivalFlight
        ? `${tEmail('rent.rows.arrivalFlight')}: ${
            validatedFields.data.delivery.arrivalFlight
          }`
        : '',
      validatedFields.data.delivery?.departureFlight
        ? `${tEmail('rent.rows.departureFlight')}: ${
            validatedFields.data.delivery.departureFlight
          }`
        : '',
      '',
      `${tEmail('rent.ctaLabel')}: ${siteUrl}`,
    ]
      .filter(Boolean)
      .join('\n'),
    html: renderBrandEmail({
      title: tEmail('rent.title'),
      intro: tEmail('rent.intro'),
      rows: [
        {
          label: tEmail('rent.rows.period'),
          value: `${validatedFields.data.rentalPeriod.startDate} → ${validatedFields.data.rentalPeriod.endDate}`,
        },
        { label: tEmail('rent.rows.contactName'), value: validatedFields.data.contact.name },
        { label: tEmail('rent.rows.contactEmail'), value: validatedFields.data.contact.email },
        {
          label: tEmail('rent.rows.phone'),
          value: validatedFields.data.driver[0].phoneNumber,
        },
        validatedFields.data.delivery?.arrivalFlight
          ? {
              label: tEmail('rent.rows.arrivalFlight'),
              value: validatedFields.data.delivery.arrivalFlight,
            }
          : null,
        validatedFields.data.delivery?.departureFlight
          ? {
              label: tEmail('rent.rows.departureFlight'),
              value: validatedFields.data.delivery.departureFlight,
            }
          : null,
      ].filter(Boolean) as { label: string; value: string }[],
      cta: { label: tEmail('rent.ctaLabel'), href: siteUrl },
      footerNote: tEmail('rent.footerNote'),
    }),
  });

  return { success: true };
};
