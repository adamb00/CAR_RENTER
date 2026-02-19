import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getCarById, getCars } from '@/lib/cars';
import { LOCALES } from '@/i18n/config';
import { resolveLocale } from '@/lib/seo/seo';
import { NoSSR } from '@/components/NoSSR';
import RentPageClient from './client-page';
import { getContactQuoteById } from '@/lib/contactQuotes';
import { parseCompactRentPayload } from '@/lib/rentPayload';
import { prisma } from '@/lib/prisma';
import type { RentFormValues } from '@/schemas/RentSchema';
import { buildCarMetadata } from '@/lib/seo/metadata';
import { buildInitialValues } from './build-initial-values';

type PageParams = {
  locale: string;
  id: string;
};
type ManageSection = 'contact' | 'travel' | 'invoice';
type ManageMode = 'modify';

const RENT_ID_REGEX = /^[0-9a-fA-F-]{36}$/;

const toDateInputValue = (value: Date | string | null | undefined): string => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const toPlaceType = (
  value: string | null | undefined,
): 'accommodation' | 'airport' | 'office' | undefined => {
  if (value === 'accommodation' || value === 'airport' || value === 'office') {
    return value;
  }
  return undefined;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const resolvedLocale = resolveLocale(locale);
  const car = await getCarById(id);

  if (!car) {
    return {};
  }

  return buildCarMetadata({
    locale: resolvedLocale,
    namespace: 'CarRent',
    car,
    pathSuffix: '/rent',
  });
}

export async function generateStaticParams(): Promise<PageParams[]> {
  const cars = await getCars();
  return LOCALES.flatMap((locale) =>
    cars.map((car) => ({
      locale,
      id: car.id,
    }))
  );
}

export default async function RentPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale, id }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const resolvedLocale = resolveLocale(locale);
  const quoteIdRaw = resolvedSearchParams?.quoteId;
  const quoteId = Array.isArray(quoteIdRaw) ? quoteIdRaw[0] : quoteIdRaw;
  const offerRaw = resolvedSearchParams?.offer;
  const offerParam = Array.isArray(offerRaw) ? offerRaw[0] : offerRaw;
  const offerIndex =
    typeof offerParam === 'string' && offerParam.trim().length > 0
      ? Number.parseInt(offerParam, 10)
      : NaN;
  const isValidQuoteId =
    typeof quoteId === 'string' && /^[0-9a-fA-F-]{36}$/.test(quoteId ?? '');

  const [car, quote] = await Promise.all([
    getCarById(id),
    isValidQuoteId ? getContactQuoteById(quoteId) : Promise.resolve(null),
  ]);

  if (!car) {
    notFound();
  }

  const pickSingleValue = (
    value: string | string[] | undefined
  ): string | undefined => (Array.isArray(value) ? value[0] : value);
  const rentIdRaw = pickSingleValue(resolvedSearchParams?.rentId);
  let fallbackAction: string | undefined;
  let rentIdCandidate = rentIdRaw;
  if (typeof rentIdCandidate === 'string' && rentIdCandidate.includes('?')) {
    const [idSegment, rest] = rentIdCandidate.split('?');
    rentIdCandidate = idSegment;
    if (!resolvedSearchParams?.action && rest) {
      const search = new URLSearchParams(rest);
      fallbackAction = search.get('action') ?? undefined;
    }
  }
  const rentId =
    typeof rentIdCandidate === 'string' && RENT_ID_REGEX.test(rentIdCandidate)
      ? rentIdCandidate
      : null;
  const actionRaw =
    pickSingleValue(resolvedSearchParams?.action) ?? fallbackAction;
  const allowedSections = new Set<ManageSection>([
    'contact',
    'travel',
    'invoice',
  ]);
  let manageSection: ManageSection | null = null;
  let manageMode: ManageMode | null = null;
  if (actionRaw === 'modify') {
    manageMode = 'modify';
  } else if (
    typeof actionRaw === 'string' &&
    allowedSections.has(actionRaw as ManageSection)
  ) {
    manageSection = actionRaw as ManageSection;
  }

  let rentPrefill: RentFormValues | null = null;
  if (rentId && manageMode === 'modify') {
    try {
      const rentRecord = await prisma.rentRequest.findUnique({
        where: { id: rentId },
        select: {
          id: true,
          locale: true,
          carId: true,
          quoteId: true,
          contactName: true,
          contactEmail: true,
          contactPhone: true,
          rentalStart: true,
          rentalEnd: true,
          rentalDays: true,
          payload: true,
          BookingDeliveryDetails: {
            select: {
              placeType: true,
              locationName: true,
              arrivalFlight: true,
              departureFlight: true,
              arrivalHour: true,
              arrivalMinute: true,
            },
          },
        },
      });
      if (rentRecord) {
        const compact = parseCompactRentPayload(rentRecord.payload);
        const payloadCarId = rentRecord.carId;

        if (!payloadCarId || payloadCarId === car.id) {
          const prefill = buildInitialValues(null, resolvedLocale, car.id);
          const deliveryDetails = rentRecord.BookingDeliveryDetails;

          prefill.rentId = rentId;
          prefill.locale = resolvedLocale;
          prefill.carId = car.id;
          prefill.quoteId = rentRecord.quoteId ?? undefined;
          prefill.contact = {
            same: false,
            name: rentRecord.contactName ?? '',
            email: rentRecord.contactEmail ?? '',
          };
          prefill.driver =
            Array.isArray(compact?.driver) && compact.driver.length > 0
              ? compact.driver
              : prefill.driver;
          prefill.driver[0].phoneNumber =
            rentRecord.contactPhone ?? prefill.driver[0].phoneNumber ?? '';
          prefill.driver[0].email =
            rentRecord.contactEmail ?? prefill.driver[0].email ?? '';
          prefill.rentalPeriod = {
            startDate: toDateInputValue(rentRecord.rentalStart),
            endDate: toDateInputValue(rentRecord.rentalEnd),
          };
          prefill.rentalDays =
            typeof rentRecord.rentalDays === 'number'
              ? rentRecord.rentalDays
              : undefined;
          prefill.delivery = {
            placeType: toPlaceType(deliveryDetails?.placeType),
            locationName: deliveryDetails?.locationName ?? '',
            arrivalHour: deliveryDetails?.arrivalHour ?? '',
            arrivalMinute: deliveryDetails?.arrivalMinute ?? '',
            arrivalFlight: deliveryDetails?.arrivalFlight ?? '',
            departureFlight: deliveryDetails?.departureFlight ?? '',
            address: {
              country: compact?.deliveryAddress?.country ?? '',
              postalCode: compact?.deliveryAddress?.postalCode ?? '',
              city: compact?.deliveryAddress?.city ?? '',
              street: compact?.deliveryAddress?.street ?? '',
              doorNumber: compact?.deliveryAddress?.doorNumber ?? '',
            },
          };
          prefill.adults =
            typeof compact?.adults === 'number'
              ? compact.adults
              : prefill.adults;
          prefill.children = Array.isArray(compact?.children)
            ? compact.children
            : prefill.children;
          prefill.extras = Array.isArray(compact?.extras)
            ? compact.extras
            : prefill.extras;
          prefill.invoice = compact?.invoice ?? {
            ...prefill.invoice,
            name: prefill.contact.name,
            email: prefill.contact.email,
            phoneNumber: rentRecord.contactPhone ?? '',
          };
          prefill.tax = compact?.tax ?? prefill.tax;
          prefill.consents = compact?.consents ?? prefill.consents;

          rentPrefill = prefill;
        }
      }
    } catch (error) {
      console.error('Failed to load rent request for editing', error);
    }
  }

  const normalizedQuote =
    quote && Array.isArray(quote.bookingRequestData)
      ? (() => {
          const offers = quote.bookingRequestData;
          const safeIndex =
            Number.isFinite(offerIndex) && offerIndex >= 0
              ? offerIndex
              : 0;
          const selected = offers[safeIndex] ?? offers[0] ?? null;
          return {
            ...quote,
            bookingRequestData: selected ?? undefined,
          };
        })()
      : quote;

  const selectedOfferCarId =
    normalizedQuote &&
    normalizedQuote.bookingRequestData &&
    !Array.isArray(normalizedQuote.bookingRequestData)
      ? normalizedQuote.bookingRequestData.carId
      : undefined;

  const canUseQuotePrefill = (() => {
    if (!normalizedQuote) return false;
    if (selectedOfferCarId) {
      return selectedOfferCarId === car.id;
    }
    if (normalizedQuote.carId) {
      return normalizedQuote.carId === car.id;
    }
    return true;
  })();

  return (
    <NoSSR>
      <RentPageClient
        locale={resolvedLocale}
        car={{ id: car.id, seats: car.seats, colors: car.colors }}
        quotePrefill={canUseQuotePrefill ? normalizedQuote : null}
        manageContext={
          rentId
            ? {
                rentId,
                section: manageSection ?? undefined,
                mode: manageMode ?? undefined,
              }
            : undefined
        }
        rentPrefill={rentPrefill ?? undefined}
      />
    </NoSSR>
  );
}
