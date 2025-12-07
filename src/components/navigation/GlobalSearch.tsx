'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useMessages, useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import clsx from 'clsx';
import { SEARCH_ENTRY_CONFIG } from '@/lib/search/config';
import {
  GlobalSearchProps,
  MessagesShape,
  SearchMessages,
} from './navigation.types';
import { normalizeText } from '@/lib/format';
import { flattenStrings, getValueByPath } from '../blog/helper';

export function GlobalSearch({ className, onNavigate }: GlobalSearchProps) {
  const t = useTranslations('Search');
  const locale = useLocale();
  const messages = useMessages();
  const searchMessages = (messages?.Search ?? null) as SearchMessages | null;

  const configMap = useMemo(() => {
    const map = new Map<string, string[]>();
    SEARCH_ENTRY_CONFIG.forEach((config) => {
      map.set(config.id, config.namespaces);
    });
    return map;
  }, []);

  const entries = useMemo(() => {
    const list = Array.isArray(searchMessages?.entries)
      ? searchMessages.entries
      : [];
    const messagesObj = (messages ?? {}) as MessagesShape;
    return list.map((entry) => {
      const resolvedPath = entry.path.includes('{locale}')
        ? entry.path.replace('{locale}', locale)
        : entry.path;
      const namespaces = entry.id ? configMap.get(entry.id) ?? [] : [];
      const namespaceText = namespaces
        .map((ns) => getValueByPath(messagesObj, ns))
        .filter(Boolean)
        .flatMap((value) => flattenStrings(value))
        .join(' ');
      const haystack = normalizeText(
        [
          entry.title,
          entry.description ?? '',
          (entry.keywords ?? []).join(' '),
          namespaceText,
        ].join(' ')
      );
      return {
        ...entry,
        path: resolvedPath,
        haystack,
      };
    });
  }, [configMap, locale, messages, searchMessages?.entries]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasEntries = entries.length > 0;

  const filteredEntries = useMemo(() => {
    if (!entries.length) return [];
    const normalized = normalizeText(query.trim());
    if (!normalized) {
      return entries.slice(0, 6);
    }
    return entries.filter((entry) => entry.haystack.includes(normalized));
  }, [entries, query]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const hasResults = filteredEntries.length > 0;
  const noResultsLabel =
    query.trim().length > 0 ? t('noResults', { query }) : t('suggested');

  if (!hasEntries) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={clsx('relative flex items-center', className)}
    >
      <button
        type='button'
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? t('closeLabel') : t('openLabel')}
        className={clsx(
          'inline-flex h-10 w-10 items-center justify-center rounded-full border',
          'border-grey-light-2/70 bg-white text-sky-dark shadow-lg transition-colors',
          'hover:bg-white dark:border-grey-light-1/10 dark:bg-sky-light dark:text-white'
        )}
      >
        <Search className='h-4 w-4' />
      </button>

      {open ? (
        <div
          className={clsx(
            'fixed left-4 right-4 top-[calc(env(safe-area-inset-top,0px)+80px)]',
            'sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[min(90vw,26rem)]',
            'z-2600'
          )}
          aria-label={t('ariaLabel')}
        >
          <div className='rounded-3xl border border-grey-light-2/70 bg-white/95 p-3 shadow-2xl backdrop-blur dark:border-grey-dark-2/80 dark:bg-grey-light-2/80'>
            <div className='flex items-center gap-2 rounded-2xl border border-grey-light-2/70 bg-white/90 px-3 py-2 dark:border-none dark:bg-grey-dark-2/50 '>
              <Search className='h-4 w-4 text-grey-dark-3 dark:text-grey-light-3' />
              <input
                ref={inputRef}
                type='search'
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('placeholder')}
                className='flex-1 bg-transparent text-sm text-sky-dark outline-none placeholder:text-grey-dark-2/70 dark:text-grey-light-1 dark:placeholder:text-grey-light-2/70'
              />
            </div>

            <div className='mt-3 max-h-80 overflow-y-auto rounded-2xl border border-transparent bg-white/60 p-2 dark:bg-grey-light-2/60'>
              {hasResults ? (
                <ul className='space-y-2'>
                  {filteredEntries.map((entry) => (
                    <li key={`${entry.path}-${entry.title}`}>
                      <Link
                        href={entry.path}
                        onClick={() => {
                          setOpen(false);
                          setQuery('');
                          onNavigate?.();
                        }}
                        className='block rounded-2xl border border-transparent px-3 py-2 dark:bg-grey-dark-2/50 transition hover:border-sky-dark/20 hover:bg-sky-light/30 dark:hover:border-amber-light/30 dark:hover:bg-grey-dark-1/40'
                      >
                        <p className='text-sm font-semibold text-sky-dark dark:text-amber-light'>
                          {entry.title}
                        </p>
                        {entry.description ? (
                          <p className='mt-1 text-xs text-grey-dark-2/90 dark:text-grey-light-2/90'>
                            {entry.description}
                          </p>
                        ) : null}
                        <p className='mt-1 text-[0.65rem] uppercase tracking-wide text-grey-dark-2/70 dark:text-grey-light-3/70'>
                          {entry.path}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='rounded-2xl border border-dashed border-grey-light-2/70 px-3 py-4 text-center text-sm text-grey-dark-3 dark:border-grey-dark-2/70 dark:text-grey-light-2/80'>
                  {noResultsLabel}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
