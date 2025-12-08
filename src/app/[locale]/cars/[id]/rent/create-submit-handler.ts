'use client';

import { RentAction } from '@/actions/RentAction';
import { trackFormSubmission } from '@/lib/analytics';
import type { TransitionStartFunction } from 'react';
import toast from 'react-hot-toast';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import type { RentFormResolvedValues, RentFormValues } from './rent.types';
import React from 'react';
import { useFormErrorNavigation } from '@/hooks/useFormErrorNavigation';
import { SECTION_ORDER } from '@/lib/constants';
import { useManageSectionFocus } from '@/hooks/useManageSectionFocus';

type SubmitOptions = {
  bypassFlightCheck?: boolean;
};

type SubmitContext = {
  locale: string;
  carId: string;
  extrasSelected: RentFormValues['extras'] | undefined;
  isModifyMode: boolean;
  manageRentId?: string;
  quoteId?: string | null;
  successMessage: string;
  errorMessage: string;
};

type CreateSubmitHandlerParams = {
  form: UseFormReturn<RentFormValues>;
  rentSchema: { parse: (values: RentFormValues) => RentFormResolvedValues };
  formRef: React.RefObject<HTMLFormElement | null>;
  openMissingFlightsDialog: () => void;
  closeMissingFlightsDialog: () => void;
  startTransition: TransitionStartFunction;
  context: SubmitContext;
  clearStoredValues: () => void;
  routerPush: (url: string) => void;
  manageContext?: {
    rentId: string;
    section?: 'contact' | 'travel' | 'invoice';
    mode?: 'modify';
  };
};

export function useCreateSubmitHandler({
  form,
  rentSchema,
  formRef,
  openMissingFlightsDialog,
  closeMissingFlightsDialog,
  startTransition,
  context,
  clearStoredValues,
  routerPush,
  manageContext,
}: CreateSubmitHandlerParams) {
  const t = useTranslations('RentForm');

  const { onInvalid, scrollToSection } = useFormErrorNavigation<RentFormValues>(
    {
      formRef,
      sectionOrder: SECTION_ORDER,
      onError: () => toast.error(t('toast.error')),
    }
  );
  useManageSectionFocus({
    section: manageContext?.section,
    scrollToSection,
  });

  const shouldAskForFlightNumbers = React.useCallback(
    (values: RentFormResolvedValues) => {
      const arrival =
        typeof values.delivery?.arrivalFlight === 'string'
          ? values.delivery.arrivalFlight.trim()
          : '';
      const departure =
        typeof values.delivery?.departureFlight === 'string'
          ? values.delivery.departureFlight.trim()
          : '';
      return arrival.length === 0 || departure.length === 0;
    },
    []
  );

  const submitRentRequest = React.useCallback(
    (parsed: RentFormResolvedValues) => {
      const submissionMeta = {
        locale: context.locale,
        carId: context.carId,
        rentalStart: parsed.rentalPeriod.startDate,
        rentalEnd: parsed.rentalPeriod.endDate,
        extrasCount: Array.isArray(context.extrasSelected)
          ? context.extrasSelected.length
          : 0,
        mode: context.isModifyMode ? 'modify' : 'create',
      };

      startTransition(async () => {
        const rentIdPayload =
          (context.isModifyMode && context.manageRentId) ||
          parsed.rentId ||
          undefined;
        const actionPayload: RentFormResolvedValues = { ...parsed };
        actionPayload.rentId = rentIdPayload;
        const res = await RentAction({
          ...actionPayload,
          locale: context.locale,
          carId: context.carId,
          quoteId: context.quoteId ?? parsed.quoteId,
        });
        if (res.success) {
          toast.success(context.successMessage);
          clearStoredValues();
          const resultingRentId = res.rentId ?? rentIdPayload ?? undefined;
          trackFormSubmission({
            formId: 'rent-request',
            status: 'success',
            rentId: resultingRentId,
            ...submissionMeta,
          });
          const nextUrl =
            context.isModifyMode && resultingRentId
              ? `/${context.locale}/rent/thank-you`
              : resultingRentId
              ? `/${context.locale}/rent/thank-you?rentId=${resultingRentId}`
              : `/${context.locale}/rent/thank-you`;
          setTimeout(() => {
            routerPush(nextUrl);
          }, 2000);
        } else {
          toast.error(context.errorMessage);
          trackFormSubmission({
            formId: 'rent-request',
            status: 'error',
            errorMessage: res.error,
            rentId: rentIdPayload ?? context.manageRentId ?? undefined,
            ...submissionMeta,
          });
        }
      });
    },
    [
      clearStoredValues,
      context.carId,
      context.errorMessage,
      context.extrasSelected,
      context.isModifyMode,
      context.locale,
      context.manageRentId,
      context.quoteId,
      context.successMessage,
      routerPush,
      startTransition,
    ]
  );

  return React.useCallback(
    (options?: SubmitOptions) =>
      form.handleSubmit((values) => {
        const parsed = rentSchema.parse(values);
        const shouldPrompt = shouldAskForFlightNumbers(parsed);

        if (shouldPrompt && !options?.bypassFlightCheck) {
          openMissingFlightsDialog();
          return;
        }

        closeMissingFlightsDialog();
        submitRentRequest(parsed);
      }, onInvalid),
    [
      closeMissingFlightsDialog,
      form,
      onInvalid,
      openMissingFlightsDialog,
      rentSchema,
      shouldAskForFlightNumbers,
      submitRentRequest,
    ]
  );
}

export type CreateSubmitHandler = ReturnType<typeof useCreateSubmitHandler>;
export type { SubmitOptions, SubmitContext };
