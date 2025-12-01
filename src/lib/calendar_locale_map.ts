import type { Locale } from 'date-fns';
import {
  cs,
  da,
  de,
  enUS,
  es,
  fr,
  hu,
  it,
  nb,
  pl,
  ro,
  sk,
  sv,
} from 'date-fns/locale';

export const CALENDAR_LOCALE_MAP: Record<string, Locale> = {
  hu,
  en: enUS,
  de,
  ro,
  fr,
  es,
  it,
  sk,
  cz: cs,
  se: sv,
  no: nb,
  dk: da,
  pl,
};
