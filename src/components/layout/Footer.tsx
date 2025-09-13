'use client';
import React from 'react';
import { Copyright } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const t = useTranslations('Footer');
  const currentYear = new Date().getFullYear();
  const pathname = usePathname() || '/hu';

  const locale = pathname.split('/')[1];
  return (
    <footer className='bg-grey-dark-3 dark:bg-grey-light-2 min-w-max text-grey-light-1 dark:text-grey-dark-2 px-[4rem] py-[6rem] rounded-b-lg flex flex-col items-center justify-center gap-10'>
      <div>{t('logo_placeholder')}</div>
      <div className='grid grid-cols-1 lg:grid-cols-2 w-full gap-10'>
        <div className='border-t pt-2 inline-block w-[100%] text-center'>
          <ul className='list-none flex gap-x-2 p-0 items-center justify-evenly'>
            <li className='footer__list'>
              <a href={`/${locale}`}>{t('home')}</a>
            </li>
            <li className='footer__list'>
              <a href='/about-us'>{t('about')}</a>
            </li>
            <li className='footer__list'>
              <a href='/contact'>{t('contact')}</a>
            </li>
            <li className='footer__list'>
              <a href='/offices'>{t('offices')}</a>
            </li>
            <li className='footer__list'>
              <a href='/fleet'>{t('fleet')}</a>
            </li>
          </ul>
        </div>
        <div className='sm:border-t sm:pt-2 flex w-[100%] text-center items-center justify-center'>
          <div className='flex items-center gap-x-1 text-sm'>
            <Copyright size={16} />
            {currentYear} | {t('fuerte_car_rental')}
          </div>
        </div>
      </div>
    </footer>
  );
}
