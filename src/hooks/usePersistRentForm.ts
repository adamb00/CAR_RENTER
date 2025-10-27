import * as React from 'react';
import { RentFormValues } from '@/schemas/RentSchema';
import { UseFormReturn } from 'react-hook-form';

const STORAGE_PREFIX = 'rent-form';
const STORAGE_VERSION = 1;

type StoredRentForm = {
  version: number;
  timestamp: number;
  values: RentFormValues;
  car: string;
  locale: string;
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
  const immediateFlushRef = React.useRef<number | null>(null);
  const suppressNextSaveRef = React.useRef(false);

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
        car: carId,
        locale,
      };

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch (error) {
        console.error('Failed to persist rent form data', error);
      }
    };

    const getCurrentValues = () => form.getValues();

    const flushValues = (values?: RentFormValues) => {
      if (writeTimeoutRef.current) {
        window.clearTimeout(writeTimeoutRef.current);
        writeTimeoutRef.current = null;
      }
      saveValues(values ?? getCurrentValues());
    };

    const scheduleSave = () => {
      if (writeTimeoutRef.current) {
        window.clearTimeout(writeTimeoutRef.current);
      }
      writeTimeoutRef.current = window.setTimeout(() => {
        saveValues(getCurrentValues());
        writeTimeoutRef.current = null;
      }, 250);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushValues();
      }
    };

    window.addEventListener('beforeunload', handleVisibilityChange);
    window.addEventListener('pagehide', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const subscription = form.watch((value, { name }) => {
      if (suppressNextSaveRef.current) {
        suppressNextSaveRef.current = false;
        return;
      }

      const runImmediateFlush = (override?: RentFormValues) => {
        if (immediateFlushRef.current) {
          window.clearTimeout(immediateFlushRef.current);
        }
        immediateFlushRef.current = window.setTimeout(() => {
          flushValues(override ?? form.getValues());
          immediateFlushRef.current = null;
        }, 0);
      };

      if (!name) {
        scheduleSave();
        return;
      }

      if (
        name === 'rentalPeriod' ||
        name === 'rentalPeriod.startDate' ||
        name === 'rentalPeriod.endDate'
      ) {
        const snapshot = form.getValues();
        const nextRentalPeriod: RentFormValues['rentalPeriod'] = {
          startDate: snapshot.rentalPeriod?.startDate ?? '',
          endDate: snapshot.rentalPeriod?.endDate ?? '',
        };

        if (name === 'rentalPeriod') {
          if (
            value &&
            typeof value === 'object' &&
            'startDate' in (value as Record<string, unknown>) &&
            'endDate' in (value as Record<string, unknown>)
          ) {
            const { startDate, endDate } =
              value as RentFormValues['rentalPeriod'];
            nextRentalPeriod.startDate = startDate ?? '';
            nextRentalPeriod.endDate = endDate ?? '';
          }
        } else if (name === 'rentalPeriod.startDate') {
          nextRentalPeriod.startDate = typeof value === 'string' ? value : '';
        } else if (name === 'rentalPeriod.endDate') {
          nextRentalPeriod.endDate = typeof value === 'string' ? value : '';
        }

        const patchedValues: RentFormValues = {
          ...snapshot,
          rentalPeriod: nextRentalPeriod,
        };

        runImmediateFlush(patchedValues);
        return;
      }

      scheduleSave();
    });

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleVisibilityChange);

      const latestValues = getCurrentValues();
      if (writeTimeoutRef.current !== null) {
        window.clearTimeout(writeTimeoutRef.current);
      }
      if (immediateFlushRef.current !== null) {
        window.clearTimeout(immediateFlushRef.current);
        immediateFlushRef.current = null;
      }
      if (suppressNextSaveRef.current) {
        suppressNextSaveRef.current = false;
        return;
      }
      flushValues(latestValues);
    };
  }, [form, hydrated, storageKey, carId, locale]);

  const clearStoredValues = React.useCallback(() => {
    if (!isBrowser()) return;
    suppressNextSaveRef.current = true;
    window.localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    storageKey,
    clearStoredValues,
    isHydrated: hydrated,
  };
}
