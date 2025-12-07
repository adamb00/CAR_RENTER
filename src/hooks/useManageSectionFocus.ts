'use client';

import { useEffect } from 'react';

export type ManageSection = 'contact' | 'travel' | 'invoice';

const SECTION_TARGET: Record<ManageSection, string> = {
  contact: 'contact',
  invoice: 'invoice',
  travel: 'delivery',
};

type UseManageSectionFocusParams = {
  section?: ManageSection;
  scrollToSection: (
    section: string,
    options?: { highlight?: boolean; offset?: number }
  ) => (() => void) | void;
  delay?: number;
};

export function useManageSectionFocus({
  section,
  scrollToSection,
  delay = 150,
}: UseManageSectionFocusParams) {
  useEffect(() => {
    if (!section) return;
    const target = SECTION_TARGET[section];
    if (!target) return;

    let cleanupHighlight: (() => void) | void;
    let timeoutId: number | null = null;

    const focusSection = () => {
      cleanupHighlight = scrollToSection(target, { highlight: true });
    };

    if (typeof document !== 'undefined' && document.readyState !== 'complete') {
      timeoutId = window.setTimeout(focusSection, delay);
    } else {
      focusSection();
    }

    return () => {
      if (typeof window !== 'undefined' && timeoutId) {
        window.clearTimeout(timeoutId);
      }
      cleanupHighlight?.();
    };
  }, [delay, scrollToSection, section]);
}
