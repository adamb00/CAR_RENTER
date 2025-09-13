'use client';
import Link from 'next/link';
import { PhotoComposition } from '../ui/photo-composition';
import { useTranslations } from 'next-intl';

export default function AboutSection() {
  const t = useTranslations('AboutSection');
  return (
    <section id='about_section' className='section-about py-20 2xl:mb-32'>
      <div className='u-center-text u-margin-bottom-big text-center mb-16'>
        <h2 className='block text-2xl md:text-4xl font-semibold uppercase leading-10 lg:leading-6 tracking-wide md:tracking-wider text-sky-dark dark:text-sky-light md:mb-44'>
          {t('title')}
        </h2>
      </div>

      <div className='mx-auto max-w-[114rem] px-4 md:px-12'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-x-24 gap-y-12'>
          <div className='place-self-center'>
            <h3 className='uppercase font-extrabold text-lg text-grey-dark-3 text-start mb-2'>
              {t('pickup_title')}
            </h3>
            <p className='text-base text-start md:text-lg text-grey-dark-3 leading-relaxed mb-6'>
              {t('pickup_text')}
            </p>

            <h3 className='uppercase font-extrabold text-lg text-grey-dark-3 text-start mb-2'>
              {t('transfer_title')}
            </h3>
            <p className='text-base text-start md:text-lg text-grey-dark-3 leading-relaxed'>
              {t('transfer_text')}
            </p>

            <Link
              href='/'
              className='btn-text inline-block font-semibold border-b border-current hover:translate-x-1 transition mt-4 text-amber-dark dark:text-amber-light'
            >
              {t('learn_more')}
            </Link>
          </div>

          <div>
            <PhotoComposition
              photos={[
                { src: '/car_1.webp', alt: 'Car 1' },
                { src: '/car_2.webp', alt: 'Car 2' },
                { src: '/car_3.webp', alt: 'Car 3' },
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
