'use client';

import React from 'react';
import { useForm } from 'react-hook-form';

type FormValues = {
  fullName: string;
  email: string;
};

export default function Inquire() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    console.log('Form adatok:', data);
  };

  return (
    <div className='p-[2rem] flex items-center justify-center md:p-[4rem] xl:p-[8rem] bg-gradient-to-br from-[var(--sky-dark)]/70 to-[var(--amber-light)]/70'>
      <div className='w-full h-full md:w-2xl lg:w-7xl md:bg-white/80 rounded-md items-stretch overflow-hidden'>
        {/* GRID layout: mobilon 1 oszlop, nagyobb kijelzőn 2 oszlop */}
        <div className='relative grid grid-cols-1 md:grid-cols-2 w-full gap-8 items-center min-h-[26rem]'>
          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='relative z-[20] space-y-6 p-6 bg-white/80 md:bg-transparent rounded-md md:rounded-none h-full md:m-0 flex items-center flex-col justify-center'
          >
            <h3 className='text-3xl leading-tight tracking-[0.1em] font-bold text-sky-dark uppercase'>
              Foglald le most!
            </h3>
            {/* Név mező */}
            <div className='relative w-full'>
              <input
                type='text'
                id='fullName'
                placeholder='Teljes név'
                {...register('fullName', {
                  required: 'Kérlek add meg a neved',
                })}
                className='peer block w-full rounded-md border border-gray-300 bg-transparent px-3 pt-5 pb-2 text-sm text-gray-900 placeholder-transparent focus:border-sky-dark focus:ring-1 focus:ring-sky-dark focus:outline-none'
              />
              <label
                htmlFor='fullName'
                className='absolute left-3 -top-2 px-1 text-gray-500 text-sm bg-transparent transition-all
                peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-sky-dark peer-focus:px-2 peer-focus:bg-grey-light-1/80 dark:peer-focus:bg-grey-dark-1/80'
              >
                Teljes név
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
                placeholder='Email cím'
                {...register('email', {
                  required: 'Kérlek add meg az email címed',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Érvényes email címet adj meg',
                  },
                })}
                className='peer block w-full rounded-md border border-gray-300 bg-transparent px-3 pt-5 pb-2 text-sm text-gray-900 placeholder-transparent focus:border-sky-dark focus:ring-1 focus:ring-sky-dark focus:outline-none'
              />
              <label
                htmlFor='email'
                className='absolute left-3 -top-2 px-1 text-gray-500 text-sm bg-transparent transition-all
                peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-sky-dark peer-focus:px-2 peer-focus:bg-grey-light-1/80 dark:peer-focus:bg-grey-dark-1/80'
              >
                E-mail cím
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
              className='w-1/2 rounded-3xl bg-sky cursor-pointer tracking-widest text-white font-semibold py-3 transition hover:bg-sky-light disabled:opacity-50'
            >
              {isSubmitting ? 'Küldés...' : 'Tovább →'}
            </button>
          </form>

          {/* Kép */}
          <div className='absolute inset-0 z-[10] pointer-events-none md:pointer-events-auto md:static md:inset-auto md:h-full md:w-full md:flex md:justify-end clip-path opacity-70'>
            <img
              src='cars_sm.webp'
              srcSet='cars_sm.webp 300w, cars.webp 1000w'
              sizes='(max-width: 56.25em) 20vw, (max-width: 37.5em) 30vw, 300px'
              alt='Autóbérlés illusztráció'
              className='h-full w-full object-cover md:rounded-r-md md:shadow-lg'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
