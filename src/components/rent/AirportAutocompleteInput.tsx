'use client';

import React from 'react';

import { useAirportSearch } from '@/hooks/useAirportSearch';
import type { AirportSuggestion } from '@/lib/airports/types';

import { Input } from '../ui/input';

type AirportAutocompleteInputProps = {
  value: string;
  placeholder: string;
  searchingLabel: string;
  noResultLabel: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onSelect: (value: AirportSuggestion) => void;
};

const formatAirportSubLine = (airport: AirportSuggestion): string => {
  const code = airport.iataCode || airport.ident;
  const location = airport.municipality || airport.island;
  return [code, location].filter(Boolean).join(' - ');
};

export default function AirportAutocompleteInput({
  value,
  placeholder,
  searchingLabel,
  noResultLabel,
  onChange,
  onBlur,
  onSelect,
}: AirportAutocompleteInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { items, isLoading, minQueryLength } = useAirportSearch(value, isOpen);

  const trimmedValue = value.trim();
  const hasEnoughChars = trimmedValue.length >= minQueryLength;
  const shouldShowDropdown =
    isOpen && (isLoading || items.length > 0 || hasEnoughChars);

  return (
    <div className='relative'>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setIsOpen(false);
          onBlur();
        }}
        autoComplete='off'
        aria-autocomplete='list'
      />

      {shouldShowDropdown ? (
        <div className='absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border/60 bg-background shadow-lg'>
          {isLoading ? (
            <div className='px-3 py-2 text-sm text-muted-foreground'>
              {searchingLabel}
            </div>
          ) : null}

          {!isLoading && items.length === 0 && hasEnoughChars ? (
            <div className='px-3 py-2 text-sm text-muted-foreground'>
              {noResultLabel}
            </div>
          ) : null}

          {!isLoading
            ? items.map((item) => (
                <button
                  type='button'
                  key={item.id}
                  className='block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-accent'
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onSelect(item);
                    setIsOpen(false);
                  }}
                >
                  <p className='font-medium text-foreground'>{item.name}</p>
                  <p className='text-xs text-muted-foreground'>
                    {formatAirportSubLine(item)}
                  </p>
                </button>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
