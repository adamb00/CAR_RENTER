'use client';
import { PhotoComposition } from '../ui/photo-composition';
import { useTranslations } from 'next-intl';

export default function AboutSection() {
  const t = useTranslations('AboutSection');
  return (
    <section className='section-about py-20'>
      <div className='u-center-text u-margin-bottom-big text-center mb-16'>
        <h2 className='block text-2xl md:text-4xl font-semibold uppercase leading-10 lg:leading-6 tracking-wide md:tracking-wider text-sky-dark dark:text-sky-light md:mb-24'>
          {t('title')}
        </h2>
      </div>

      <div className='row mx-auto max-w-[114rem] px-4 md:px-12'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-x-24 gap-y-12'>
          <div>
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

            <a
              href='/'
              className='btn-text inline-block font-semibold border-b border-current hover:translate-x-1 transition mt-4 text-amber-dark dark:text-amber-light'
            >
              {t('learn_more')}
            </a>
          </div>

          <div>
            <PhotoComposition
              p1={{
                src: 'car_1_sm.webp',
                srcSet: 'car_1_sm.webp 300w, car_1.webp 1000w',
                sizes:
                  '(max-width: 56.25em) 20vw, (max-width: 37.5em) 30vw, 300px',
                alt: t('alt1'),
              }}
              p2={{
                src: 'car_2_sm.webp',
                srcSet: 'car_2_sm.webp, 300w, car_2.webp 1000w',
                sizes:
                  '(max-width: 56.25em) 20vw, (max-width: 37.5em) 30vw, 300px',
                alt: t('alt2'),
              }}
              p3={{
                src: 'car_3_sm.webp',
                srcSet: 'car_3_sm.webp, 300w, car_3.webp 1000w',
                sizes:
                  '(max-width: 56.25em) 20vw, (max-width: 37.5em) 30vw, 300px',
                alt: t('alt3'),
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
