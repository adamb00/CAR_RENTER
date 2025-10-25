'use client';
import { useEffect } from 'react';

type LoadingStatus = 'idle' | 'loading';

type GoogleWindow = Window &
  typeof globalThis & {
    google?: {
      maps?: Record<string, unknown>;
    };
  };

const SCRIPT_SELECTOR = 'script[data-google-maps]';
let loadingStatus: LoadingStatus = 'idle';

export function GoogleMapsScript({ locale }: { locale: string }) {
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if (loadingStatus === 'loading') {
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(SCRIPT_SELECTOR);

    if (existing) {
      if (existing.dataset.locale === locale) {
        return;
      }

      existing.remove();

      const win = window as GoogleWindow;
      if (win.google?.maps) {
        if ('google' in win) {
          delete (win as Partial<GoogleWindow>).google;
        }
      }
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=${locale}&loading=async`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = 'true';
    script.dataset.locale = locale;

    loadingStatus = 'loading';

    const handleLoad = () => {
      loadingStatus = 'idle';
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };

    const handleError = () => {
      loadingStatus = 'idle';
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    document.body.appendChild(script);

    return () => {
      if (script.parentElement) {
        script.parentElement.removeChild(script);
      }
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
      loadingStatus = 'idle';
    };
  }, [locale]);

  return null;
}
