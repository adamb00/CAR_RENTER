'use client';

import Image from 'next/image';
import React, { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { InquireAction } from '@/actions/InquireAction';
import toast from 'react-hot-toast';

export type InquireFormValues = {
  fullName: string;
  email: string;
  message: string;
};

type FloatingFieldProps = React.ComponentPropsWithoutRef<typeof Input> & {
  label: string;
  error?: string;
  containerClassName?: string;
};

const FloatingField = React.forwardRef<HTMLInputElement, FloatingFieldProps>(
  ({ label, error, className, containerClassName, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div
        className={cn('group relative w-full text-left', containerClassName)}
      >
        <Input
          id={inputId}
          ref={ref}
          placeholder=' '
          className={cn(
            'peer h-12 w-full rounded-lg border border-slate-300/70 bg-white/80 px-4 py-2  text-sm font-medium text-slate-900 shadow-sm transition-all focus:border-sky-dark focus:ring-2 focus:ring-sky-dark/40 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:focus:border-sky-light dark:focus:ring-sky-light/40',
            error &&
              'border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500/80 dark:focus:ring-red-500/40',
            className
          )}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            'pointer-events-none absolute left-3 top-1/2 inline-flex -translate-y-1/2 rounded-sm px-1 text-sm text-slate-500 transition-all duration-200',
            'peer-placeholder-shown:top-1/2 peer-placeholder-shown:bg-transparent peer-placeholder-shown:text-base peer-placeholder-shown:font-normal',
            'peer-focus:-top-0.5 peer-focus:bg-white/90 peer-focus:text-xs peer-focus:text-sky-dark dark:peer-focus:bg-black/50 dark:peer-focus:text-sky-light',
            'peer-not-placeholder-shown:-top-0 peer-not-placeholder-shown:bg-white/90 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-slate-700 dark:peer-not-placeholder-shown:bg-black/40 dark:peer-not-placeholder-shown:text-slate-200'
          )}
        >
          {label}
        </label>
        {error && (
          <p className='mt-1 text-xs font-medium text-red-500'>{error}</p>
        )}
      </div>
    );
  }
);

FloatingField.displayName = 'FloatingField';

export default function Inquire() {
  const t = useTranslations('Inquire');
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquireFormValues>();

  const onSubmit = async (data: InquireFormValues) => {
    startTransition(async () => {
      const res = await InquireAction(data);
      if (res && res.success) {
        toast.success(t('toast.success'));
        reset({
          fullName: '',
          email: '',
          message: '',
        });
      } else {
        toast.error(t('toast.error'));
      }
    });
  };

  return (
    <section
      id='inquire_section'
      className='p-[2rem] flex items-center justify-center md:p-[4rem] xl:p-[4rem] bg-gradient-to-br from-[var(--sky-dark)]/70 to-[var(--amber-light)]/70'
    >
      <div className='w-full h-full md:w-2xl lg:w-7xl rounded-xl items-stretch overflow-hidden transition-colors bg-white/70 dark:bg-white/5 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 shadow-lg'>
        {/* GRID layout: mobilon 1 oszlop, nagyobb kijelzőn 2 oszlop */}
        <div className='relative grid grid-cols-1 lg:grid-cols-2 w-full gap-8  items-center min-h-[26rem] xl:min-h-[40rem]'>
          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='relative z-[20] space-y-6 p-6 md:p-10 bg-transparent  rounded-md h-full m-0 flex items-center md:items-start flex-col justify-center w-full transition-colors'
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
            <FloatingField
              label={t('fields.message.label')}
              {...register('message', {
                required: t('fields.message.required'),
              })}
              error={errors.message?.message}
            />

            <button
              type='submit'
              disabled={isSubmitting || isPending}
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
            {/* Mobile overlay: subtle whitish tint over image */}
            <div className='absolute inset-0 md:hidden bg-white/90 dark:bg-white/20' />
            <div className='absolute inset-0 hidden md:block bg-gradient-to-tr from-transparent to-black/10 dark:to-black/30' />
          </div>
        </div>
      </div>
    </section>
  );
}
