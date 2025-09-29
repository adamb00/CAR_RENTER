import { SplittingText } from '@/components/ui/shadcn-io/splitting-text';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function page() {
  const t = await getTranslations('AboutUs');
  return (
    <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
      <span className='block text-5xl sm:text-5xl md:text-7xl font-bold leading-tight tracking-[0.3em] text-center my-20 bg-gradient-to-r from-sky-light/90 to-sky-dark/80 bg-clip-text text-transparent'>
        {t('headline')}
      </span>

      <div className='mb-6'>
        <h2 className='text-lg sm:text-xl md:text-2xl leading-relaxed text-center text-grey-dark-3'>
          {t.rich('intro', { strong: (chunks) => <strong>{chunks}</strong> })}
        </h2>
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-2 my-16 sm:my-20 gap-8 lg:gap-12 items-center justify-center'>
        <div className='lg:order-none flex flex-col gap-6 sm:gap-8 md:gap-10 px-2 sm:px-4 md:px-6'>
          <div className='mb-6 order-1'>
            <h3 className='uppercase font-extrabold text-base sm:text-lg md:text-xl text-grey-dark-3 text-start mb-2'>
              {t('why_title')}
            </h3>
            <p className='text-sm sm:text-base leading-relaxed text-grey-dark-1'>
              {t('why_text')}
            </p>
          </div>
          <div className='mb-6 order-3'>
            <h3 className='uppercase font-extrabold text-base sm:text-lg md:text-xl text-grey-dark-3 text-start mb-2'>
              {t('fleet_title')}
            </h3>
            <p className='text-sm sm:text-base leading-relaxed text-grey-dark-1'>
              {t.rich('fleet_text', {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          </div>
        </div>
        <div className='order-2 lg:order-none relative w-full rounded-md overflow-hidden min-h-[16rem] sm:min-h-[20rem] md:min-h-[24rem] lg:min-h-[28rem]'>
          <Image
            src='/cars.webp'
            fill
            sizes='(min-width: 1024px) 50vw, 100vw'
            alt={'car'}
            className='h-full w-full object-cover md:rounded-md md:shadow-lg'
          />
        </div>
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-2 my-16 sm:my-20 gap-8 lg:gap-12 items-center justify-center'>
        <div className='order-2 lg:order-none relative w-full rounded-md overflow-hidden min-h-[16rem] sm:min-h-[20rem] md:min-h-[24rem] lg:min-h-[28rem]'>
          <Image
            src='/cars.webp'
            fill
            sizes='(min-width: 1024px) 50vw, 100vw'
            alt={'car'}
            className='h-full w-full object-cover md:rounded-md md:shadow-lg'
          />
        </div>
        <div className='lg:order-none text-start lg:text-end flex flex-col gap-6 sm:gap-8 md:gap-10 px-2 sm:px-4 md:px-6'>
          <div className='mb-6 order-1 '>
            <h3 className='uppercase font-extrabold text-base sm:text-lg md:text-xl text-grey-dark-3 mb-2'>
              {t('delivery_title')}
            </h3>
            <p className='text-sm sm:text-base leading-relaxed text-grey-dark-1'>
              {t.rich('delivery_text', {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          </div>
          <div className='mb-6 order-3'>
            <h3 className='uppercase font-extrabold text-base sm:text-lg md:text-xl text-grey-dark-3 mb-2'>
              {t('more_title')}
            </h3>
            <p className='text-sm sm:text-base leading-relaxed text-grey-dark-1'>
              {t.rich('more_text', {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
          </div>
        </div>
      </div>
      <div className='mb-6'>
        <h3 className='uppercase font-extrabold text-base sm:text-lg md:text-xl text-grey-dark-3 text-start mb-2'>
          {t('mission_title')}
        </h3>
        <p className='text-sm sm:text-base leading-relaxed text-grey-dark-1'>
          {t.rich('mission_text', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
      </div>
      <div className='text-center text-lg !my-8 text-sky-dark hover:scale-110 duration-200'>
        <Link href={'/'} className='hover:border-b pb-2 px-4 leading-snug'>
          Bérelj autót nálunk, és tapasztald meg Fuerteventurát úgy, ahogy mi is
          szeretjük!
        </Link>
      </div>
    </div>
  );
}
