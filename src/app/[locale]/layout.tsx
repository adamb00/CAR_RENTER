'use server';
import '@/app/_style/globals.css';
import Footer from '@/components/layout/Footer';
import { LocaleToggle } from '@/components/LocaleToggler';
import { Navigation } from '@/components/navigation/Navigation';
import { ThemeToggle } from '@/components/ThemeToggler';
import { Locale, LOCALES } from '@/i18n/config';
import { ThemeProvider } from '@/providers/theme';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ReactNode } from 'react';

export async function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: l }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const safeLocale: Locale = (
    LOCALES.includes(locale as Locale) ? locale : LOCALES[0]
  ) as Locale;

  const messages = await getMessages();

  return (
    <html lang={safeLocale} suppressHydrationWarning>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <body className='antialiased '>
          <div className='app-shell p-2 md:p-8 lg:p-12'>
            <ThemeProvider>
              <div
                className='fixed z-[2200] flex items-center gap-2'
                style={{
                  top: 'calc(env(safe-area-inset-top, 0px) + 18px)',
                  right: 'calc(env(safe-area-inset-right, 0px) + 88px)',
                }}
              >
                <Navigation />
                <LocaleToggle />
                <ThemeToggle />
              </div>
              {children}
              <Footer />
            </ThemeProvider>
          </div>
        </body>
      </NextIntlClientProvider>
    </html>
  );
}
