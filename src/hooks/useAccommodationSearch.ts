import React from 'react';

import {
  type AccommodationSuggestion,
  MIN_ACCOMMODATION_QUERY_LENGTH,
} from '@/lib/accommodations/types';

type SearchResponse = {
  items?: AccommodationSuggestion[];
};

export const useAccommodationSearch = (query: string, enabled: boolean) => {
  const [items, setItems] = React.useState<AccommodationSuggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length < MIN_ACCOMMODATION_QUERY_LENGTH) {
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
          limit: '12',
        });
        const response = await fetch(`/api/accommodations?${params.toString()}`,
          {
            signal: controller.signal,
          }
        );

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
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [enabled, query]);

  return {
    items,
    isLoading,
    minQueryLength: MIN_ACCOMMODATION_QUERY_LENGTH,
  };
};
