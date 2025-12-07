import { cn } from '@/lib/utils';
import React from 'react';
import { Input } from './input';

type FloatingFieldProps = React.ComponentPropsWithoutRef<typeof Input> & {
  label: string;
  error?: string;
  containerClassName?: string;
};

export const FloatingField = React.forwardRef<
  HTMLInputElement,
  FloatingFieldProps
>(({ label, error, className, containerClassName, id, ...props }, ref) => {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn('group relative w-full text-left', containerClassName)}>
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
          'peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:bg-white/90 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-slate-700 dark:peer-not-placeholder-shown:bg-black/40 dark:peer-not-placeholder-shown:text-slate-200'
        )}
      >
        {label}
      </label>
      {error && (
        <p className='mt-1 text-xs font-medium text-red-500'>{error}</p>
      )}
    </div>
  );
});

FloatingField.displayName = 'FloatingField';
