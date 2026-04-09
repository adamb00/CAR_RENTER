'use server';

import type Mail from 'nodemailer/lib/mailer';
import { getCarById } from '@/lib/cars';
import { sendMail } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';
import { renderBrandEmail, type EmailRow } from '@/lib/emailTemplates';
import { getSiteUrl, resolveLocale } from '@/lib/seo/seo';
import { getTranslations } from 'next-intl/server';
import { getNextHumanId } from '@/lib/humanId';
import { CONTACT_STATUS_NEW } from '@/lib/requestStatus';
import { recordNotification } from '@/lib/notifications';
import {
  normalizeResidentCardMimeType,
  RESIDENT_CARD_MAX_SIZE_BYTES,
} from '@/components/contact/quote.types';
import { ContactQuotePayload } from './ContactQuoteAction.type';

type EmailTranslations = Awaited<ReturnType<typeof getTranslations>>;

const parseDateValue = (value?: string | null): Date | null => {
  if (!value) return null;
  const needsTimeSuffix = /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
  const isoValue = needsTimeSuffix ? `${value}T00:00:00.000Z` : value;
  const parsed = new Date(isoValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeRentalDays = (value?: number | null): number | null => {
  if (typeof value !== 'number') return null;
  return Number.isFinite(value) && value > 0 ? value : null;
};

const formatPickupPlaceType = (
  tEmail: EmailTranslations,
  type?: string
): string => {
  if (!type) return 'n/a';
  if (type === 'airport') return tEmail('contactQuote.admin.pickupTypes.airport');
  if (type === 'accommodation') {
    return tEmail('contactQuote.admin.pickupTypes.accommodation');
  }
  if (type === 'office') return tEmail('contactQuote.admin.pickupTypes.office');
  return type;
};

const formatDeliverySummary = (
  tEmail: EmailTranslations,
  delivery?: ContactQuotePayload['delivery']
): string => {
  if (!delivery) return 'n/a';
  const parts: string[] = [];
  if (delivery.placeType) {
    parts.push(
      `${tEmail('contactQuote.admin.deliveryLabels.pickupPlace')}: ${formatPickupPlaceType(tEmail, delivery.placeType)}`
    );
  }
  if (delivery.locationName) {
    parts.push(
      `${tEmail('contactQuote.admin.deliveryLabels.locationName')}: ${delivery.locationName}`
    );
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
      parts.push(
        `${tEmail('contactQuote.admin.deliveryLabels.address')}: ${chunks.join(', ')}`
      );
    }
  }
  return parts.length > 0 ? parts.join('<br>') : 'n/a';
};

const buildDeliveryLines = (
  tEmail: EmailTranslations,
  payload: ContactQuotePayload
): string[] => {
  if (!payload.delivery?.placeType) {
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
    `${tEmail('contactQuote.admin.deliveryLabels.pickupPlace')}: ${formatPickupPlaceType(tEmail, payload.delivery.placeType)}`,
    `${tEmail('contactQuote.admin.deliveryLabels.locationName')}: ${payload.delivery.locationName ?? 'n/a'}`,
    `${tEmail('contactQuote.admin.deliveryLabels.address')}: ${addressParts || 'n/a'}`,
  ];
};

const buildResidentCardAttachment = (
  residentCard?: ContactQuotePayload['residentCard']
): Mail.Attachment | null => {
  if (!residentCard) {
    return null;
  }

  const normalizedType = normalizeResidentCardMimeType(
    residentCard.type,
    residentCard.name
  );
  if (!normalizedType) {
    throw new Error('Invalid resident card type');
  }

  const content = residentCard.content.trim();
  if (content.length === 0) {
    throw new Error('Missing resident card content');
  }

  const fileBuffer = Buffer.from(content, 'base64');
  if (fileBuffer.length === 0 || fileBuffer.length > RESIDENT_CARD_MAX_SIZE_BYTES) {
    throw new Error('Invalid resident card size');
  }

  const safeFileName =
    residentCard.name.trim().replace(/[^a-zA-Z0-9._-]/g, '_') ||
    'resident-card';

  return {
    filename: safeFileName,
    content: fileBuffer,
    contentType: normalizedType,
  };
};

const serializeResidentCardForDb = (
  residentCard?: ContactQuotePayload['residentCard']
): string[] => {
  if (!residentCard) {
    return [];
  }

  const normalizedType = normalizeResidentCardMimeType(
    residentCard.type,
    residentCard.name
  );
  if (!normalizedType) {
    throw new Error('Invalid resident card type');
  }

  const content = residentCard.content.trim();
  if (content.length === 0) {
    throw new Error('Missing resident card content');
  }

  const fileBuffer = Buffer.from(content, 'base64');
  if (fileBuffer.length === 0 || fileBuffer.length > RESIDENT_CARD_MAX_SIZE_BYTES) {
    throw new Error('Invalid resident card size');
  }

  return [
    JSON.stringify({
      name: residentCard.name.trim(),
      type: normalizedType,
      size: fileBuffer.length,
      content,
    }),
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
    const rentalDays = normalizeRentalDays(payload.rentalDays);
    const residentCardAttachment = buildResidentCardAttachment(
      payload.residentCard
    );
    const residenceCard = serializeResidentCardForDb(payload.residentCard);
    const residentCardFileName = payload.residentCard?.name ?? 'n/a';

    const created = await prisma.contactQuote.create({
      data: {
        locale: payload.locale,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        preferredChannel: payload.preferredChannel,
        rentalStart: rentalStartDate,
        rentalEnd: rentalEndDate,
        rentalDays,
        arrivalFlight: payload.arrivalFlight ?? null,
        departureFlight: payload.departureFlight ?? null,
        partySize: payload.partySize ?? null,
        children: payload.children ?? null,
        cars: payload.cars ?? null,
        residenceCard,
        carId: payload.carId ?? null,
        carName: carInfo
          ? `${carInfo.manufacturer} ${carInfo.model}`.trim()
          : null,
        extras: payload.extras ?? [],
        delivery: payload.delivery ?? undefined,
        status: CONTACT_STATUS_NEW,
        updated: null,
        humanId,
      },
      select: {
        id: true,
      },
    });

    quoteId = created.id;

    const deliveryLines = buildDeliveryLines(tEmail, payload);
    const formattedPeriod = `${payload.rentalStart || 'n/a'} → ${
      payload.rentalEnd || 'n/a'
    }`;
    const carDisplayName = carInfo
      ? `${carInfo.manufacturer} ${carInfo.model}`.trim()
      : payload.carId ?? 'n/a';
    const carLineValue = carInfo
      ? `${carInfo.manufacturer} ${carInfo.model} (ID: ${carInfo.id})`
      : carDisplayName;
    const adminStatus = tEmail('contactQuote.admin.statusNew');

    const lines = [
      `${tEmail('contactQuote.rows.name')}: ${payload.name}`,
      `${tEmail('contactQuote.rows.email')}: ${payload.email}`,
      `${tEmail('contactQuote.rows.phone')}: ${payload.phone}`,
      `${tEmail('contactQuote.rows.preferredChannel')}: ${preferredChannelLabel}`,
      `${tEmail('contactQuote.rows.period')}: ${formattedPeriod}`,
      `${tEmail('contactQuote.rows.rentalDays')}: ${payload.rentalDays || 'n/a'}`,
      `${tEmail('contactQuote.rows.arrivalFlight')}: ${payload.arrivalFlight || 'n/a'}`,
      `${tEmail('contactQuote.rows.departureFlight')}: ${payload.departureFlight || 'n/a'}`,
      `${tEmail('contactQuote.rows.partySize')}: ${payload.partySize || 'n/a'}`,
      `${tEmail('contactQuote.rows.children')}: ${payload.children || '0'}`,
      `${tEmail('contactQuote.rows.cars')}: ${payload.cars || 'n/a'}`,
      `${tEmail('contactQuote.rows.residentCard')}: ${residentCardFileName}`,
      `${tEmail('contactQuote.rows.extras')}: ${extrasLabel}`,
      ...deliveryLines,
      `${tEmail('contactQuote.rows.car')}: ${carLineValue}`,
      `${tEmail('contactQuote.rows.locale')}: ${payload.locale}`,
      `${tEmail('contactQuote.rows.humanId')}: ${humanId}`,
      `${tEmail('contactQuote.rows.quoteId')}: ${quoteId}`,
      `${tEmail('contactQuote.rows.status')}: ${adminStatus}`,
      tEmail('contactQuote.admin.submittedOn', {
        locale: payload.locale.toUpperCase(),
      }),
    ].join('\n');

    const rentLink = carInfo
      ? `${siteUrl}/${resolvedLocale}/cars/${carInfo.id}/rent${
          quoteId ? `?quoteId=${quoteId}` : ''
        }`
      : siteUrl;

    const notificationHref = quoteId ? `/quotes/${quoteId}` : '/quote';

    await recordNotification({
      type: 'contact_quote',
      title: tEmail('contactQuote.admin.notificationTitle'),
      description: `${payload.name} (${payload.email}) – ${formattedPeriod}`,
      href: notificationHref,
      tone: 'success',
      referenceId: quoteId,
      metadata: {
        quoteId,
        humanId,
        locale: payload.locale,
        status: CONTACT_STATUS_NEW,
        carId: payload.carId ?? null,
      },
    });

    const adminRows = [
      { label: tEmail('contactQuote.rows.quoteId'), value: quoteId },
      { label: tEmail('contactQuote.rows.humanId'), value: humanId },
      { label: tEmail('contactQuote.rows.locale'), value: payload.locale },
      { label: tEmail('contactQuote.rows.name'), value: payload.name },
      { label: tEmail('contactQuote.rows.email'), value: payload.email },
      { label: tEmail('contactQuote.rows.phone'), value: payload.phone },
      {
        label: tEmail('contactQuote.rows.preferredChannel'),
        value: preferredChannelLabel,
      },
      { label: tEmail('contactQuote.rows.period'), value: formattedPeriod },
      {
        label: tEmail('contactQuote.rows.rentalDays'),
        value: payload.rentalDays ?? 'n/a',
      },
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
      {
        label: tEmail('contactQuote.rows.cars'),
        value: payload.cars ?? 'n/a',
      },
      {
        label: tEmail('contactQuote.rows.residentCard'),
        value: residentCardFileName,
      },
      { label: tEmail('contactQuote.rows.car'), value: carDisplayName },
      { label: tEmail('contactQuote.rows.extras'), value: extrasLabel },
      {
        label: tEmail('contactQuote.rows.delivery'),
        value: formatDeliverySummary(tEmail, payload.delivery),
      },
      { label: tEmail('contactQuote.rows.status'), value: adminStatus },
    ] as { label: string; value: string | null }[];

    const sanitizedAdminRows: EmailRow[] = adminRows.map((row) => ({
      label: row.label,
      value: row.value ?? 'n/a',
    }));

    const adminHtml = renderBrandEmail({
      title: tEmail('contactQuote.admin.title'),
      intro: tEmail('contactQuote.admin.intro', {
        locale: payload.locale.toUpperCase(),
      }),
      rows: sanitizedAdminRows,
      cta: { label: tEmail('contactQuote.admin.ctaLabel'), href: rentLink },
      footerNote: tEmail('contactQuote.footerNote'),
      securityNote: tEmail('securityDisclaimer'),
    });

    await sendMail({
      to: process.env.MAIL_USER || 'info@zodiacsrentacar.com',
      subject: `${tEmail('contactQuote.admin.subject')} | ${payload.name}`,
      text: lines,
      html: adminHtml,
      replyTo: payload.email,
      attachments: residentCardAttachment ? [residentCardAttachment] : undefined,
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
        payload.rentalDays
          ? {
              label: tEmail('contactQuote.rows.rentalDays'),
              value: payload.rentalDays,
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
        payload.cars
          ? {
              label: tEmail('contactQuote.rows.cars'),
              value: payload.cars,
            }
          : null,
        payload.residentCard
          ? {
              label: tEmail('contactQuote.rows.residentCard'),
              value: payload.residentCard.name,
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
        payload.rentalDays
          ? `${tEmail('contactQuote.rows.rentalDays')}: ${payload.rentalDays}`
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
        payload.cars
          ? `${tEmail('contactQuote.rows.cars')}: ${payload.cars}`
          : '',
        payload.residentCard
          ? `${tEmail('contactQuote.rows.residentCard')}: ${payload.residentCard.name}`
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
