'use client';
import { SplittingText } from '@/components/ui/shadcn-io/splitting-text';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export function Header() {
  // Clip-path az eredetihez igazítva
  const clip = 'polygon(0 0, 100% 0, 100% 75vh, 0 90%)';
  const t = useTranslations('Header');
  const { locale } = useParams();

  return (
    <header
      className={clsx(
        'relative h-[95vh] isolate overflow-hidden bg-top bg-cover'
      )}
      style={{
        // alap háttér: kiskép + gradiens
        backgroundImage: `
          linear-gradient(to right bottom, var(--color-primary)/0.8, var(--primary)/0.8),
          url('/header_image.webp')
        `,
        // clip-path (webkit is támogatva)
        clipPath: clip,
        WebkitClipPath: clip,
      }}
    >
      {/* Nagy felbontású/desktop háttér (media query alapú csere) */}
      <picture>
        <source
          media='(min-resolution: 192dpi) and (min-width: 600px), (min-width: 2000px)'
          srcSet={'/header_image.webp'}
        />
        {/* Képfedő réteg a bg-image helyett → megbízhatóbb reszponzivitás */}
        <img
          src={'/header_image.webp'}
          alt=''
          className='absolute inset-0 h-full w-full object-cover'
        />
      </picture>

      {/* Gradiens overlay (a saját változóidra támaszkodva) */}
      <div className='absolute inset-0 bg-gradient-to-br from-[var(--amber-light)]/70 to-[var(--sky-dark)]/70' />

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
