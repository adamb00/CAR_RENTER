'use client';

import { PropsWithChildren, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { trackPageView, trackTimeOnPage } from '@/lib/analytics';

const MIN_ENGAGEMENT_MS = 1000;

const getFullPath = (pathname: string | null, search: string) => {
  const base = pathname ?? '/';
  return search ? `${base}?${search}` : base;
};

export function AnalyticsProvider({ children }: PropsWithChildren) {
  usePageMetrics();
  return <>{children}</>;
}

const usePageMetrics = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? '';
  const currentPath = getFullPath(pathname, search);

  const startTimeRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const lastPathRef = useRef(currentPath);

  const sendTimeOnPage = (trigger: string) => {
    if (typeof window === 'undefined' || typeof performance === 'undefined') {
      return;
    }
    const start = startTimeRef.current;
    if (start == null) return;
    const duration = performance.now() - start;
    if (duration < MIN_ENGAGEMENT_MS) return;
    const engagementTime = Math.round(duration);
    trackTimeOnPage({
      page_path: lastPathRef.current,
      page_location: window.location.href,
      engagement_time_msec: engagementTime,
      engagement_time_sec: Number((engagementTime / 1000).toFixed(2)),
      trigger,
    });
    startTimeRef.current = performance.now();
  };

  useEffect(() => {
    if (mountedRef.current) {
      sendTimeOnPage('route-change');
    } else {
      mountedRef.current = true;
    }
    startTimeRef.current = performance.now();
    lastPathRef.current = currentPath;

    const href = typeof window !== 'undefined' ? window.location.href : undefined;
    const title =
      typeof document !== 'undefined' ? document.title : undefined;
    const locale =
      typeof document !== 'undefined'
        ? document.documentElement.lang
        : undefined;
    trackPageView({
      page_path: currentPath,
      page_location: href,
      page_title: title,
      locale,
    });
  }, [currentPath]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        sendTimeOnPage('visibilitychange');
      } else {
        startTimeRef.current = performance.now();
      }
    };

    const handlePageHide = () => {
      sendTimeOnPage('pagehide');
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
      sendTimeOnPage('unmount');
    };
  }, []);
};
