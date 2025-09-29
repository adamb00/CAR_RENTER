'use client';

import Image from 'next/image';
import React from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

type FormValues = {
  fullName: string;
  email: string;
};

export default function Inquire() {
  const t = useTranslations('Inquire');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    console.log('Form adatok:', data);
  };

  return (
    <section
      id='inquire_section'
      className='p-[2rem] flex items-center justify-center md:p-[4rem] xl:p-[4rem] bg-gradient-to-br from-[var(--sky-dark)]/70 to-[var(--amber-light)]/70'
    >
      <div className='w-full h-full md:w-2xl lg:w-7xl rounded-xl items-stretch overflow-hidden transition-colors bg-white/70 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 shadow-lg'>
        {/* GRID layout: mobilon 1 oszlop, nagyobb kijelzőn 2 oszlop */}
        <div className='relative grid grid-cols-1 lg:grid-cols-2 w-full gap-8 items-center min-h-[26rem] xl:min-h-[40rem]'>
          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='relative z-[20] space-y-6 p-6 md:p-10 bg-transparent rounded-md h-full m-0 flex items-center md:items-start flex-col justify-center w-full transition-colors'
          >
            <h3 className='text-2xl md:text-3xl leading-tight tracking-[0.1em] font-bold text-sky-dark dark:text-sky-light uppercase'>
              {t('title')}
            </h3>
            <p className='text-sm md:text-base text-grey-dark-1 dark:text-grey-dark-1/90 text-left max-w-prose'>
              {t('description_1')}
            </p>
            <p className='text-sm md:text-base text-grey-dark-1 dark:text-grey-dark-1/90 text-left max-w-prose'>
              {t('description_2')}
            </p>
            {/* Név mező */}
            <div className='relative w-full'>
              <input
                type='text'
                id='fullName'
                placeholder={t('fields.fullName.placeholder')}
                {...register('fullName', {
                  required: t('fields.fullName.required'),
                })}
                className='peer relative z-0 block w-full rounded-md px-3 pt-5 pb-2 text-sm text-gray-900 dark:text-gray-100 placeholder-transparent bg-white/70 dark:bg-white/5 ring-1 ring-slate-300/70 dark:ring-white/10 focus:ring-2 focus:ring-sky-dark dark:focus:ring-sky-light focus:outline-none transition-colors'
              />
              <label
                htmlFor='fullName'
                className='absolute left-3 top-2 px-2 text-gray-600 dark:text-gray-300 text-sm bg-transparent dark:bg-transparent transition-all z-10
                peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:bg-transparent
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-sky-dark dark:peer-focus:text-sky-light peer-focus:px-2 peer-focus:mx-1 peer-focus:bg-white/70 dark:peer-focus:bg-black/5'
              >
                {t('fields.fullName.label')}
              </label>
              {errors.fullName && (
                <span className='text-red-600 text-xs mt-1 block'>
                  {errors.fullName.message}
                </span>
              )}
            </div>

            {/* Email mező */}
            <div className='relative w-full'>
              <input
                type='email'
                id='email'
                placeholder={t('fields.email.placeholder')}
                {...register('email', {
                  required: t('fields.email.required'),
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: t('fields.email.invalid'),
                  },
                })}
                className='peer relative z-0 block w-full rounded-md px-3 pt-5 pb-2 text-sm text-gray-900 dark:text-gray-100 placeholder-transparent bg-white/70 dark:bg-white/5 ring-1 ring-slate-300/70 dark:ring-white/10 focus:ring-2 focus:ring-sky-dark dark:focus:ring-sky-light focus:outline-none transition-colors'
              />
              <label
                htmlFor='email'
                className='absolute left-3 -top-2 px-2 text-gray-600 dark:text-gray-300 text-sm bg-transparent dark:bg-transparent transition-all z-10
                peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:bg-transparent
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-sky-dark dark:peer-focus:text-sky-light peer-focus:px-2 peer-focus:mx-1 peer-focus:bg-white/70 dark:peer-focus:bg-white/5'
              >
                {t('fields.email.label')}
              </label>
              {errors.email && (
                <span className='text-red-600 text-xs mt-1 block'>
                  {errors.email.message}
                </span>
              )}
            </div>

            <button
              type='submit'
              disabled={isSubmitting}
              className='w-full md:w-auto px-6 rounded-3xl bg-sky dark:bg-sky-light cursor-pointer tracking-widest text-white dark:text-sky-dark font-semibold py-3 transition hover:bg-sky-light dark:hover:bg-sky disabled:opacity-50 shadow'
            >
              {isSubmitting ? t('submit.submitting') : t('submit.idle')}
            </button>
          </form>

          {/* Kép */}
          <div className='absolute inset-0 z-[10] pointer-events-none md:pointer-events-auto md:static md:inset-auto md:h-full md:w-full md:flex md:justify-end clip-path opacity-80'>
            <Image
              src='/cars.webp'
              fill
              sizes='(min-width: 1024px) 50vw, 100vw'
              alt={t('alt.image')}
              className='h-full w-full object-cover md:rounded-r-md md:shadow-lg'
            />
            <div className='absolute inset-0 hidden md:block bg-gradient-to-tr from-transparent to-black/10 dark:to-black/30' />
          </div>
        </div>
      </div>
    </section>
  );
}
