// src/i18n/request.ts
import { getRequestConfig, type RequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, type Locale, LOCALES } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // Next-Intl 3.x: requestLocale egy Promise<string | undefined>
  const maybe = await requestLocale;

  const finalLocale: Locale =
    maybe && (LOCALES as readonly string[]).includes(maybe)
      ? (maybe as Locale)
      : DEFAULT_LOCALE;

  const messages = (await import(`../../messages/${finalLocale}.json`)).default;

  return { locale: finalLocale, messages } satisfies RequestConfig;
});
