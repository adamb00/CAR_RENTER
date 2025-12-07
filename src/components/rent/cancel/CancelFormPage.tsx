import { cancelRentRequestAction } from '@/actions/CancelRequestAction';
import { getTranslations } from 'next-intl/server';
import React from 'react';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';

export default function CancelForm({
  locale,
  tManage,
}: {
  locale: string;
  tManage: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <form
      action={cancelRentRequestAction}
      className='rounded-3xl border border-grey-light-2/60 dark:border-grey-dark-2/50 bg-white/90 dark:bg-slate-900/40 backdrop-blur p-6 shadow-sm space-y-5'
    >
      <input type='hidden' name='locale' value={locale} />
      <div className='space-y-2'>
        <label
          htmlFor='rent-id'
          className='text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground'
        >
          {tManage('summary.bookingId')}
        </label>
        <Input id='rent-id' name='rentId' required placeholder='2025/0001' />
      </div>
      <div className='space-y-2'>
        <label
          htmlFor='contact-email'
          className='text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground'
        >
          {tManage('summary.contactEmail')}
        </label>
        <Input
          id='contact-email'
          name='contactEmail'
          type='email'
          required
          placeholder='you@example.com'
        />
      </div>
      <div className='space-y-2'>
        <label
          htmlFor='cancel-reason'
          className='text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground'
        >
          {tManage('cancel.reasonLabel')}
        </label>
        <Textarea
          id='cancel-reason'
          name='reason'
          placeholder={tManage('cancel.reasonPlaceholder')}
          className='min-h-[140px] resize-none'
        />
        <p className='text-xs text-grey-dark-3 dark:text-grey-dark-2'>
          {tManage('cancel.helper')}
        </p>
      </div>
      <Button
        type='submit'
        className='w-full md:w-auto rounded-full bg-sky-dark px-6 py-2 text-sm font-semibold tracking-[0.3em] text-white hover:bg-sky-dark/90 dark:bg-sky-light dark:text-slate-900 dark:hover:bg-sky-light/90'
      >
        {tManage('cancel.button')}
      </Button>
    </form>
  );
}
