'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { FloatingField } from '../ui/floating-field';

export type InquireFormValues = {
  fullName: string;
  email: string;
};

export default function Inquire() {
  const t = useTranslations('Inquire');
  const { locale } = useParams();

  const {
    register,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InquireFormValues>();
  const watchedFullName = watch('fullName') ?? '';
  const watchedEmail = watch('email') ?? '';
  const contactHref = `/${locale}/contact?email=${encodeURIComponent(
    watchedEmail
  )}&name=${encodeURIComponent(watchedFullName)}`;

  return (
    <section
      id='inquire_section'
      className='p-8 flex items-center justify-center md:p-16 xl:p-16 bg-linear-to-br from-(--sky-dark)/70 to-(--amber-light)/70'
    >
      <div className='w-full h-full md:w-2xl lg:w-7xl rounded-xl items-stretch overflow-hidden transition-colors bg-white/70 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 shadow-lg'>
        <div className='relative grid grid-cols-1 lg:grid-cols-2 w-full gap-8  items-center min-h-104 xl:min-h-160'>
          <form className='relative z-20 space-y-6 p-6 md:p-10 bg-transparent  rounded-md h-full m-0 flex items-center md:items-start flex-col justify-center w-full transition-colors'>
            <h3 className='text-2xl md:text-3xl leading-tight tracking-widest font-bold text-sky-dark dark:text-sky-light uppercase'>
              {t('title')}
            </h3>
            <p className='text-sm md:text-base text-grey-dark-1 dark:text-grey-dark-1/90 text-left max-w-prose'>
              {t('description_1')}
            </p>
            <p className='text-sm md:text-base text-grey-dark-1 dark:text-grey-dark-1/90 text-left max-w-prose'>
              {t('description_2')}
            </p>
            <FloatingField
              label={t('fields.fullName.label')}
              autoComplete='name'
              {...register('fullName', {
                required: t('fields.fullName.required'),
              })}
              error={errors.fullName?.message}
            />

            <FloatingField
              type='email'
              label={t('fields.email.label')}
              autoComplete='email'
              inputMode='email'
              {...register('email', {
                required: t('fields.email.required'),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t('fields.email.invalid'),
                },
              })}
              error={errors.email?.message}
            />

            <Link href={contactHref}>
              <button
                type='submit'
                disabled={isSubmitting}
                className='w-full md:w-auto px-6 rounded-3xl bg-sky dark:bg-sky-light cursor-pointer tracking-widest text-white dark:text-sky-dark font-semibold py-3 transition hover:bg-sky-light dark:hover:bg-sky disabled:opacity-50 shadow'
              >
                {isSubmitting ? t('submit.submitting') : t('submit.idle')}
              </button>
            </Link>
          </form>

          {/* Kép */}
          <div className='absolute inset-0 z-10 pointer-events-none md:pointer-events-auto md:static md:inset-auto md:h-full md:w-full md:flex md:justify-end clip-path opacity-80'>
            <Image
              src='/cars.webp'
              fill
              sizes='(min-width: 1024px) 50vw, 100vw'
              alt={t('alt.image')}
              className='h-full w-full object-cover md:rounded-r-md md:shadow-lg'
            />
            <div className='absolute inset-0 md:hidden bg-white/90 dark:bg-white/20' />
            <div className='absolute inset-0 hidden md:block bg-linear-to-tr from-transparent to-black/10 dark:to-black/30' />
          </div>
        </div>
      </div>
    </section>
  );
}
