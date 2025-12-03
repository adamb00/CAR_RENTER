'use server';

import { getCarById } from '@/lib/cars';
import { sendMail } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';
import { renderBrandEmail, type EmailRow } from '@/lib/emailTemplates';
import { getSiteUrl, resolveLocale } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import { getNextHumanId } from '@/lib/humanId';
import { STATUS_NEW } from '@/lib/requestStatus';

const parseDateValue = (value?: string | null): Date | null => {
  if (!value) return null;
  const needsTimeSuffix = /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
  const isoValue = needsTimeSuffix ? `${value}T00:00:00.000Z` : value;
  const parsed = new Date(isoValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

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
  extras?: string[];
  delivery?: {
    placeType?: 'accommodation' | 'airport';
    locationName?: string;
    address?: {
      country?: string;
      postalCode?: string;
      city?: string;
      street?: string;
      doorNumber?: string;
    };
  };
};

const formatDeliverySummary = (
  delivery?: ContactQuotePayload['delivery']
): string => {
  if (!delivery) return 'n/a';
  const parts: string[] = [];
  if (delivery.placeType) {
    parts.push(`Place type: ${delivery.placeType}`);
  }
  if (delivery.locationName) {
    parts.push(`Location: ${delivery.locationName}`);
  }
  if (delivery.address) {
    const chunks = [
      delivery.address.country,
      delivery.address.postalCode,
      delivery.address.city,
      delivery.address.street,
      delivery.address.doorNumber,
    ]
      .filter((value) => typeof value === 'string' && value.trim().length > 0)
      .map((value) => (value as string).trim());
    if (chunks.length > 0) {
      parts.push(`Address: ${chunks.join(', ')}`);
    }
  }
  return parts.length > 0 ? parts.join('<br>') : 'n/a';
};

const buildDeliveryLines = (payload: ContactQuotePayload): string[] => {
  if (!payload.extras?.includes('kiszallitas') || !payload.delivery) {
    return [];
  }

  const address = payload.delivery.address;
  const addressParts = address
    ? [
        address.country,
        address.postalCode,
        address.city,
        address.street,
        address.doorNumber,
      ]
        .filter((value) => typeof value === 'string' && value.trim().length > 0)
        .map((value) => (value as string).trim())
        .join(' ')
    : '';

  return [
    `Kiszállítás típusa: ${payload.delivery.placeType ?? 'n/a'}`,
    `Helyszín neve: ${payload.delivery.locationName ?? 'n/a'}`,
    `Cím: ${addressParts || 'n/a'}`,
  ];
};

export async function submitContactQuote(payload: ContactQuotePayload) {
  try {
    const carInfo = payload.carId ? await getCarById(payload.carId) : null;
    const siteUrl = getSiteUrl();
    const resolvedLocale = resolveLocale(payload.locale);
    const tEmail = await getTranslations({
      locale: resolvedLocale,
      namespace: 'Emails',
    });
    let quoteId: string | null = null;
    const humanId = await getNextHumanId('ContactQuotes');

    const preferredChannelLabel = tEmail(
      `contactQuote.channelLabels.${payload.preferredChannel}`
    );
    const extrasLabel =
      Array.isArray(payload.extras) && payload.extras.length > 0
        ? payload.extras.join(', ')
        : 'n/a';

    const rentalStartDate = parseDateValue(payload.rentalStart);
    const rentalEndDate = parseDateValue(payload.rentalEnd);

    const created = await prisma.contactQuote.create({
      data: {
        locale: payload.locale,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        preferredChannel: payload.preferredChannel,
        rentalStart: rentalStartDate,
        rentalEnd: rentalEndDate,
        arrivalFlight: payload.arrivalFlight ?? null,
        departureFlight: payload.departureFlight ?? null,
        partySize: payload.partySize ?? null,
        children: payload.children ?? null,
        carId: payload.carId ?? null,
        carName: carInfo
          ? `${carInfo.manufacturer} ${carInfo.model}`.trim()
          : null,
        extras: payload.extras ?? [],
        delivery: payload.delivery ?? undefined,
        status: STATUS_NEW,
        updated: null,
        humanId,
      },
      select: {
        id: true,
      },
    });

    quoteId = created.id;

    const deliveryLines = buildDeliveryLines(payload);
    const formattedPeriod = `${payload.rentalStart || 'n/a'} → ${
      payload.rentalEnd || 'n/a'
    }`;
    const carDisplayName = carInfo
      ? `${carInfo.manufacturer} ${carInfo.model}`.trim()
      : payload.carId ?? 'n/a';
    const carLineValue = carInfo
      ? `${carInfo.manufacturer} ${carInfo.model} (ID: ${carInfo.id})`
      : carDisplayName;

    const lines = [
      `Név: ${payload.name}`,
      `E-mail: ${payload.email}`,
      `Telefon: ${payload.phone}`,
      `Előnyben részesített csatorna: ${preferredChannelLabel}`,
      `Bérlés: ${formattedPeriod}`,
      `Érkezési járatszám: ${payload.arrivalFlight || 'n/a'}`,
      `Hazautazó járatszám: ${payload.departureFlight || 'n/a'}`,
      `Utazók száma: ${payload.partySize || 'n/a'}`,
      `Gyermekek száma: ${payload.children || '0'}`,
      `Extra szolgáltatások: ${extrasLabel}`,
      ...deliveryLines,
      `Kiválasztott autó: ${carLineValue}`,
      `Locale: ${payload.locale}`,
      `Human ID: ${humanId}`,
      `Quote ID: ${quoteId}`,
      `Status: ${STATUS_NEW}`,
      `Beküldve a(z) ${payload.locale.toUpperCase()} nyelvű kapcsolat oldalon.`,
    ].join('\n');

    const rentLink = carInfo
      ? `${siteUrl}/${resolvedLocale}/cars/${carInfo.id}/rent${
          quoteId ? `?quoteId=${quoteId}` : ''
        }`
      : siteUrl;

    const adminRows = [
      { label: 'Quote ID', value: quoteId },
      { label: 'Human ID', value: humanId },
      { label: 'Locale', value: payload.locale },
      { label: tEmail('contactQuote.rows.name'), value: payload.name },
      { label: tEmail('contactQuote.rows.email'), value: payload.email },
      { label: tEmail('contactQuote.rows.phone'), value: payload.phone },
      {
        label: tEmail('contactQuote.rows.preferredChannel'),
        value: preferredChannelLabel,
      },
      { label: tEmail('contactQuote.rows.period'), value: formattedPeriod },
      {
        label: tEmail('contactQuote.rows.arrivalFlight'),
        value: payload.arrivalFlight ?? 'n/a',
      },
      {
        label: tEmail('contactQuote.rows.departureFlight'),
        value: payload.departureFlight ?? 'n/a',
      },
      {
        label: tEmail('contactQuote.rows.partySize'),
        value: payload.partySize ?? 'n/a',
      },
      {
        label: tEmail('contactQuote.rows.children'),
        value: payload.children ?? '0',
      },
      { label: tEmail('contactQuote.rows.car'), value: carDisplayName },
      { label: 'Extras', value: extrasLabel },
      { label: 'Delivery', value: formatDeliverySummary(payload.delivery) },
      { label: 'Status', value: 'new' },
    ] as { label: string; value: string | null }[];

    const sanitizedAdminRows: EmailRow[] = adminRows.map((row) => ({
      label: row.label,
      value: row.value ?? 'n/a',
    }));

    const adminHtml = renderBrandEmail({
      title: 'New booking request', // admin-facing subject
      intro: `New contact quote submitted via the ${payload.locale.toUpperCase()} form.`,
      rows: sanitizedAdminRows,
      cta: { label: 'Open rental page', href: rentLink },
      footerNote: tEmail('contactQuote.footerNote'),
      securityNote: tEmail('securityDisclaimer'),
    });

    await sendMail({
      to: process.env.MAIL_USER || 'info@zodiacsrentacar.com',
      subject: `Kapcsolat oldal ajánlatkérés | ${payload.name}`,
      text: lines,
      html: adminHtml,
      replyTo: payload.email,
    });

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
          ? {
              label: tEmail('contactQuote.rows.partySize'),
              value: payload.partySize,
            }
          : null,
        payload.children
          ? {
              label: tEmail('contactQuote.rows.children'),
              value: payload.children,
            }
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
        `${tEmail(
          'contactQuote.rows.preferredChannel'
        )}: ${preferredChannelLabel}`,
        payload.arrivalFlight
          ? `${tEmail('contactQuote.rows.arrivalFlight')}: ${
              payload.arrivalFlight
            }`
          : '',
        payload.departureFlight
          ? `${tEmail('contactQuote.rows.departureFlight')}: ${
              payload.departureFlight
            }`
          : '',
        payload.partySize
          ? `${tEmail('contactQuote.rows.partySize')}: ${payload.partySize}`
          : '',
        payload.children
          ? `${tEmail('contactQuote.rows.children')}: ${payload.children}`
          : '',
        carInfo
          ? `${tEmail('contactQuote.rows.car')}: ${carInfo.manufacturer} ${
              carInfo.model
            }`
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
        // cta: { label: tEmail('contactQuote.ctaLabel'), href: rentLink },
        // footerNote: tEmail('contactQuote.footerNote'),
        securityNote: tEmail('securityDisclaimer'),
      }),
      replyTo: process.env.MAIL_USER || undefined,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send contact quote request', error);
    return { success: false };
  }
}
