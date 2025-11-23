import React from 'react';
import { useTranslations } from 'next-intl';

export default function Explore() {
  const t = useTranslations('Explore');
  return (
    <div className='min-h-max h-full bg-gradient-to-br from-[var(--sky-dark)]/70 to-[var(--amber-light)]/70 -skew-y-10 md:-skew-y-6 flex-col flex items-center gap-10 justify-center p-2 md:p-10 py-20 md:py-40 my-40'>
      <div className='skew-y-10 md:skew-y-6 flex flex-col items-center justify-center min-h-max text-center p-0 md:p-6 gap-6'>
        <h3 className='block text-2xl md:text-4xl font-semibold uppercase leading-12 tracking-normal md:tracking-wider text-sky-dark dark:text-sky-light'>
          {t('title')}
        </h3>
        <h4 className='block text-xl md:text-2xl font-semibold uppercase leading-8 tracking-wide md:tracking-widest text-grey-light-1 dark:text-sky-light'>
          {t('subtitle')}
        </h4>
      </div>
      <div className='skew-y-10 md:skew-y-6 grid grid-cols-1 lg:grid-cols-3 gap-10 p-3'>
        <div className='bg-grey-light-1/80 rounded-lg max-w-[30rem] min-h-[20rem] lg:min-h-[30rem] flex flex-col justify-center items-center'>
          <i className='icon-basic-map text-[4rem] inline-block bg-clip-text text-transparent bg-gradient-to-br from-[var(--sky-dark)]/70 to-[var(--amber-light)]/70'></i>
          <p className='flex flex-col items-center justify-center min-h-max text-center p-6 gap-3 text-lg leading-8 text-grey-dark-1'>
            {t('cards.map')}
          </p>
        </div>
        <div className='bg-grey-light-1/80 rounded-lg max-w-[30rem] min-h-[20rem] lg:min-h-[30rem] flex flex-col justify-center items-center'>
          <i className='icon-basic-globe text-[4rem] inline-block bg-clip-text text-transparent bg-gradient-to-br from-[var(--sky-dark)]/70 to-[var(--amber-light)]/70'></i>
          <p className='flex flex-col items-center justify-center min-h-max text-center p-6 gap-3 text-lg leading-8 text-grey-dark-1'>
            {t('cards.globe')}
          </p>
        </div>
        <div className='bg-grey-light-1/80 rounded-lg max-w-[30rem] min-h-[20rem] lg:min-h-[30rem] flex flex-col justify-center items-center'>
          <i className='icon-basic-heart text-[4rem] inline-block bg-clip-text text-transparent bg-gradient-to-br from-[var(--sky-dark)]/70 to-[var(--amber-light)]/70'></i>
          <p className='flex flex-col items-center justify-center min-h-max text-center p-6 gap-3 text-lg leading-8 text-grey-dark-1'>
            {t('cards.heart')}
          </p>
        </div>
      </div>
    </div>
  );
}
