'use client';

import React from 'react';
import PlacesAutocomplete from 'react-places-autocomplete';

import { Input } from '../ui/input';

type DeliveryAddressAutocompleteInputProps = {
  disabled?: boolean;
  value: string;
  placeholder: string;
  searchingLabel: string;
  noResultLabel: string;
  onChange: (value: string) => void;
  onSelect: (address: string, placeId?: string) => void | Promise<void>;
};

const searchOptions = {
  componentRestrictions: { country: 'es' },
  types: ['address'],
};

const handlePlacesError = (
  status: string,
  clearSuggestions: () => void,
): void => {
  clearSuggestions();

  if (status === 'ZERO_RESULTS') return;

  console.error('Google Places address lookup failed', status);
};

export default function DeliveryAddressAutocompleteInput({
  disabled = false,
  value,
  placeholder,
  searchingLabel,
  noResultLabel,
  onChange,
  onSelect,
}: DeliveryAddressAutocompleteInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const hasEnoughChars = value.trim().length >= 3;

  if (disabled) {
    return (
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        autoComplete='street-address'
      />
    );
  }

  return (
    <PlacesAutocomplete
      value={value}
      onChange={(nextValue) => {
        onChange(nextValue);
        setIsOpen(true);
      }}
      onSelect={async (address, placeId) => {
        await onSelect(address, placeId);
        setIsOpen(false);
      }}
      searchOptions={searchOptions}
      debounce={200}
      highlightFirstSuggestion
      onError={handlePlacesError}
    >
      {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
        <div className='relative'>
          <Input
            {...getInputProps({
              placeholder,
              autoComplete: 'off',
              'aria-autocomplete': 'list',
              onFocus: () => setIsOpen(true),
              onBlur: () => setIsOpen(false),
            })}
          />
          {isOpen && (loading || suggestions.length > 0 || hasEnoughChars) && (
            <div className='absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border/60 bg-background shadow-lg'>
              {loading ? (
                <div className='px-3 py-2 text-sm text-muted-foreground'>
                  {searchingLabel}
                </div>
              ) : null}
              {!loading && suggestions.length === 0 && hasEnoughChars ? (
                <div className='px-3 py-2 text-sm text-muted-foreground'>
                  {noResultLabel}
                </div>
              ) : null}
              {!loading
                ? suggestions.map((suggestion) => {
                    const itemProps = getSuggestionItemProps(suggestion, {
                      className:
                        'cursor-pointer px-3 py-2 text-sm hover:bg-accent',
                    });
                    const { key, ...restProps } = itemProps as {
                      key?: React.Key;
                      [prop: string]: unknown;
                    };
                    const normalizedKey =
                      key != null
                        ? String(key)
                        : (suggestion.placeId ?? suggestion.description);

                    return (
                      <div key={normalizedKey} {...restProps}>
                        {suggestion.description}
                      </div>
                    );
                  })
                : null}
            </div>
          )}
        </div>
      )}
    </PlacesAutocomplete>
  );
}
