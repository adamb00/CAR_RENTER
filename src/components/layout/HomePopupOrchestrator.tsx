'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CarActionPromotion } from '@/lib/cars';

const DEFAULT_DELAY_MS = 3500;
const DEFAULT_STORAGE_KEY = 'home-popup-orchestrator-shown';

type HomePopupOrchestratorProps = {
  promotions: CarActionPromotion[][];
  delayMs?: number;
  storageKey?: string;
};

const islandNames: Record<string, string> = {
  fuerteventura: 'Fuerteventura',
  lanzarote: 'Lanzarote',
};

const intlLocaleMap: Record<string, string> = {
  cz: 'cs',
  dk: 'da',
  se: 'sv',
};

export default function HomePopupOrchestrator({
  promotions,
  delayMs = DEFAULT_DELAY_MS,
  storageKey = DEFAULT_STORAGE_KEY,
}: HomePopupOrchestratorProps) {
  const locale = useLocale();
  const intlLocale = intlLocaleMap[locale] ?? locale;
  const t = useTranslations('HomePopup');
  const [open, setOpen] = useState(false);
  const visiblePromotions = promotions.flat().slice(0, 6);
  const promotionCount = visiblePromotions.length;
  const isSinglePromotion = promotionCount === 1;
  const dialogWidthClass = isSinglePromotion
    ? 'w-[calc(100vw-2rem)] sm:max-w-xl md:max-w-2xl'
    : promotionCount <= 2
      ? 'w-[calc(100vw-2rem)] sm:max-w-4xl'
      : 'w-[calc(100vw-2rem)] sm:max-w-6xl';
  const promotionGridClass = isSinglePromotion
    ? 'grid-cols-1'
    : promotionCount <= 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (visiblePromotions.length === 0) return;

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
  }, [delayMs, storageKey, visiblePromotions.length]);

  if (visiblePromotions.length === 0) {
    return null;
  }

  const dateFormatter = new Intl.DateTimeFormat(intlLocale, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={`max-h-[90vh] overflow-hidden p-0 ${dialogWidthClass}`}
      >
        <div className='grid max-h-[72vh] overflow-y-auto bg-white text-sky-dark'>
          <div className='grid gap-5 border-b border-sky-dark/10 p-5 sm:p-7'>
            <DialogHeader className='items-start text-left'>
              <p className='text-xs font-semibold uppercase tracking-[0.25em] text-amber-dark'>
                {t('eyebrow')}
              </p>
              <DialogTitle className='max-w-2xl text-2xl font-semibold leading-tight text-sky-dark sm:text-3xl'>
                {t('title')}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className={`grid gap-3 p-5 sm:p-7 ${promotionGridClass}`}>
            {visiblePromotions.map((promotion) => {
              const days =
                promotion.date && promotion.endDate
                  ? Math.ceil(
                      (new Date(promotion.endDate).getTime() -
                        new Date(promotion.date).getTime()) /
                        (1000 * 60 * 60 * 24),
                    )
                  : null;
              const formattedStartDate = dateFormatter.format(
                new Date(`${promotion.date}T00:00:00`),
              );
              const displayEndDate = new Date(`${promotion.endDate}T00:00:00`);
              displayEndDate.setDate(displayEndDate.getDate() - 1);
              const formattedEndDate = dateFormatter.format(displayEndDate);
              const carHref = `/${locale}/cars?island=${encodeURIComponent(
                promotion.island,
              )}&startDate=${promotion.date}&endDate=${promotion.endDate}&days=${days}`;

              return (
                <article
                  key={promotion.id}
                  className={
                    isSinglePromotion
                      ? 'grid overflow-hidden rounded-lg border border-sky-dark/10 bg-white shadow-sm sm:grid-cols-[minmax(180px,42%)_1fr]'
                      : 'grid overflow-hidden rounded-lg border border-sky-dark/10 bg-white shadow-sm sm:grid-cols-[112px_1fr] xl:grid-cols-1'
                  }
                >
                  <div
                    className={
                      isSinglePromotion
                        ? 'relative h-48 bg-sky-dark/5 sm:h-auto sm:min-h-56'
                        : 'relative min-h-44 bg-sky-dark/5 sm:min-h-36 xl:min-h-48'
                    }
                  >
                    <Image
                      src={promotion.image}
                      alt={t('imageAlt', { carName: promotion.carName })}
                      fill
                      sizes={
                        isSinglePromotion
                          ? '(min-width: 640px) 45vw, calc(100vw - 4rem)'
                          : '(min-width: 1280px) 28vw, (min-width: 640px) 112px, calc(100vw - 4rem)'
                      }
                      className={
                        isSinglePromotion ? 'object-cover' : 'object-contain'
                      }
                    />
                  </div>
                  <div
                    className={
                      isSinglePromotion
                        ? 'grid content-center gap-4 p-5 sm:p-6'
                        : 'grid gap-3 p-4'
                    }
                  >
                    <div className='space-y-1'>
                      <p className='text-xs font-semibold uppercase tracking-[0.16em] text-amber-dark'>
                        {t('dateRangeLabel', {
                          startDate: formattedStartDate,
                          endDate: formattedEndDate,
                        })}
                      </p>
                      <h3
                        className={
                          isSinglePromotion
                            ? 'text-xl font-semibold leading-tight text-sky-dark sm:text-2xl'
                            : 'text-base font-semibold leading-snug text-sky-dark'
                        }
                      >
                        {promotion.carName}
                      </h3>
                    </div>

                    <div
                      className={
                        isSinglePromotion
                          ? 'grid gap-2 text-sm text-sky-dark/70 sm:text-base'
                          : 'grid gap-2 text-sm text-sky-dark/70'
                      }
                    >
                      <span className='inline-flex items-center gap-2'>
                        <MapPin className='size-4 text-amber-dark' />
                        {islandNames[promotion.island] ?? promotion.island}
                      </span>
                      <span className='inline-flex items-center gap-2'>
                        <Users className='size-4 text-amber-dark' />
                        {t('seatsLabel', { count: promotion.seats })}
                      </span>
                    </div>

                    <Button
                      asChild
                      size='sm'
                      className={
                        isSinglePromotion
                          ? 'w-full rounded-full bg-sky-dark px-5 text-white hover:bg-sky sm:w-fit'
                          : 'w-fit rounded-full bg-sky-dark px-4 text-white hover:bg-sky'
                      }
                    >
                      <Link href={carHref} onClick={() => setOpen(false)}>
                        {t('primaryLabel')}
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className='flex flex-col gap-3 border-t border-sky-dark/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7'>
            <p className='text-sm text-sky-dark/70'>{t('footerNote')}</p>
            <Button
              type='button'
              size='lg'
              variant='outline'
              className='rounded-full border-sky-dark/20 px-6 text-sky-dark hover:bg-sky-dark/5'
              onClick={() => setOpen(false)}
            >
              {t('secondaryLabel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
