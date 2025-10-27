import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('NotFound');

  return (
    <main className='min-h-screen bg-gradient-to-br from-sky-dark/80 via-amber-dark/70 to-sky-dark/80 text-slate-100 flex items-center justify-center px-4 py-16'>
      <div className='w-full max-w-6xl rounded-3xl bg-white/10 backdrop-blur-md shadow-2xl ring-1 ring-white/10 overflow-hidden'>
        <div className='grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center'>
          <section className='px-8 py-12 lg:px-14 lg:py-16 flex flex-col gap-6'>
            <span className='text-sm uppercase tracking-[0.35em] text-amber-dark/90'>
              {t('label')}
            </span>
            <h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold uppercase leading-tight tracking-[0.1em] text-white'>
              {t('title')}
            </h1>
            <p className='text-base sm:text-lg text-slate-200/90 max-w-prose'>
              {t('description')}
            </p>

            <div className='flex flex-col sm:flex-row gap-4 pt-4'>
              <Link
                href={`/${t('cta.home.href')}`}
                className='inline-flex items-center justify-center rounded-full bg-white text-sky-dark px-6 py-3 text-sm font-semibold tracking-wide transition hover:bg-amber-light hover:text-sky-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/60'
              >
                {t('cta.home.label')}
              </Link>
              <Link
                href={`/${t('cta.contact.href')}`}
                className='inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-3 text-sm font-semibold tracking-wide text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/60'
              >
                {t('cta.contact.label')}
              </Link>
            </div>
          </section>

          <section className='relative h-full min-h-[18rem] lg:min-h-[24rem] bg-gradient-to-br from-white/15 via-transparent to-white/5 flex items-center justify-center'>
            <div className='absolute inset-6 rounded-[2rem] border border-white/15 bg-white/5' />
            <div className='relative z-10 flex flex-col items-center text-center gap-3'>
              <span className='text-7xl font-black tracking-[0.35em] text-white/90 drop-shadow-lg'>
                404
              </span>
              <p className='text-sm uppercase tracking-[0.4em] text-white/70'>
                {t('badge')}
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
