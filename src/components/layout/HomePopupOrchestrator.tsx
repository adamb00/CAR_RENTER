'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DEFAULT_DELAY_MS = 3500;
const DEFAULT_STORAGE_KEY = 'home-popup-orchestrator-shown';

type HomePopupOrchestratorProps = {
  delayMs?: number;
  storageKey?: string;
};

export default function HomePopupOrchestrator({
  delayMs = DEFAULT_DELAY_MS,
  storageKey = DEFAULT_STORAGE_KEY,
}: HomePopupOrchestratorProps) {
  const locale = useLocale();
  const t = useTranslations('HomePopup');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (window.sessionStorage.getItem(storageKey) === 'true') return;

      const timer = window.setTimeout(() => {
        window.sessionStorage.setItem(storageKey, 'true');
        setOpen(true);
      }, delayMs);

      return () => window.clearTimeout(timer);
    } catch {
      const timer = window.setTimeout(() => setOpen(true), delayMs);
      return () => window.clearTimeout(timer);
    }
  }, [delayMs, storageKey]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-2xl'>
        <div className='relative overflow-hidden rounded-4xl border border-white bg-linear-to-br from-sky-dark via-sky to-amber-dark text-white shadow-2xl'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_28%)]' />

          <div className='relative grid gap-6 p-6 sm:p-8'>
            <DialogHeader className='items-start text-left'>
              <p className='text-xs font-semibold uppercase tracking-[0.35em] text-white/70'>
                {t('eyebrow')}
              </p>
              <DialogTitle className='max-w-xl text-2xl font-semibold leading-tight sm:text-4xl'>
                {t('title')}
              </DialogTitle>
              <DialogDescription className='max-w-lg text-sm leading-6 text-white/80 sm:text-base'>
                {t('description')}
              </DialogDescription>
            </DialogHeader>

            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <Button
                asChild
                size='lg'
                className='rounded-full bg-white px-6 text-sky-dark hover:bg-white/90'
              >
                <Link href={`/${locale}/cars`} onClick={() => setOpen(false)}>
                  {t('primaryLabel')}
                </Link>
              </Button>

              <Button
                type='button'
                size='lg'
                variant='outline'
                className='rounded-full border-white/30 bg-white/10 px-6 text-white hover:bg-white/15 hover:text-white'
                onClick={() => setOpen(false)}
              >
                {t('secondaryLabel')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
