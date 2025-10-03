import Link from 'next/link';
import Logo from '@/components/Logo';
import { getTranslations } from 'next-intl/server';

export default async function RentalRequirements() {
  const t = await getTranslations('RentalRequirements');
  const tf = await getTranslations('Footer');
  return (
    <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 lg:pt-40 mb-10'>
      {/* <Link
        href='/'
        className='absolute -left-8 sm:left-0 md:-left-8 -top-4 sm:top-0 md:-top-8 z-[1200]'
      >
        <Logo size='sm' />
      </Link> */}

      <h1 className='text-3xl uppercase sm:text-4xl md:text-5xl lg:text-6xl leading-relaxed tracking-wide md:tracking-[0.1em] text-center bg-gradient-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
        {t('title')}
      </h1>

      <div className='mt-8 sm:mt-10 text-grey-dark-3 text-base sm:text-lg leading-relaxed space-y-10'>
        <section className='space-y-3'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('general.title')}
          </h2>
          <ul className='list-disc pl-6 space-y-2'>
            <li>{t('general.i1')}</li>
            <li>
              {t('general.i2')}
              <ul className='list-disc pl-6'>
                <li>{t('general.i2a')}</li>
                <li>{t('general.i2b')}</li>
              </ul>
            </li>
            <li>{t('general.i3')}</li>
          </ul>
        </section>

        <section className='space-y-3'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('vehicle.title')}
          </h2>
          <ul className='list-disc pl-6 space-y-2'>
            <li>{t('vehicle.i1')}</li>
            <li>{t('vehicle.i2')}</li>
            <li>{t('vehicle.i3')}</li>
            <li>{t('vehicle.i4')}</li>
            <li>{t('vehicle.i5')}</li>
            <li>{t('vehicle.i6')}</li>
            <li>{t('vehicle.i7')}</li>
            <li>
              {t.rich('vehicle.i8', { strong: (c) => <strong>{c}</strong> })}
            </li>
            <li>{t('vehicle.i9')}</li>
          </ul>
        </section>

        <section className='space-y-3'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('handover.title')}
          </h2>
          <ul className='list-disc pl-6 space-y-2'>
            <li>{t('handover.i1')}</li>
            <li>{t('handover.i2')}</li>
            <li>{t('handover.i3')}</li>
            <li>{t('handover.i4')}</li>
            <li>{t('handover.i5')}</li>
            <li>{t('handover.i6')}</li>
            <li>{t('handover.i7')}</li>
          </ul>
        </section>

        <section className='space-y-3'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('price.title')}
          </h2>
          <ul className='list-disc pl-6 space-y-2'>
            <li>{t('price.i1')}</li>
            <li>{t('price.i2')}</li>
            <li>{t('price.i3')}</li>
            <li>{t('price.i4')}</li>
            <li>{t('price.i5')}</li>
            <li>{t('price.i6')}</li>
            <li>{t('price.i7')}</li>
          </ul>
        </section>

        <section className='space-y-3'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('base_excludes.title')}
          </h2>
          <ul className='list-disc pl-6 space-y-2'>
            <li>{t('base_excludes.i1')}</li>
            <li>{t('base_excludes.i2')}</li>
            <li>{t('base_excludes.i3')}</li>
            <li>{t('base_excludes.i4')}</li>
            <li>{t('base_excludes.i5')}</li>
            <li>{t('base_excludes.i6')}</li>
            <li>{t('base_excludes.i7')}</li>
            <li>{t('base_excludes.i8')}</li>
            <li>{t('base_excludes.i9')}</li>
          </ul>
          <p className='text-sm text-muted-foreground'>
            {t('base_excludes.note')}
          </p>
        </section>

        <section className='space-y-3'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('deposit.title')}
          </h2>
          <ul className='list-disc pl-6 space-y-2'>
            <li>{t('deposit.i1')}</li>
            <li>{t('deposit.i2')}</li>
          </ul>
        </section>

        <section className='space-y-3'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('full.title')}
          </h2>
          <p>{t('full.p1')}</p>
          <p className='text-sm text-muted-foreground'>{t('full.note')}</p>
        </section>

        <section className='space-y-3'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('exceptions.title')}
          </h2>
          <ul className='list-disc pl-6 space-y-2'>
            <li>{t('exceptions.i1')}</li>
            <li>{t('exceptions.i2')}</li>
            <li>{t('exceptions.i3')}</li>
            <li>{t('exceptions.i4')}</li>
            <li>{t('exceptions.i5')}</li>
            <li>{t('exceptions.i6')}</li>
            <li>{t('exceptions.i7')}</li>
            <li>{t('exceptions.i8')}</li>
            <li>{t('exceptions.i9')}</li>
            <li>{t('exceptions.i10')}</li>
          </ul>
        </section>

        <section className='space-y-2'>
          <h2 className='text-xl sm:text-2xl font-extrabold'>
            {t('related.title')}
          </h2>
          <p>
            {t('related.details')}{' '}
            <Link
              href='../insurance'
              className='underline hover:text-amber-dark'
            >
              {tf('insurance')}
            </Link>{' '}
            •{' '}
            <Link
              href='../general-rental-conditions'
              className='underline hover:text-amber-dark'
            >
              {tf('general_rental_conditions')}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
