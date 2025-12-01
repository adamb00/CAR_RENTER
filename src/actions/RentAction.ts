'use server';

import { buildRentPdf } from '@/lib/build-rent-pdf';
import { sendMail } from '@/lib/mailer';
import { RentFormValues, RentSchema } from '@/schemas/RentSchema';
import z from 'zod';
import { renderBrandEmail } from '@/lib/emailTemplates';
import { resolveLocale } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import { DEFAULT_LOCALE } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { getNextHumanId } from '@/lib/humanId';
import { STATUS_DONE } from '@/lib/requestStatus';
import { getCarById } from '@/lib/cars';

export const RentAction = async (values: z.infer<RentFormValues>) => {
  const validatedFields = await RentSchema.safeParseAsync(values);

  if (!validatedFields.success) {
    return { error: 'Hibás adatok. Kérjük próbáld meg újból!' };
  }

  const locale = resolveLocale(validatedFields.data.locale ?? DEFAULT_LOCALE);
  const tEmail = await getTranslations({ locale, namespace: 'Emails' });
  const tRentForm = await getTranslations({ locale, namespace: 'RentForm' });
  const pdfBuffer = await buildRentPdf(validatedFields.data);
  const pdfFileName = `berles-${validatedFields.data.rentalPeriod.startDate}-${validatedFields.data.contact.name}.pdf`;
  const contactPhone = validatedFields.data.driver?.[0]?.phoneNumber ?? null;
  const humanId = await getNextHumanId('RentRequests');

  type DeliveryAddress =
    | NonNullable<RentFormValues['delivery']>['address']
    | null
    | undefined;

  const formatAddress = (address?: DeliveryAddress): string => {
    if (!address) return 'n/a';
    const parts = [
      address.country,
      address.postalCode,
      address.city,
      address.street,
      address.doorNumber,
    ]
      .filter(
        (segment) => typeof segment === 'string' && segment.trim().length > 0
      )
      .map((segment) => (segment as string).trim());
    return parts.length > 0 ? parts.join(', ') : 'n/a';
  };

  const formatFriendlyDate = (value?: string): string => {
    if (!value) return 'n/a';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatExtrasLabel = (values?: string[]): string => {
    const extrasList = values ?? [];
    if (extrasList.length === 0) return 'n/a';
    return extrasList
      .map((extra) => {
        try {
          return tRentForm(`extras.options.${extra}`);
        } catch {
          return extra.replace(/_/g, ' ');
        }
      })
      .join(', ');
  };

  const formatDeliveryType = (type?: string): string => {
    if (!type) return 'n/a';
    if (type === 'airport') return 'Repülőtér';
    if (type === 'accommodation') return 'Szállás';
    return type;
  };

  try {
    await prisma.rentRequest.create({
      data: {
        locale,
        carId: validatedFields.data.carId ?? null,
        quoteId: validatedFields.data.quoteId ?? null,
        humanId,
        contactName: validatedFields.data.contact.name,
        contactEmail: validatedFields.data.contact.email,
        contactPhone,
        rentalStart: validatedFields.data.rentalPeriod.startDate,
        rentalEnd: validatedFields.data.rentalPeriod.endDate,
        updated: null,
        payload: validatedFields.data,
      },
    });
    if (validatedFields.data.quoteId) {
      try {
        await prisma.contactQuote.update({
          where: { id: validatedFields.data.quoteId },
          data: { status: STATUS_DONE, updated: 'RentAction' },
        });
      } catch (updateQuoteError) {
        console.error('Failed to mark contact quote as done', updateQuoteError);
      }
    }
  } catch (error) {
    console.error('Failed to store rent request', error);
  }

  const formData = validatedFields.data;
  const period = `${formatFriendlyDate(
    formData.rentalPeriod.startDate
  )} → ${formatFriendlyDate(formData.rentalPeriod.endDate)}`;
  const extrasLabel = formatExtrasLabel(formData.extras);
  const adultsCount =
    formData.adults !== undefined && formData.adults !== null
      ? String(formData.adults)
      : 'n/a';
  const childrenCount =
    formData.children && formData.children.length > 0
      ? String(formData.children.length)
      : '0';
  const primaryDriver = formData.driver?.[0];
  const driverNameSegments = [
    primaryDriver?.firstName_1,
    primaryDriver?.lastName_1,
  ].filter(
    (segment) => typeof segment === 'string' && segment.trim().length > 0
  );
  const driverName =
    driverNameSegments.length > 0 ? driverNameSegments.join(' ') : 'n/a';
  const driverEmail = primaryDriver?.email ?? 'n/a';
  const driverPhone = primaryDriver?.phoneNumber ?? 'n/a';
  const delivery = formData.delivery;
  const arrivalFlight = delivery?.arrivalFlight ?? 'n/a';
  const departureFlight = delivery?.departureFlight ?? 'n/a';
  const deliveryPlaceType = formatDeliveryType(delivery?.placeType);
  const deliveryLocationName = delivery?.locationName ?? 'n/a';
  const deliveryAddress = formatAddress(delivery?.address ?? null);
  const invoice = formData.invoice;
  const invoiceAddress = formatAddress(invoice?.location ?? null);
  const invoiceName = invoice?.name ?? formData.contact.name ?? 'n/a';
  const invoiceEmail = invoice?.email ?? formData.contact.email ?? 'n/a';
  const invoicePhone = invoice?.phoneNumber ?? 'n/a';
  const quoteIdValue = formData.quoteId ?? 'n/a';
  const selectedCar =
    formData.carId && typeof formData.carId === 'string'
      ? await getCarById(formData.carId)
      : null;
  const carNameValue = selectedCar
    ? `${selectedCar.manufacturer} ${selectedCar.model}`
    : formData.carId ?? 'n/a';

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
      `Időszak: ${period}`,
      `Felnőttek: ${adultsCount}`,
      `Gyermekek: ${childrenCount}`,
      `Extrák: ${extrasLabel}`,
      '',
      `Kapcsolattartó: ${formData.contact.name}`,
      `Kapcsolattartó e-mail: ${formData.contact.email}`,
      `Sofőr neve: ${driverName}`,
      `Sofőr telefonszám: ${driverPhone}`,
      `Sofőr e-mail: ${driverEmail}`,
      '',
      `Szállítás: ${deliveryPlaceType}`,
      `Szállítási helyszín: ${deliveryLocationName}`,
      `Szállítási cím: ${deliveryAddress}`,
      `Érkezési járat: ${arrivalFlight}`,
      `Visszaúti járat: ${departureFlight}`,
      '',
      `Számla neve: ${invoiceName}`,
      `Számla e-mail: ${invoiceEmail}`,
      `Számla telefonszám: ${invoicePhone}`,
      `Számla címe: ${invoiceAddress}`,
      '',
      `Autómodell: ${carNameValue}`,
      `Ajánlatkérés ID: ${quoteIdValue}`,
    ]
      .filter(Boolean)
      .join('\n'),
    html: renderBrandEmail({
      title: tEmail('rent.title'),
      intro: tEmail('rent.intro'),
      rows: [
        { label: 'Időszak', value: period },
        { label: 'Felnőttek', value: adultsCount },
        { label: 'Gyermekek', value: childrenCount },
        { label: 'Extrák', value: extrasLabel },
        { label: 'Kapcsolattartó', value: formData.contact.name },
        { label: 'Kapcsolattartó e-mail', value: formData.contact.email },
        { label: 'Sofőr', value: driverName },
        { label: 'Sofőr telefon', value: driverPhone },
        { label: 'Sofőr e-mail', value: driverEmail },
        { label: 'Szállítás', value: deliveryPlaceType },
        { label: 'Szállítási helyszín', value: deliveryLocationName },
        { label: 'Szállítási cím', value: deliveryAddress },
        {
          label: 'Érkezési járat',
          value: arrivalFlight,
        },
        {
          label: 'Visszaúti járat',
          value: departureFlight,
        },
        { label: 'Számlázás neve', value: invoiceName },
        { label: 'Számlázás e-mail', value: invoiceEmail },
        { label: 'Számlázás telefonszám', value: invoicePhone },
        { label: 'Számlázás címe', value: invoiceAddress },
        { label: 'Autómodell', value: carNameValue },
        { label: 'Ajánlatkérés ID', value: quoteIdValue },
      ],
      footerNote: tEmail('rent.footerNote'),
    }),
  });

  return { success: true };
};
