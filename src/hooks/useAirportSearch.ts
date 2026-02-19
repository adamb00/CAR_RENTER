import React from 'react';

import {
  type AirportSuggestion,
  MIN_AIRPORT_QUERY_LENGTH,
} from '@/lib/airports/types';

type SearchResponse = {
  items?: AirportSuggestion[];
};

export const useAirportSearch = (query: string, enabled: boolean) => {
  const [items, setItems] = React.useState<AirportSuggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < MIN_AIRPORT_QUERY_LENGTH) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          q: trimmedQuery,
          limit: '10',
        });

        const response = await fetch(`/api/airports?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setItems([]);
          return;
        }

        const payload = (await response.json()) as SearchResponse;
        setItems(Array.isArray(payload.items) ? payload.items : []);
      } catch (error) {
        const isAbortError =
          error instanceof Error && error.name === 'AbortError';
        if (!isAbortError) {
          setItems([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [enabled, query]);

  return {
    items,
    isLoading,
    minQueryLength: MIN_AIRPORT_QUERY_LENGTH,
  };
};
