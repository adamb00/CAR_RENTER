'use server';
import { InquireFormValues } from '@/components/layout/InquireSection';
import { sendMail } from '@/lib/mailer';

export const InquireAction = async (values: InquireFormValues) => {
  try {
    await sendMail({
      to: process.env.MAIL_USER || 'info@zodiacsrentacar.com',
      subject: `Ajánlatkérés | ${values.fullName} részére`,
      text: `
        E-mail cím: ${values.email}
      `,
    });
    return { success: true };
  } catch {
    return false;
  }
};
