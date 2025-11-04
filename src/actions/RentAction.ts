'use server';

import { buildRentPdf } from '@/lib/build-rent-pdf';
import { sendMail } from '@/lib/mailer';
import { RentFormValues, RentSchema } from '@/schemas/RentSchema';
import z from 'zod';

export const RentAction = async (values: z.infer<RentFormValues>) => {
  const validatedFields = await RentSchema.safeParseAsync(values);

  console.log('val', validatedFields);

  if (!validatedFields.success) {
    return { error: 'Hibás adatok. Kérjük próbáld meg újból!' };
  }

  const pdfBuffer = await buildRentPdf(validatedFields.data);
  const pdfFileName = `berles-${validatedFields.data.rentalPeriod.startDate}-${validatedFields.data.contact.name}.pdf`;

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
    subject: `Köszönjük megkeresését`,
    text: 'Köszönjük, hogy felvette velünk a kapcsolatot! Hamarosan jelentkezünk a részletekkel.',
  });

  return { success: true };
};
