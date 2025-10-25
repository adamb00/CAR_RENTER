import { getTranslations } from 'next-intl/server';

export default async function ContactPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params?.locale ?? 'hu';
  const t = await getTranslations({ locale, namespace: 'Contact' });

  return (
    <>
      <div className='relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 lg:pt-40'>
        {/* <Link
          href='/'
          className='absolute -left-8 sm:left-0 md:-left-8 -top-4 sm:top-0 md:-top-8 z-[1200]'
        >
          <Logo size='sm' />
        </Link> */}
        <h2 className='text-3xl uppercase sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-relaxed tracking-wide md:tracking-[0.1em] text-center bg-gradient-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
          {t('title')}
        </h2>
        <div className='mt-10 text-grey-dark-3 text-base md:text-lg tracking-wider'>
          <p className='mb-4'>
            {t.rich('p1', { strong: (chunks) => <strong>{chunks}</strong> })}
          </p>
          <p className='mb-6'>
            {t.rich('p2', { strong: (chunks) => <strong>{chunks}</strong> })}
          </p>
        </div>
      </div>
    </>
  );
}
