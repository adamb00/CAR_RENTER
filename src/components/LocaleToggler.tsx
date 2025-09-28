'use client';

import { Button } from '@/components/ui/button';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { LOCALES, Locale } from '@/i18n/config';
import { useTranslations } from 'next-intl';

const FLAGS: Record<Locale, string> = {
  hu: '🇭🇺',
  en: '🇬🇧',
  de: '🇩🇪',
  ro: '🇷🇴',
  sk: '🇸🇰',
  cz: '🇨🇿',
  fr: '🇫🇷',
  se: '🇸🇪',
  no: '🇳🇴',
  dk: '🇩🇰',
  es: '🇪🇸',
  it: '🇮🇹',
  pl: '🇵🇱',
};

const LABELS: Record<Locale, string> = {
  hu: 'Magyar',
  en: 'English',
  de: 'Deutsch',
  ro: 'Română',
  sk: 'Slovenčina',
  cz: 'Čeština',
  fr: 'Français',
  se: 'Svenska',
  no: 'Norsk',
  dk: 'Dansk',
  es: 'Español',
  it: 'Italiano',
  pl: 'Polski',
};

function replaceLocaleInPath(pathname: string, next: Locale) {
  const parts = pathname.split('/');
  if (parts.length > 1) {
    parts[1] = next;
    const joined = parts.join('/');
    return joined || `/${next}`;
  }
  return `/${next}`;
}

export function LocaleToggle({ current }: { current?: string }) {
  const t = useTranslations('LocaleToggle');
  const router = useRouter();
  const pathname = usePathname() || '/hu';
  const search = useSearchParams();
  const [mounted, setMounted] = useState<boolean>(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => setMounted(true), []);

  const active: Locale = useMemo(() => {
    const prop = (current || '').toLowerCase();
    if (LOCALES.includes(prop as Locale)) return prop as Locale;
    const seg = pathname.split('/')[1]?.toLowerCase();
    return LOCALES.includes(seg as Locale) ? (seg as Locale) : 'hu';
  }, [current, pathname]);

  function buildUrl(next: Locale) {
    const newPath = replaceLocaleInPath(pathname, next);
    const qs = search.toString();
    return qs ? `${newPath}?${qs}` : newPath;
  }

  async function persistLocale(next: Locale) {
    try {
      await fetch('/api/set-locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: next }),
      });
    } catch {
      /* nem kritikus */
    }
  }

  function change(next: Locale) {
    const href = buildUrl(next);
    startTransition(() => {
      void persistLocale(next);
      router.replace(href);
      router.refresh();
    });
  }

  if (!mounted) return null; // elkerüli a hydration eltérést

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          disabled={pending}
          aria-label={t('ariaLabel')}
          className='gap-2 rounded-full shadow-lg !bg-background !text-foreground z-[2400]'
        >
          <span className='text-base leading-none'>{FLAGS[active]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-44 z-[2400]'>
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => change(l)}
            className={l === active ? 'bg-accent/60 focus:bg-accent/60' : ''}
          >
            <span className='mr-2'>{FLAGS[l]}</span>
            <span>{LABELS[l]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
