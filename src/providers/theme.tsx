// src/providers/theme.tsx

import { ThemeProvider as NextThemes } from 'next-themes';

export async function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemes
      attribute='class' // <html class="dark"> kezelése
      defaultTheme='system' // ne fix “light”-ra SSR-en
      enableSystem
      storageKey='theme' // opcionális, de jó ha egységes
    >
      {children}
    </NextThemes>
  );
}
