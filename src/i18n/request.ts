// src/i18n/request.ts
import { getRequestConfig, type RequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, Locale, LOCALES } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  const maybe = (await requestLocale) as string | undefined;
  const finalLocale: Locale =
    maybe && (LOCALES as readonly string[]).includes(maybe)
      ? (maybe as Locale)
      : DEFAULT_LOCALE;

  // request.ts a src/i18n alatt van → a messages a projekt GYÖKERÉBEN legyen
  const messages = (await import(`../../messages/${finalLocale}.json`)).default;

  return { locale: finalLocale, messages } satisfies RequestConfig;
});
