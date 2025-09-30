'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Copyright } from 'lucide-react';
import logo from '../../../public/logo_white.png';
import Logo from '../Logo';

export default function Footer() {
  const t = useTranslations('Footer');
  const pathname = usePathname() || '/hu';
  const locale = (pathname.split('/')[1] || 'hu').toLowerCase();
  const year = new Date().getFullYear();

  const nav = [
    { href: `/${locale}`, label: t('home') },
    { href: `/${locale}/about-us`, label: t('about') },
    { href: `/${locale}/contact`, label: t('contact') },
    { href: `/${locale}/offices`, label: t('offices') },
    { href: `/${locale}/cars`, label: t('fleet') },
  ];

  return (
    <footer
      className='
        w-full
        bg-grey-dark-3 text-grey-light-1
        dark:bg-grey-light-2 dark:text-grey-dark-2
      '
    >
      <div className='mx-auto max-w-screen-xl px-4 py-10 sm:px-6 md:py-12 lg:px-8'>
        {/* Felső sor: logó / márka */}
        <div className='flex items-center justify-center'>
          <Logo logo={logo} />
        </div>

        <div className='grid grid-cols-1 items-start justify-center place-items-center md:grid-cols-2 md:gap-10'>
          {/* Navigáció */}
          <nav
            aria-label='Footer'
            className='
              mt-6 md:mt-8
              border-t border-grey-light-2/50 dark:border-grey-dark-2/30
              pt-4 md:pt-6 w-full 
            '
          >
            <ul
              className='
              flex flex-wrap items-center justify-center
              text-xs sm:text-[0.95rem] md:text-base md:gap-4
            '
            >
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className='
                    inline-block rounded-md px-2 py-1
                    transition-colors
                    hover:text-amber-dark dark:hover:text-amber-light
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                    focus-visible:ring-amber-dark/50 dark:focus-visible:ring-amber-light/50
                    focus-visible:ring-offset-transparent
                  '
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Alsó sor: jogi / copyright */}
          <div
            className='
              mt-6 md:mt-8
              flex flex-col-reverse items-center justify-center gap-4
              border-t border-grey-light-2/50 dark:border-grey-dark-2/30 pt-4 md:pt-6
              md:flex-row w-full 
            '
          >
            <p className='flex items-center gap-2 text-xs sm:text-sm'>
              <Copyright className='h-4 w-4' aria-hidden='true' />
              <span>
                {year} • {t('zodiac_car_rental')}
              </span>
            </p>

            {/* (Opció) közösségi ikonok helye – később könnyen bővíthető */}
            <div className='flex items-center gap-3 sm:gap-4'>
              {/* Példák placeholder linkekre:
            <Link href="https://facebook.com" aria-label="Facebook" className="hover:opacity-80 transition-opacity">
              <Facebook className="h-5 w-5" />
            </Link>
            <Link href="https://instagram.com" aria-label="Instagram" className="hover:opacity-80 transition-opacity">
              <Instagram className="h-5 w-5" />
            </Link>
            */}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
