// src/i18n/request.ts
import { getRequestConfig, type RequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, type Locale, LOCALES } from './config';

type Messages = Record<string, unknown>;

const loadHu = async () => (await import('../../messages/hu.json')).default;
const loadEs = async () => (await import('../../messages/es.json')).default;
const loadEn = async () => (await import('../../messages/en.json')).default;
const loadIt = async () => (await import('../../messages/it.json')).default;
const loadFr = async () => (await import('../../messages/fr.json')).default;
const loadDe = async () => (await import('../../messages/de.json')).default;
const loadRo = async () => (await import('../../messages/ro.json')).default;
const loadSk = async () => (await import('../../messages/sk.json')).default;
const loadCz = async () => (await import('../../messages/cz.json')).default;
const loadSe = async () => (await import('../../messages/se.json')).default;
const loadNo = async () => (await import('../../messages/no.json')).default;
const loadDk = async () => (await import('../../messages/dk.json')).default;
const loadPl = async () => (await import('../../messages/pl.json')).default;

const MESSAGE_LOADERS: Record<Locale, () => Promise<Messages>> = {
  hu: loadHu,
  es: loadEs,
  en: loadEn,
  ro: loadRo,
  sk: loadSk,
  cz: loadCz,
  fr: loadFr,
  se: loadSe,
  no: loadNo,
  dk: loadDk,
  it: loadIt,
  de: loadDe,
  pl: loadPl,
};

export default getRequestConfig(async ({ requestLocale }) => {
  // Next-Intl 3.x: requestLocale egy Promise<string | undefined>
  const maybe = await requestLocale;

  const finalLocale: Locale =
    maybe && (LOCALES as readonly string[]).includes(maybe)
      ? (maybe as Locale)
      : DEFAULT_LOCALE;

  const loader =
    MESSAGE_LOADERS[finalLocale] ?? MESSAGE_LOADERS[DEFAULT_LOCALE];
  const messages = await loader();

  return { locale: finalLocale, messages } satisfies RequestConfig;
});
