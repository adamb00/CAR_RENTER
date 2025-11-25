'use server';

import { getCarById } from '@/lib/cars';
import { sendMail } from '@/lib/mailer';
import { getSupabaseServerClient } from '@/lib/supabase/server';

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
  carId?: string;
};

const CHANNEL_LABELS: Record<ContactQuotePayload['preferredChannel'], string> =
  {
    email: 'E-mail',
    phone: 'Telefon',
    whatsapp: 'WhatsApp',
    viber: 'Viber',
  };

export async function submitContactQuote(payload: ContactQuotePayload) {
  try {
    const carInfo = payload.carId ? await getCarById(payload.carId) : null;
    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();

    const lines = [
      `Név: ${payload.name}`,
      `E-mail: ${payload.email}`,
      `Telefon: ${payload.phone}`,
      `Előnyben részesített csatorna: ${
        CHANNEL_LABELS[payload.preferredChannel]
      }`,
      `Bérlés: ${payload.rentalStart || 'n/a'} → ${payload.rentalEnd || 'n/a'}`,
      `Érkezési járatszám: ${payload.arrivalFlight || 'n/a'}`,
      `Hazautazó járatszám: ${payload.departureFlight || 'n/a'}`,
      `Utazók száma: ${payload.partySize || 'n/a'}`,
      `Gyermekek száma: ${payload.children || '0'}`,
      `Kiválasztott autó: ${
        carInfo
          ? `${carInfo.manufacturer} ${carInfo.model} (ID: ${carInfo.id})`
          : payload.carId || 'n/a'
      }`,
      `Beküldve a(z) ${payload.locale.toUpperCase()} nyelvű kapcsolat oldalon.`,
    ].join('\n');

    // Persist request to Supabase (best-effort; email still sent even if insert fails)
    const baseRecord = {
      locale: payload.locale,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      preferredchannel: payload.preferredChannel,
      rentalstart: payload.rentalStart ?? null,
      rentalend: payload.rentalEnd ?? null,
      partysize: payload.partySize ?? null,
      children: payload.children ?? null,
      carid: payload.carId ?? null,
      carname: carInfo
        ? `${carInfo.manufacturer} ${carInfo.model}`.trim()
        : null,
      status: 'new',
      updated: null as string | null,
      createdAt: now,
      updatedAt: now,
    };

    const recordWithFlights = {
      ...baseRecord,
      ...(payload.arrivalFlight
        ? { arrivalflight: payload.arrivalFlight }
        : {}),
      ...(payload.departureFlight
        ? { departureflight: payload.departureFlight }
        : {}),
    };

    const { error: insertError } = await supabase
      .from('ContactQuotes')
      .insert(recordWithFlights);
    if (insertError) {
      const isMissingColumn =
        insertError.code === 'PGRST204' &&
        (insertError.message?.toLowerCase().includes('arrivalflight') ||
          insertError.message?.toLowerCase().includes('departureflight'));
      if (isMissingColumn) {
        const fallback = await supabase
          .from('ContactQuotes')
          .insert(baseRecord);
        if (fallback.error) {
          console.error(
            'Failed to store contact quote in Supabase (fallback)',
            fallback.error
          );
        }
      } else {
        console.error('Failed to store contact quote in Supabase', insertError);
      }
    }

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
