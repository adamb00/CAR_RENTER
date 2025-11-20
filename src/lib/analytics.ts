'use client';

type DataLayerEvent = {
  event: string;
  [key: string]: unknown;
};

declare global {
  interface Window {
    dataLayer?: object[];
  }
}

const isBrowser = () => typeof window !== 'undefined';

export const pushToDataLayer = (payload: DataLayerEvent) => {
  if (!isBrowser()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
};

export const trackCustomEvent = (
  event: string,
  params?: Record<string, unknown>
) => {
  pushToDataLayer({
    event,
    ...params,
  });
};

export const trackPageView = (params: Record<string, unknown>) =>
  trackCustomEvent('page_view', params);

export const trackTimeOnPage = (params: Record<string, unknown>) =>
  trackCustomEvent('time_on_page', params);

type FormSubmissionStatus = 'success' | 'error';

type FormSubmissionPayload = {
  formId: string;
  status: FormSubmissionStatus;
  locale?: string;
  method?: string;
  errorMessage?: string;
  [key: string]: unknown;
};

export const trackFormSubmission = ({
  formId,
  status,
  ...rest
}: FormSubmissionPayload) =>
  trackCustomEvent('form_submission', {
    event_category: 'form',
    form_id: formId,
    form_status: status,
    ...rest,
  });

export const trackFormStart = (
  formId: string,
  extra?: Record<string, unknown>
) =>
  trackCustomEvent('form_start', {
    event_category: 'form',
    form_id: formId,
    ...extra,
  });
