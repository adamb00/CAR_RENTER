'use client';

import { useEffect, useState, type ReactNode } from 'react';

type NoSSRProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
