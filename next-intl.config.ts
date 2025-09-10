import { DEFAULT_LOCALE, Locale, LOCALES } from '@/i18n/config';
import { getRequestConfig, type RequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  const maybe = (await requestLocale) as string | undefined;
  const finalLocale: Locale =
    maybe && (LOCALES as readonly string[]).includes(maybe)
      ? (maybe as Locale)
      : DEFAULT_LOCALE;

  const messages = (await import(`./messages/${finalLocale}.json`)).default;
  return { locale: finalLocale, messages } satisfies RequestConfig;
});
