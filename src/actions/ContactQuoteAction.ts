'use server';

import { getCarById } from '@/lib/cars';
import { sendMail } from '@/lib/mailer';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { renderBrandEmail } from '@/lib/emailTemplates';
import { getSiteUrl, resolveLocale } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';

export type ContactQuotePayload = {
  locale: string;
  name: string;
  email: string;
  phone: string;
  preferredChannel: 'email' | 'phone' | 'whatsapp' | 'viber';
  rentalStart?: string;
  rentalEnd?: string;
  arrivalFlight?: string | null;
  departureFlight?: string | null;
  partySize?: string;
  children?: string;
  carId?: string;
};

export async function submitContactQuote(payload: ContactQuotePayload) {
  try {
    const carInfo = payload.carId ? await getCarById(payload.carId) : null;
    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();
    const siteUrl = getSiteUrl();
    const resolvedLocale = resolveLocale(payload.locale);
    const tEmail = await getTranslations({ locale: resolvedLocale, namespace: 'Emails' });
    let quoteId: string | null = null;

    const preferredChannelLabel = tEmail(
      `contactQuote.channelLabels.${payload.preferredChannel}`
    );

    const lines = [
      `Név: ${payload.name}`,
      `E-mail: ${payload.email}`,
      `Telefon: ${payload.phone}`,
      `Előnyben részesített csatorna: ${preferredChannelLabel}`,
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

    const { data: inserted, error: insertError } = await supabase
      .from('ContactQuotes')
      .insert(recordWithFlights)
      .select('id')
      .single();
    if (inserted?.id) {
      quoteId = inserted.id as string;
    }
    if (insertError) {
      const isMissingColumn =
        insertError.code === 'PGRST204' &&
        (insertError.message?.toLowerCase().includes('arrivalflight') ||
          insertError.message?.toLowerCase().includes('departureflight'));
      if (isMissingColumn) {
        const fallback = await supabase
          .from('ContactQuotes')
          .insert(baseRecord)
          .select('id')
          .single();
        if (fallback.data?.id) {
          quoteId = fallback.data.id as string;
        }
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

    const rentLink = carInfo
      ? `${siteUrl}/${resolvedLocale}/cars/${carInfo.id}/rent${
          quoteId ? `?quoteId=${quoteId}` : ''
        }`
      : siteUrl;

    const userRows = (
      [
        payload.rentalStart || payload.rentalEnd
          ? {
              label: tEmail('contactQuote.rows.period'),
              value: `${payload.rentalStart || 'n/a'} → ${
                payload.rentalEnd || 'n/a'
              }`,
            }
          : null,
        payload.preferredChannel
          ? {
              label: tEmail('contactQuote.rows.preferredChannel'),
              value: preferredChannelLabel,
            }
          : null,
        payload.arrivalFlight
          ? {
              label: tEmail('contactQuote.rows.arrivalFlight'),
              value: payload.arrivalFlight,
            }
          : null,
        payload.departureFlight
          ? {
              label: tEmail('contactQuote.rows.departureFlight'),
              value: payload.departureFlight,
            }
          : null,
        payload.partySize
          ? { label: tEmail('contactQuote.rows.partySize'), value: payload.partySize }
          : null,
        payload.children
          ? { label: tEmail('contactQuote.rows.children'), value: payload.children }
          : null,
        carInfo
          ? {
              label: tEmail('contactQuote.rows.car'),
              value: `${carInfo.manufacturer} ${carInfo.model}`.trim(),
            }
          : null,
      ] as ({ label: string; value: string } | null)[]
    ).filter(Boolean) as { label: string; value: string }[];

    await sendMail({
      to: payload.email,
      subject: tEmail('contactQuote.subject'),
      text: [
        tEmail('contactQuote.intro'),
        payload.rentalStart || payload.rentalEnd
          ? `${tEmail('contactQuote.rows.period')}: ${
              payload.rentalStart || 'n/a'
            } → ${payload.rentalEnd || 'n/a'}`
          : '',
        `${tEmail('contactQuote.rows.preferredChannel')}: ${preferredChannelLabel}`,
        payload.arrivalFlight
          ? `${tEmail('contactQuote.rows.arrivalFlight')}: ${payload.arrivalFlight}`
          : '',
        payload.departureFlight
          ? `${tEmail('contactQuote.rows.departureFlight')}: ${payload.departureFlight}`
          : '',
        payload.partySize
          ? `${tEmail('contactQuote.rows.partySize')}: ${payload.partySize}`
          : '',
        payload.children
          ? `${tEmail('contactQuote.rows.children')}: ${payload.children}`
          : '',
        carInfo
          ? `${tEmail('contactQuote.rows.car')}: ${carInfo.manufacturer} ${carInfo.model}`
          : '',
        `${tEmail('contactQuote.ctaLabel')}: ${rentLink}`,
      ]
        .filter(Boolean)
        .join('\n'),
      html: renderBrandEmail({
        title: tEmail('contactQuote.title'),
        intro: tEmail('contactQuote.intro'),
        rows: [
          { label: tEmail('contactQuote.rows.name'), value: payload.name },
          { label: tEmail('contactQuote.rows.email'), value: payload.email },
          { label: tEmail('contactQuote.rows.phone'), value: payload.phone },
          ...userRows,
        ],
        cta: { label: tEmail('contactQuote.ctaLabel'), href: rentLink },
        footerNote: tEmail('contactQuote.footerNote'),
      }),
      replyTo: process.env.MAIL_USER || undefined,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send contact quote request', error);
    return { success: false };
  }
}
