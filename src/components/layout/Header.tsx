'use client';
import { SplittingText } from '@/components/ui/shadcn-io/splitting-text';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import HeaderCarousel from './HeaderCarousel';

export function Header() {
  const clip = 'polygon(0 0, 100% 0, 100% 75vh, 0 90%)';
  const t = useTranslations('Header');
  const { locale } = useParams();

  return (
    <header
      className={clsx(
        'relative h-[95vh] isolate overflow-hidden bg-top bg-cover'
      )}
      style={{
        clipPath: clip,
        WebkitClipPath: clip,
      }}
    >
      <HeaderCarousel />

      <div className='absolute inset-0 bg-linear-to-br from-(--amber-light)/30 to-(--sky-dark)/30' />

      {/* Középre igazított tartalom */}
      <div className='absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 text-center px-4 w-full'>
        <h1 className='font-light uppercase text-white drop-shadow text-center'>
          <span className='block text-5xl sm:text-5xl md:text-7xl font-bold leading-tight tracking-[0.3em] text-center'>
            <SplittingText
              text='ZODIACS'
              type='words'
              inView={true}
              motionVariants={{
                initial: { opacity: 0, x: 100 },
                animate: { opacity: 1, x: 0 },
                transition: { duration: 0.5 },
                stagger: 0.1,
              }}
            />
          </span>
          <span className='mt-3 block text-base sm:text-sm md:text-lg font-semibold tracking-[0.3em] opacity-90 text-center'>
            <SplittingText
              text={t('header')}
              type='words'
              inView={true}
              motionVariants={{
                initial: { opacity: 0, x: 100 },
                animate: { opacity: 1, x: 0 },
                transition: { duration: 0.5 },
                stagger: 0.1,
              }}
            />
          </span>
        </h1>

        <a
          href={`/${locale}/cars`}
          className='mt-8 inline-block rounded-full dark:text-sky-dark text-sky-dark bg-white/90 px-8 py-3 text-sm font-medium uppercase tracking-wide shadow-lg transition hover:bg-white'
        >
          {t('book_now')}
        </a>
      </div>
    </header>
  );
}
