'use client';

import { Suspense, useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import logo from '../../../public/logo_white.png';
import Logo from '../Logo';
import { LocaleToggle } from '@/components/LocaleToggler';
import { ThemeToggle } from '@/components/ThemeToggler';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import logo_black from '../../../public/logo_black.png';
import logo_white from '../../../public/logoo.png';

export function Navigation() {
  const t = useTranslations('Navigation');
  const [open, setOpen] = useState<boolean>(false);
  const pathname = usePathname() || '/hu';
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ctrlId = useId();
  const locale = pathname.split('/')[1];

  const image = mounted && resolvedTheme === 'light' ? logo_black : logo_white;

  const normalizeHref = (path: string) => {
    if (path === '/' || path === '') return `/${locale}`;
    return `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const itemsMap = [
    { href: normalizeHref('/'), label: t('home'), prefix: '01' },
    { href: normalizeHref('/cars'), label: t('cars'), prefix: '02' },
    { href: normalizeHref('/about-us'), label: t('about'), prefix: '03' },
    { href: normalizeHref('/blog'), label: t('blog'), prefix: '04' },
    { href: normalizeHref('/contact'), label: t('contact'), prefix: '05' },
  ];

  // Body scroll lock nyitáskor
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Desktop navbar: hide on scroll down, show on slight scroll up (only lg+)
  const [navHidden, setNavHidden] = useState(false);
  const lastYRef = useRef<number>(0);
  const mqRef = useRef<MediaQueryList | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    mqRef.current = window.matchMedia('(min-width: 1024px)');
    lastYRef.current = window.scrollY || 0;
    const onScroll = () => {
      if (!mqRef.current?.matches) return;
      const y = window.scrollY || 0;
      const delta = y - lastYRef.current;
      if (delta > 6 && y > 80) {
        setNavHidden(true);
      } else if (delta < -6) {
        setNavHidden(false);
      }
      lastYRef.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* DESKTOP NAVBAR (md and up) */}
      <nav
        suppressHydrationWarning
        className={clsx(
          'hidden xl:flex fixed z-[2400] left-1/2 -translate-x-1/2',
          'transition-all duration-300 max-h-[5rem]',
          navHidden
            ? '-top-24 opacity-0 pointer-events-none'
            : 'top-4 opacity-100 max-h-[5rem]',
          'w-[92%] max-w-6xl items-center justify-between rounded-full',
          'bg-sky-light/80 backdrop-blur supports-[backdrop-filter]:bg-sky-light/70',
          'px-4 shadow-lg max-h-[5rem]'
        )}
      >
        <a
          href={normalizeHref('/')}
          className='flex items-center gap-2 px-2 py-1'
        >
          {mounted ? (
            <Image
              src={image}
              alt='Logo'
              width={150}
              height={150}
              priority={false}
              style={{ width: 'auto', height: 'auto' }}
            />
          ) : (
            <span
              aria-hidden
              style={{ width: 150, height: 150, display: 'inline-block' }}
            />
          )}
        </a>
        <div className='flex items-center gap-2 lg:gap-4 pr-2'>
          <ul className='flex items-center gap-2 lg:gap-4'>
            {itemsMap.map((it, i) => (
              <li key={it.href + i}>
                <a
                  href={it.href}
                  className={clsx(
                    'inline-block rounded-full px-3 py-2 text-grey-dark-3 tracking-wide dark:text-white text-sm lg:text-lg uppercase transition-colors',
                    'hover:bg-white/60 dark:hover:bg-sky-dark/30'
                  )}
                >
                  {it.label}
                </a>
              </li>
            ))}
          </ul>
          <div className='h-6 w-px bg-border mx-1 lg:mx-2' aria-hidden />
          <Suspense fallback={null}>
            <LocaleToggle />
          </Suspense>
          <ThemeToggle />
        </div>
      </nav>

      {/* MOBILE: hamburger trigger + expanding circle (md hidden) */}
      <div
        className='fixed z-[2400] xl:hidden'
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
                'radial-gradient(var(--color-sky-dark), var(--color-sky-light))',
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
            'relative z-[2400] h-14 w-14 sm:h-16 sm:w-16 rounded-full',
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
          <span className='sr-only'>
            {(() => {
              try {
                return t('menu_sr');
              } catch {
                return 'Menu';
              }
            })()}
          </span>
        </button>
      </div>

      {/* TELJES KÉPERNYŐS MENÜ – középre igazítva, nem csúszik (md hidden) */}
      <nav
        suppressHydrationWarning
        id={ctrlId}
        aria-hidden={!open}
        className={clsx(
          'xl:hidden fixed inset-0 z-[2400] transition-opacity duration-500 flex items-center justify-center h-[50%] top-[50%] -translate-y-[50%]',
          open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
      >
        <div className='absolute inset-0' aria-hidden />
        <ul className={'flex flex-col items-center justify-center text-center'}>
          <Logo logo={logo} size='lg' />
          {itemsMap.map((it, i) => (
            <li key={it.href + i} className='my-3 sm:my-4 z-[2500]'>
              <a
                href={it.href}
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                className={
                  'inline-block uppercase no-underline text-2xl sm:text-4xl font-light px-4 py-3 text-white transition-colors duration-300 hover:bg-white hover:text-sky-dark'
                }
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
