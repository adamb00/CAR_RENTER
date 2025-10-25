import * as React from 'react';
import { RentFormValues } from '@/schemas/RentSchema';
import { UseFormReturn } from 'react-hook-form';

const STORAGE_PREFIX = 'rent-form';
const STORAGE_VERSION = 1;

type StoredRentForm = {
  version: number;
  timestamp: number;
  values: RentFormValues;
};

const isBrowser = () => typeof window !== 'undefined';

const coerceAdults = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? undefined : value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const ensureAdultsNumber = (values: RentFormValues): RentFormValues => {
  const adults = coerceAdults(
    (values as unknown as { adults?: unknown }).adults
  );

  if (typeof adults === 'number' && adults !== values.adults) {
    return { ...values, adults };
  }

  return values;
};

export function usePersistRentForm(
  form: UseFormReturn<RentFormValues>,
  {
    locale,
    carId,
  }: {
    locale: string;
    carId: string;
  }
) {
  const storageKey = React.useMemo(
    () => `${STORAGE_PREFIX}:${locale}:${carId}`,
    [locale, carId]
  );

  const [hydrated, setHydrated] = React.useState(false);
  const writeTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!isBrowser()) return;

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as StoredRentForm | null;
      if (parsed?.version !== STORAGE_VERSION || !parsed?.values) return;

      const sanitized = ensureAdultsNumber(parsed.values);
      form.reset(sanitized);

      const restoredAdults = coerceAdults(
        (sanitized as unknown as { adults?: unknown }).adults
      );
      if (typeof restoredAdults === 'number') {
        form.setValue('adults', restoredAdults, {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        });
      }
    } catch (error) {
      console.error('Failed to restore rent form data from storage', error);
    } finally {
      setHydrated(true);
    }
  }, [form, storageKey]);

  React.useEffect(() => {
    if (!hydrated || !isBrowser()) return;

    const saveValues = (values: RentFormValues) => {
      if (!isBrowser()) return;
      const payload: StoredRentForm = {
        version: STORAGE_VERSION,
        timestamp: Date.now(),
        values: ensureAdultsNumber(values),
      };

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch (error) {
        console.error('Failed to persist rent form data', error);
      }
    };

    const getCurrentValues = () => form.getValues();

    const flushValues = () => {
      saveValues(getCurrentValues());
    };

    const scheduleSave = (values: RentFormValues) => {
      if (writeTimeoutRef.current) {
        window.clearTimeout(writeTimeoutRef.current);
      }
      writeTimeoutRef.current = window.setTimeout(() => {
        saveValues(values);
        writeTimeoutRef.current = null;
      }, 250);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushValues();
      }
    };

    const handlePageHide = () => {
      flushValues();
    };

    window.addEventListener('beforeunload', handlePageHide);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const subscription = form.watch(() => {
      const currentValues = getCurrentValues();
      scheduleSave(currentValues);
    });

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);

      if (writeTimeoutRef.current !== null) {
        window.clearTimeout(writeTimeoutRef.current);
        flushValues();
      } else {
        flushValues();
      }
    };
  }, [form, hydrated, storageKey]);

  const clearStoredValues = React.useCallback(() => {
    if (!isBrowser()) return;
    window.localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    storageKey,
    clearStoredValues,
    isHydrated: hydrated,
  };
}
