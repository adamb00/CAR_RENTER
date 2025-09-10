// src/components/HamburgerMenu.tsx
'use client';

import { useEffect, useId, useState } from 'react';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';

type Item = { href: string; label: string; prefix?: string };

export function Navigation({ items }: { items?: Item[] }) {
  const t = useTranslations('Navigation');
  const [open, setOpen] = useState<boolean>(false);
  const ctrlId = useId();

  // Body scroll lock nyitáskor
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* FIXED WRAPPER: a gomb és a kör közös referenciában */}
      <div
        className='fixed z-[2000] '
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
          right: 'calc(env(safe-area-inset-right, 0px) + 1rem)',
        }}
      >
        {/* Táguló háttérkör: mindig a gomb közepe */}
        <div
          aria-hidden
          className={clsx(
            'pointer-events-none absolute inset-0',
            'grid place-items-center'
          )}
        >
          <div
            className={clsx(
              'h-12 w-12 sm:h-14 sm:w-14 rounded-full',
              'transition-transform duration-[800ms] ease-[cubic-bezier(0.86,0,0.07,1)]',
              open ? 'scale-[120]' : 'scale-0',
              'origin-center'
            )}
            style={{
              backgroundImage:
                'radial-gradient(var(--color-primary), var(--primary))',
            }}
          />
        </div>

        {/* Trigger button */}
        <button
          type='button'
          aria-controls={ctrlId}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={clsx(
            'relative z-[2100] h-14 w-14 sm:h-16 sm:w-16 rounded-full',
            'flex items-center justify-center',
            'border border-border shadow-lg',
            'bg-card text-card-foreground'
          )}
        >
          {/* Ikon – 3 csík → X középre igazítva */}
          <span className='relative block h-5 w-8' aria-hidden>
            {/* középső */}
            <span
              className={clsx(
                'absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-8 rounded bg-foreground',
                'transition-all duration-200',
                open ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'
              )}
            />
            {/* felső */}
            <span
              className={clsx(
                'absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-8 rounded bg-foreground',
                'transition-all duration-200',
                open ? 'rotate-45' : '-translate-y-2'
              )}
            />
            {/* alsó */}
            <span
              className={clsx(
                'absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-8 rounded bg-foreground',
                'transition-all duration-200',
                open ? '-rotate-45' : 'translate-y-2'
              )}
            />
          </span>
          <span className='sr-only'>{t('menu_sr')}</span>
        </button>
      </div>

      {/* TELJES KÉPERNYŐS MENÜ – középre igazítva, nem csúszik */}
      <nav
        id={ctrlId}
        aria-hidden={!open}
        className={clsx(
          'fixed inset-0 z-[1500] transition-opacity duration-500',
          open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
      >
        <div className='absolute inset-0' aria-hidden />
        <ul
          className={clsx(
            'grid place-items-center h-dvh w-dvw text-center px-6'
          )}
        >
          {(
            items || [
              { href: '#about', label: t('items.about'), prefix: '01' },
              { href: '#benefits', label: t('items.benefits'), prefix: '02' },
              { href: '#popular', label: t('items.popular'), prefix: '03' },
              { href: '#stories', label: t('items.stories'), prefix: '04' },
              { href: '#book', label: t('items.book'), prefix: '05' },
            ]
          ).map((it, i) => (
            <li key={it.href + i} className='my-3 sm:my-4'>
              <a
                href={it.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'inline-block uppercase no-underline',
                  'text-2xl sm:text-4xl font-light',
                  'px-4 py-3',
                  'text-white',
                  'transition-[color,background-position,transform] duration-300',
                  'bg-[length:220%_100%] bg-right',
                  'hover:bg-left hover:text-primary'
                )}
                style={{
                  backgroundImage:
                    'linear-gradient(120deg, transparent 0%, transparent 50%, rgba(255,255,255,1) 50%)',
                }}
              >
                {it.prefix && (
                  <span className='mr-4 inline-block opacity-80'>
                    {it.prefix}
                  </span>
                )}
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
