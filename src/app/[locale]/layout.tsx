'use server';
import { CookieConsent } from '@/components/cookie-consent';
import { GoogleMapsScript } from '@/components/GoogleMapsScript';
import Footer from '@/components/layout/Footer';
import { LocaleToggle } from '@/components/LocaleToggler';
import { Navigation } from '@/components/navigation/Navigation';
import { StructuredData } from '@/components/seo/StructuredData';
import { ThemeToggle } from '@/components/ThemeToggler';
import WhatsAppContainer from '@/components/WhatsAppContainer';
import { DEFAULT_LOCALE, Locale, LOCALES } from '@/i18n/config';
import { ThemeProvider } from '@/providers/theme';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { ReactNode, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';

export async function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: l }));
}

export default async function LocaleLayout(props: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { children } = props;
  const { locale } = await props.params;

  const safeLocale: Locale = LOCALES.includes(locale as Locale)
    ? (locale as Locale)
    : DEFAULT_LOCALE;

  setRequestLocale(safeLocale);

  const messages = await getMessages({ locale: safeLocale });

  return (
    <NextIntlClientProvider locale={safeLocale} messages={messages}>
      <StructuredData locale={safeLocale} />
      <GoogleMapsScript locale={safeLocale} />
      <div className='app-shell p-2 md:p-8 lg:p-12'>
        <ThemeProvider>
          {/* Navigation is responsible for desktop navbar + mobile hamburger */}
          <Navigation />
          {/* Mobile-only locale + theme toggles (hidden on md and up) */}
          <div
            className='fixed xl:hidden z-[2200] flex items-center gap-2'
            style={{
              top: 'calc(env(safe-area-inset-top, 0px) + 18px)',
              right: 'calc(env(safe-area-inset-right, 0px) + 88px)',
            }}
          >
            <Suspense fallback={null}>
              <LocaleToggle />
            </Suspense>
            <ThemeToggle />
          </div>
          {children}
          <Toaster position='bottom-right' reverseOrder={false} />
          <WhatsAppContainer />
          <CookieConsent variant='default' />

          <Footer />
        </ThemeProvider>
      </div>
    </NextIntlClientProvider>
  );
}
