'use client';

import { useCallback, useMemo, type RefObject } from 'react';

import type {
  FieldError,
  FieldErrors,
  FieldValues,
} from 'react-hook-form';

type UseFormErrorNavigationOptions<TFieldValues extends FieldValues> = {
  formRef: RefObject<HTMLFormElement | HTMLElement | null>;
  sectionOrder: Array<keyof TFieldValues | string>;
  offset?: number;
  onError?: () => void;
  sectionHighlightClasses?: string[];
  sectionHighlightDuration?: number;
  sectionScrollOffset?: number;
};

type UseFormErrorNavigationResult<TFieldValues extends FieldValues> = {
  onInvalid: (errors: FieldErrors<TFieldValues>) => void;
  scrollToField: (name: string) => void;
  findFirstErrorPath: (
    errors: FieldErrors<TFieldValues> | undefined,
    path?: string
  ) => string | null;
  scrollToSection: (
    section: string,
    options?: { highlight?: boolean; offset?: number }
  ) => (() => void) | void;
};

const cssEscape = (value: string) => {
  if (
    typeof window !== 'undefined' &&
    typeof window.CSS?.escape === 'function'
  ) {
    return window.CSS.escape(value);
  }
  return value.replace(/["\\]/g, '\\$&');
};

export function useFormErrorNavigation<TFieldValues extends FieldValues>({
  formRef,
  sectionOrder,
  offset = -100,
  onError,
  sectionHighlightClasses = ['ring-2', 'ring-sky-500/70'],
  sectionHighlightDuration = 1500,
  sectionScrollOffset,
}: UseFormErrorNavigationOptions<TFieldValues>): UseFormErrorNavigationResult<TFieldValues> {
  const priority = useMemo(
    () => sectionOrder.map((key) => String(key)),
    [sectionOrder]
  );
  const sectionOffset = sectionScrollOffset ?? offset;

  const findFirstErrorPath = useCallback(
    (
      errs: FieldErrors<TFieldValues> | undefined,
      path = ''
    ): string | null => {
      if (!errs) return null;

      const isPlainObject = (value: unknown): value is Record<string, unknown> =>
        typeof value === 'object' && value !== null && !Array.isArray(value);
      const isFieldError = (value: unknown): value is FieldError =>
        isPlainObject(value) && ('type' in value || 'message' in value);
      const SKIP_KEYS = new Set(['root', '_errors']);

      const keys = Object.keys(errs as Record<string, unknown>)
        .filter(
          (key) => !SKIP_KEYS.has(key) && !(key.startsWith && key.startsWith('_'))
        )
        .sort((a, b) => {
          const idxA = priority.indexOf(a);
          const idxB = priority.indexOf(b);
          const safeA = idxA === -1 ? Number.MAX_SAFE_INTEGER : idxA;
          const safeB = idxB === -1 ? Number.MAX_SAFE_INTEGER : idxB;
          if (safeA === safeB) {
            return a.localeCompare(b);
          }
          return safeA - safeB;
        });

      for (const key of keys) {
        const next = (errs as Record<string, unknown>)[key];
        if (next == null) continue;
        const nextPath = path ? `${path}.${key}` : key;

        if (isFieldError(next)) {
          return nextPath;
        }

        if (Array.isArray(next)) {
          for (let i = 0; i < next.length; i++) {
            const nested = findFirstErrorPath(
              next[i] as unknown as FieldErrors<TFieldValues>,
              `${nextPath}.${i}`
            );
            if (nested) return nested;
          }
          continue;
        }

        if (isPlainObject(next)) {
          const nested = findFirstErrorPath(
            next as unknown as FieldErrors<TFieldValues>,
            nextPath
          );
          if (nested) return nested;
        }
      }

      return null;
    },
    [priority]
  );

  const scrollElementIntoView = useCallback(
    (element: HTMLElement, customOffset?: number) => {
      if (typeof window === 'undefined') return;
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset + rect.top + (customOffset ?? offset);
      window.scrollTo({ top: scrollTop, behavior: 'smooth' });
    },
    [offset]
  );

  const scrollToField = useCallback(
    (name: string) => {
      if (typeof document === 'undefined') return;
      const root: Document | HTMLElement = formRef.current ?? document;
      const escapeName = cssEscape(name);

      let element = root.querySelector(
        `[name="${escapeName}"]`
      ) as HTMLElement | null;

      if (!element) {
        const sectionName = name.split('.')[0];
        const escapedSection = cssEscape(sectionName);
        element = root.querySelector(`[data-section="${escapedSection}"]`) as
          | HTMLElement
          | null;
      }

      if (element && typeof window !== 'undefined') {
        scrollElementIntoView(element, offset);
        window.setTimeout(() => {
          try {
            element?.focus?.();
          } catch {
            /* ignore focus failures */
          }
        }, 400);
      }
    },
    [formRef, offset, scrollElementIntoView]
  );

  const scrollToSection = useCallback(
    (
      section: string,
      options?: { highlight?: boolean; offset?: number }
    ): (() => void) | void => {
      if (typeof document === 'undefined') return;
      const root: Document | HTMLElement = formRef.current ?? document;
      const escapedSection = cssEscape(section);
      const element = root.querySelector(
        `[data-section="${escapedSection}"]`
      ) as HTMLElement | null;
      if (!element || typeof window === 'undefined') {
        return;
      }
      scrollElementIntoView(element, options?.offset ?? sectionOffset);
      const shouldHighlight = options?.highlight ?? false;
      if (!shouldHighlight || sectionHighlightClasses.length === 0) {
        return;
      }
      element.classList.add(...sectionHighlightClasses);
      const timeoutId = window.setTimeout(() => {
        element.classList.remove(...sectionHighlightClasses);
      }, sectionHighlightDuration);
      return () => {
        element.classList.remove(...sectionHighlightClasses);
        window.clearTimeout(timeoutId);
      };
    },
    [
      formRef,
      scrollElementIntoView,
      sectionHighlightClasses,
      sectionHighlightDuration,
      sectionOffset,
    ]
  );

  const onInvalid = useCallback(
    (errors: FieldErrors<TFieldValues>) => {
      const first = findFirstErrorPath(errors);
      if (first) {
        scrollToField(first);
      } else {
        const fallbackSection = priority.find((key) =>
          Boolean((errors as Record<string, unknown>)[key])
        );
        if (fallbackSection) {
          scrollToField(fallbackSection);
        }
      }
      onError?.();
    },
    [findFirstErrorPath, onError, priority, scrollToField]
  );

  return {
    onInvalid,
    scrollToField,
    findFirstErrorPath,
    scrollToSection,
  };
}
