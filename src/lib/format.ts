import { BookingDataKey } from '@/app/[locale]/rent/thank-you/thank-you.types';
import { Prisma } from '@prisma/client';
import { BOOKING_DATA_FIELDS } from './constants';
import { getTranslations } from 'next-intl/server';

export const formatFriendlyDate = (
  value?: string | null,
  locale?: string
): string => {
  if (!value) return 'n/a';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(locale ?? 'en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatAddress = (address?: {
  country?: string | null;
  postalCode?: string | null;
  city?: string | null;
  street?: string | null;
  streetType?: string | null;
  doorNumber?: string | null;
}): string => {
  if (!address) return 'n/a';
  const streetParts = [address.street, address.streetType]
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .join(' ');
  const parts = [
    address.postalCode,
    address.city,
    streetParts,
    address.doorNumber,
    address.country,
  ]
    .filter(
      (segment) => typeof segment === 'string' && segment.trim().length > 0
    )
    .map((segment) => (segment as string).trim());
  return parts.length > 0 ? parts.join(', ') : 'n/a';
};

export const normalizeRowValue = (value?: string | null): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : 'n/a';
  }
  return 'n/a';
};

export const formatExtrasLabel = (
  extras: unknown,
  translateRentForm: Awaited<ReturnType<typeof getTranslations>>
): string => {
  if (!Array.isArray(extras) || extras.length === 0) {
    return 'n/a';
  }
  return extras
    .filter((extra): extra is string => typeof extra === 'string')
    .map((extra) => {
      try {
        return translateRentForm(`extras.options.${extra}`);
      } catch {
        return extra.replace(/_/g, ' ');
      }
    })
    .join(', ');
};

export const formatDeliveryType = (
  type: unknown,
  translateRentForm: Awaited<ReturnType<typeof getTranslations>>
): string => {
  if (type === 'airport') {
    return translateRentForm('sections.delivery.fields.placeType.airport');
  }
  if (type === 'accommodation') {
    return translateRentForm(
      'sections.delivery.fields.placeType.accommodation'
    );
  }
  return typeof type === 'string' && type.trim().length > 0 ? type : 'n/a';
};

export const parseBookingData = (
  raw: Prisma.JsonValue | null | undefined
): Partial<Record<BookingDataKey, string>> => {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const record = raw as Record<string, unknown>;
  const result: Partial<Record<BookingDataKey, string>> = {};
  BOOKING_DATA_FIELDS.forEach((key) => {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      result[key] = value.trim();
    }
  });
  return result;
};

export const parseDateValue = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const segments = value.split('-');
  if (segments.length !== 3) return undefined;
  const [yearRaw, monthRaw, dayRaw] = segments;
  const year = Number.parseInt(yearRaw, 10);
  const month = Number.parseInt(monthRaw, 10);
  const day = Number.parseInt(dayRaw, 10);
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return undefined;
  }
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date;
};

export const formatDateValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
