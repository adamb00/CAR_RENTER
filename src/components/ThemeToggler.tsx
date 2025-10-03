'use client';

import { useTheme } from 'next-themes';
import { useCallback, useEffect, useState } from 'react';
import { ThemeToggleButton } from './ui/shadcn-io/theme-toggle-button';
import { useThemeTransition } from '@/hooks/useThemeTransition';
import { Mode } from '@/types/theme';
import { useSettings } from '@/hooks/useSettings';

export function ThemeToggle() {
  const { setTheme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { startTransition } = useThemeTransition();
  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const handleThemeToggle = useCallback(() => {
    const newMode: Mode = settings.mode === 'dark' ? 'light' : 'dark';

    startTransition(() => {
      const updatedSettings = {
        ...settings,
        mode: newMode,
        theme: {
          ...settings.theme,
          styles: {
            light: settings.theme.styles?.light || {},
            dark: settings.theme.styles?.dark || {},
          },
        },
      };
      updateSettings(updatedSettings);
      setTheme(newMode);
    });
  }, [settings, updateSettings, setTheme, startTransition]);
  const currentTheme =
    settings.mode === 'system' ? 'light' : (settings.mode as 'light' | 'dark');
  if (!mounted) {
    return null;
  }

  return (
    <ThemeToggleButton
      theme={currentTheme}
      onClick={handleThemeToggle}
      className='shadow-lg !bg-background xl:!bg-sky-light/70 !text-foreground z-[2400] lg:!cursor-pointer'
      variant='polygon'
      start='center'
    />
  );
}
