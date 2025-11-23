'use server';

import { sendMail } from '@/lib/mailer';

export type ContactQuotePayload = {
  locale: string;
  name: string;
  email: string;
  phone: string;
  preferredChannel: 'email' | 'phone' | 'whatsapp' | 'viber';
  rentalStart?: string;
  rentalEnd?: string;
  arrivalFlight: string;
  departureFlight: string;
  partySize?: string;
  children?: string;
};

const CHANNEL_LABELS: Record<ContactQuotePayload['preferredChannel'], string> = {
  email: 'E-mail',
  phone: 'Telefon',
  whatsapp: 'WhatsApp',
  viber: 'Viber',
};

export async function submitContactQuote(payload: ContactQuotePayload) {
  try {
    const lines = [
      `Név: ${payload.name}`,
      `E-mail: ${payload.email}`,
      `Telefon: ${payload.phone}`,
      `Előnyben részesített csatorna: ${CHANNEL_LABELS[payload.preferredChannel]}`,
      `Bérlés: ${payload.rentalStart || 'n/a'} → ${payload.rentalEnd || 'n/a'}`,
      `Érkezési járatszám: ${payload.arrivalFlight}`,
      `Hazautazó járatszám: ${payload.departureFlight}`,
      `Utazók száma: ${payload.partySize || 'n/a'}`,
      `Gyermekek száma: ${payload.children || '0'}`,
      `Beküldve a(z) ${payload.locale.toUpperCase()} nyelvű kapcsolat oldalon.`,
    ].join('\n');

    await sendMail({
      to: process.env.MAIL_USER || 'info@zodiacsrentacar.com',
      subject: `Kapcsolat oldal ajánlatkérés | ${payload.name}`,
      text: lines,
      replyTo: payload.email,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send contact quote request', error);
    return { success: false };
  }
}
