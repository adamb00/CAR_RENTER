'use client';

import React, { useMemo, useRef, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';

import BaseDetails from '@/components/rent/BaseDetails';
import Children from '@/components/rent/Children';
import Consents from '@/components/rent/Consents';
import Contact from '@/components/rent/Contact';
import Delivery from '@/components/rent/Delivery';
import RentDialog from '@/components/rent/Dialog';
import Drivers from '@/components/rent/Drivers';
import Invoice from '@/components/rent/Invoice';
import LegalConsents, {
  type LegalConsentItem,
} from '@/components/rent/LegalConsents';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { usePersistRentForm } from '@/hooks/usePersistRentForm';
import { useSetContact, useSetInvoice } from '@/hooks/useSetForm';
import { useWatchForm } from '@/hooks/useWatchForm';
import { useWindowWithGoogle } from '@/hooks/useWindowWithGoogle';
import { createRentSchema } from '@/schemas/RentSchema';
import { buildInitialValues } from './build-initial-values';
import { buildConsentItems } from './consent-items';
import { useCreateSubmitHandler } from './create-submit-handler';
import { mergeQuoteIntoValues } from './merge-quote-into-values';
import {
  RentFormResolvedValues,
  RentFormValues,
  RentPageClientProps,
} from './rent.types';
import { useSearchParams } from 'next/navigation';

export default function RentPageClient({
  locale,
  car,
  quotePrefill,
  manageContext,
  rentPrefill,
}: RentPageClientProps) {
  const t = useTranslations('RentForm');
  const tManage = useTranslations('RentManage');
  const router = useRouter();

  const tCars = useTranslations('Cars');
  const tSchema = useTranslations('RentSchema');
  const [isPending, startTransition] = useTransition();
  const { id } = car;
  const manageRentId = manageContext?.rentId;
  const isModifyMode =
    manageContext?.mode === 'modify' && Boolean(manageRentId);

  const formRef = useRef<HTMLFormElement | null>(null);
  const [isMissingFlightsDialogOpen, setMissingFlightsDialogOpen] =
    React.useState(false);

  const searchParams = useSearchParams();

  const offer = searchParams.get('offer');

  const rentSchema = React.useMemo(() => createRentSchema(tSchema), [tSchema]);
  const defaultValues = React.useMemo(() => {
    if (rentPrefill) {
      return {
        ...rentPrefill,
        locale,
        carId: id,
        rentId: rentPrefill.rentId ?? manageRentId,
      };
    }
    return buildInitialValues(quotePrefill, locale, id);
  }, [id, locale, manageRentId, quotePrefill, rentPrefill]);

  const form = useForm<RentFormValues>({
    resolver: zodResolver(rentSchema) as Resolver<
      RentFormValues,
      Record<string, never>,
      RentFormResolvedValues
    >,
    defaultValues,
  });

  const { clearStoredValues, isHydrated } = usePersistRentForm(
    form,
    React.useMemo(
      () => ({
        locale,
        carId: id,
        enabled: !isModifyMode,
      }),
      [id, isModifyMode, locale],
    ),
  );

  const [placesReady, setPlacesReady] = React.useState(false);
  const { extrasSelected } = useWatchForm(form);

  useWindowWithGoogle(setPlacesReady);

  useSetContact(form, { enabled: isHydrated });

  useSetInvoice(form, { enabled: isHydrated });

  const hasAppliedQuotePrefill = React.useRef(false);

  React.useEffect(() => {
    if (
      rentPrefill ||
      !quotePrefill ||
      !isHydrated ||
      hasAppliedQuotePrefill.current
    ) {
      return;
    }
    hasAppliedQuotePrefill.current = true;
    const mergedValues = mergeQuoteIntoValues(form.getValues(), quotePrefill);
    form.reset(mergedValues);
  }, [form, isHydrated, quotePrefill, rentPrefill]);

  const consentItems = useMemo<LegalConsentItem<RentFormValues>[]>(
    () => buildConsentItems({ locale, t }),
    [locale, t],
  );

  const createSubmitHandlerFn = useCreateSubmitHandler({
    form,
    rentSchema,
    formRef,
    openMissingFlightsDialog: () => setMissingFlightsDialogOpen(true),
    closeMissingFlightsDialog: () => setMissingFlightsDialogOpen(false),
    startTransition,
    context: {
      locale,
      carId: id,
      extrasSelected,
      isModifyMode,
      manageRentId,
      quoteId: quotePrefill?.id ?? null,
      offer: offer ? Number(offer) : 0,
      successMessage: t('toast.success'),
      errorMessage: t('toast.error'),
    },
    clearStoredValues,
    routerPush: (url) => router.push(url),
    manageContext,
  });

  return (
    <Form {...form}>
      {isPending ? (
        <div className='fixed inset-0 z-5000 flex flex-col items-center justify-center gap-6 bg-black/70 backdrop-blur-sm text-white'>
          <div
            className='h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-white'
            aria-hidden='true'
          />
          <p className='text-lg font-semibold'>{t('searching')}</p>
        </div>
      ) : null}
      <form
        ref={formRef}
        onSubmit={createSubmitHandlerFn()}
        className='relative flex flex-col max-w-8xl mx-auto px-0 sm:px-6 lg:px-8 pt-18 sm:pt-18 md:pt-22 lg:pt-28'
        aria-busy={isPending}
        noValidate
      >
        <h2 className='text-2xl uppercase sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-relaxed tracking-normal md:tracking-widest text-center bg-linear-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
          {t('title')}
        </h2>
        <section className='mt-10 space-y-8'>
          <div data-section='adults' tabIndex={-1} className='scroll-mt-28'>
            <BaseDetails
              locale={locale}
              form={form}
              car={car}
              colorsLabel={tCars('details.colors')}
              translateColor={(color) => tCars(`colors.${color}`)}
            />
          </div>

          <div data-section='children' tabIndex={-1} className='scroll-mt-28'>
            <Children form={form} />
          </div>

          <div data-section='driver' tabIndex={-1} className='scroll-mt-28'>
            <Drivers form={form} locale={locale} placesReady={placesReady} />
          </div>

          <div data-section='contact' tabIndex={-1} className='scroll-mt-28'>
            <Contact form={form} />
          </div>

          <div data-section='invoice' tabIndex={-1} className='scroll-mt-28'>
            <Invoice form={form} placesReady={placesReady} />
          </div>

          <div data-section='delivery' tabIndex={-1} className='scroll-mt-28'>
            <Delivery form={form} placesReady={placesReady} />
          </div>

          <div
            data-section='consents'
            tabIndex={-1}
            className='scroll-mt-28 space-y-6'
          >
            <Consents form={form} quotePrefill={quotePrefill} />

            <LegalConsents
              form={form}
              items={consentItems}
              title={t('sections.consents.title')}
              description={t('sections.consents.description')}
              className='rounded-3xl border border-grey-light-2/60 dark:border-grey-dark-2/50 bg-white/90 dark:bg-transparent backdrop-blur px-6 py-6 sm:px-8 sm:py-8 shadow-sm'
            />
          </div>
        </section>

        <Button
          disabled={isPending}
          type='submit'
          className='self-end m-8 px-6 py-2 text-base font-semibold uppercase tracking-widest bg-sky-light text-sky-dark border border-transparent transition hover:bg-sky-dark hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-dark/60'
        >
          {isModifyMode ? tManage('modify.button') : t('buttons.submit')}
        </Button>
      </form>
      <RentDialog
        form={form}
        isPending={isPending}
        open={isMissingFlightsDialogOpen}
        onOpenChange={setMissingFlightsDialogOpen}
        createSubmitHandler={createSubmitHandlerFn}
      />
    </Form>
  );
}
