'use client';

import React, { useRef, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  useForm,
  type Resolver,
  type FieldErrors,
  type FieldError,
} from 'react-hook-form';
import { z } from 'zod';

import { RentAction } from '@/actions/RentAction';
import BaseDetails from '@/components/rent/BaseDetails';
import Children from '@/components/rent/Children';
import Contact from '@/components/rent/Contact';
import Delivery from '@/components/rent/Delivery';
import Drivers from '@/components/rent/Drivers';
import Invoice from '@/components/rent/Invoice';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { createEmptyDriver } from '@/hooks/useDrivers';
import { usePersistRentForm } from '@/hooks/usePersistRentForm';
import {
  useSetContact,
  useSetDelivery,
  useSetInvoice,
} from '@/hooks/useSetForm';
import { useWatchForm } from '@/hooks/useWatchForm';
import { useWindowWithGoogle } from '@/hooks/useWindowWithGoogle';
import { RentSchema, createRentSchema } from '@/schemas/RentSchema';
import toast from 'react-hot-toast';

type RentFormValues = z.input<typeof RentSchema>;
type RentFormResolvedValues = z.output<typeof RentSchema>;

type RentPageClientProps = {
  locale: string;
  id: string;
};

export default function RentPageClient({ locale, id }: RentPageClientProps) {
  const t = useTranslations('RentForm');
  const tSchema = useTranslations('RentSchema');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const formRef = useRef<HTMLFormElement | null>(null);

  // Find the first field name that has a validation error (dot notation, supports arrays)
  const firstErrorPath = (
    errs: FieldErrors<RentFormValues> | undefined,
    path = ''
  ): string | null => {
    if (!errs) return null;

    // Narrowers
    const isPlainObject = (v: unknown): v is Record<string, unknown> =>
      typeof v === 'object' && v !== null && !Array.isArray(v);
    const isFieldError = (v: unknown): v is FieldError =>
      isPlainObject(v) && ('type' in v || 'message' in v);

    // Skip RHF/Zod meta keys that are not actual fields
    const SKIP_KEYS = new Set(['root', '_errors']);

    // Deterministic priority for top-level groups (matches your UI order)
    const PRIORITY = [
      'adults',
      'children',
      'driver',
      'contact',
      'invoice',
      'delivery',
      'rentalPeriod',
      'extras',
      'tax',
    ];

    const keys = Object.keys(errs as Record<string, unknown>)
      .filter((k) => !SKIP_KEYS.has(k) && !(k.startsWith && k.startsWith('_')))
      .sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b));

    for (const key of keys) {
      const next = (errs as Record<string, unknown>)[key];
      const nextPath = path ? `${path}.${key}` : key;
      if (next == null) continue;

      if (isFieldError(next)) {
        return nextPath;
      }

      if (Array.isArray(next)) {
        for (let i = 0; i < next.length; i++) {
          const nested = firstErrorPath(
            next[i] as unknown as FieldErrors<RentFormValues>,
            `${nextPath}.${i}`
          );
          if (nested) return nested;
        }
        continue;
      }

      if (isPlainObject(next)) {
        const nested = firstErrorPath(
          next as unknown as FieldErrors<RentFormValues>,
          nextPath
        );
        if (nested) return nested;
      }
    }

    // If only `root` exists, return null so caller can handle section-level scrolling
    return null;
  };

  // Scroll smoothly to the first invalid field and focus it; fallback to its section
  const scrollToFirstError = (name: string) => {
    const root: Document | HTMLElement = formRef.current ?? document;
    let el = (root as HTMLElement | Document).querySelector(
      `[name="${name}"]`
    ) as HTMLElement | null;

    if (!el) {
      const sectionName = name.split('.')[0];
      el = (root as HTMLElement | Document).querySelector(
        `[data-section="${sectionName}"]`
      ) as HTMLElement | null;
    }

    if (el) {
      const yOffset = -100; // optional offset for sticky header
      const rect = el.getBoundingClientRect();
      const scrollTop = window.pageYOffset + rect.top + yOffset;

      window.scrollTo({ top: scrollTop, behavior: 'smooth' });

      // fallback for browsers that ignore behavior: 'smooth'
      setTimeout(() => {
        try {
          el.focus?.();
        } catch {
          /* ignore focus errors */
        }
      }, 400);
    }
  };

  const onInvalid = (errors: FieldErrors<RentFormValues>) => {
    const first = firstErrorPath(errors);
    if (first) {
      scrollToFirstError(first);
    } else {
      // No concrete field found (likely `root` error): fall back to first section with any error
      const ORDER: (keyof RentFormValues)[] = [
        'adults',
        'children',
        'driver',
        'contact',
        'invoice',
        'delivery',
        'rentalPeriod',
        'extras',
        'tax',
      ];
      const firstSection = ORDER.find((k) =>
        Boolean((errors as FieldErrors<RentFormValues>)[k])
      );
      if (firstSection) {
        scrollToFirstError(String(firstSection));
      }
    }
    toast.error(t('toast.error'));
  };

  const rentSchema = React.useMemo(() => createRentSchema(tSchema), [tSchema]);

  const form = useForm<RentFormValues>({
    resolver: zodResolver(rentSchema) as Resolver<
      RentFormValues,
      Record<string, never>,
      RentFormResolvedValues
    >,
    defaultValues: {
      extras: [],
      adults: undefined,
      children: [],
      rentalPeriod: {
        startDate: '',
        endDate: '',
      },
      driver: [createEmptyDriver()],
      contact: {
        same: false,
        name: '',
        email: '',
      },
      invoice: {
        same: false,
        name: '',
        phoneNumber: '',
        email: '',
        location: {
          country: '',
          postalCode: '',
          city: '',
          street: '',
          doorNumber: '',
        },
      },
      delivery: {
        placeType: undefined,
        locationName: '',
        address: {
          country: '',
          postalCode: '',
          city: '',
          street: '',
          doorNumber: '',
        },
      },
      tax: {
        id: '',
        companyName: '',
      },
    },
  });

  const { clearStoredValues, isHydrated } = usePersistRentForm(form, {
    locale,
    carId: id,
  });

  const [placesReady, setPlacesReady] = React.useState(false);
  const { extrasSelected } = useWatchForm(form);

  const isDeliveryRequired = React.useMemo(
    () =>
      Array.isArray(extrasSelected) && extrasSelected.includes('kiszallitas'),
    [extrasSelected]
  );

  useWindowWithGoogle(setPlacesReady);

  useSetContact(form, { enabled: isHydrated });

  useSetInvoice(form, { enabled: isHydrated });

  useSetDelivery(form, isDeliveryRequired, { enabled: isHydrated });

  const onSubmit = (data: RentFormValues) => {
    const parsed: RentFormResolvedValues = rentSchema.parse(data);

    startTransition(async () => {
      const res = await RentAction(parsed);
      if (res.success) {
        toast.success(t('toast.success'));
        clearStoredValues();
        setTimeout(() => {
          router.push(`/${locale}`);
        }, 2000);
      } else {
        toast.error(t('toast.error'));
      }
    });
  };

  return (
    <Form {...form}>
      {isPending ? (
        <div className='fixed inset-0 z-[5000] flex flex-col items-center justify-center gap-6 bg-black/70 backdrop-blur-sm text-white'>
          <div
            className='h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-white'
            aria-hidden='true'
          />
          <p className='text-lg font-semibold'>{t('searching')}</p>
        </div>
      ) : null}
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className='relative flex flex-col max-w-8xl mx-auto px-0 sm:px-6 lg:px-8 pt-18 sm:pt-18 md:pt-22 lg:pt-28'
        aria-busy={isPending}
        noValidate
      >
        <h2 className='text-2xl uppercase sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-relaxed tracking-normal md:tracking-[0.1em] text-center bg-gradient-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
          {t('title')}
        </h2>
        <section className='mt-10 space-y-8'>
          <div data-section='adults' tabIndex={-1} className='scroll-mt-28'>
            <BaseDetails locale={locale} form={form} id={id} />
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

          {isDeliveryRequired && (
            <div data-section='delivery' tabIndex={-1} className='scroll-mt-28'>
              <Delivery form={form} placesReady={placesReady} />
            </div>
          )}
        </section>

        <Button
          disabled={isPending}
          type='submit'
          className='self-end m-8 bg-sky-light text-sky-dark cursor-pointer hover:bg-sky-dark hover:border hover:text-white'
        >
          {t('buttons.submit')}
        </Button>
      </form>
    </Form>
  );
}
