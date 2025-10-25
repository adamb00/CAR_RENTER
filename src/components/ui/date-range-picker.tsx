'use client';

import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import type { Locale as DateFnsLocale } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { JSX } from 'react';
import { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Matcher } from 'react-day-picker';
import { Button } from './button';
import { Calendar } from './calendar';
import { DateInput } from './date-input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface DateRangePickerProps {
  /** Click handler for applying the updates from DateRangePicker. */
  onUpdate?: (values: { range: DateRange; rangeCompare?: DateRange }) => void;
  /** Initial value for start date */
  initialDateFrom?: Date | string;
  /** Initial value for end date */
  initialDateTo?: Date | string;
  /** Initial value for start date for compare */
  initialCompareFrom?: Date | string;
  /** Initial value for end date for compare */
  initialCompareTo?: Date | string;
  /** Alignment of popover */
  align?: 'start' | 'center' | 'end';
  /** Option for locale */
  locale?: string;
  /** Option for showing compare feature */
  showCompare?: boolean;
  /** Smallest selectable date */
  minDate?: Date;
  /** Largest selectable date */
  maxDate?: Date;
  /** Locale for react-day-picker (date-fns locale) */
  calendarLocale?: DateFnsLocale;
  /** Label for the cancel action */
  cancelLabel?: string;
  /** Label for the apply action */
  applyLabel?: string;
  /** Separator string between the start and end date */
  rangeSeparator?: string;
}

const formatDate = (date: Date, locale: string = 'en-us'): string => {
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getDateAdjustedForTimezone = (dateInput: Date | string): Date => {
  if (typeof dateInput === 'string') {
    // Split the date string to get year, month, and day parts
    const parts = dateInput.split('-').map((part) => parseInt(part, 10));
    // Create a new Date object using the local timezone
    // Note: Month is 0-indexed, so subtract 1 from the month part
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date;
  } else {
    // If dateInput is already a Date object, return it directly
    return dateInput;
  }
};

interface DateRange {
  from: Date;
  to: Date | undefined;
}

/** The DateRangePicker component allows a user to select a range of dates */
export const DateRangePicker: FC<DateRangePickerProps> & {
  filePath: string;
} = ({
  initialDateFrom = new Date(new Date().setHours(0, 0, 0, 0)),
  initialDateTo,
  initialCompareFrom,
  initialCompareTo,
  onUpdate,
  align = 'start',
  locale = 'en-US',
  showCompare = true,
  minDate,
  maxDate,
  calendarLocale = enUS,
  cancelLabel = 'Cancel',
  applyLabel = 'Update',
  rangeSeparator = ' - ',
}): JSX.Element => {
  const normalizedMinDate = useMemo(() => {
    if (!minDate) return null;
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    return min;
  }, [minDate]);

  const normalizedMaxDate = useMemo(() => {
    if (maxDate) {
      const max = new Date(maxDate);
      max.setHours(0, 0, 0, 0);
      return max;
    }
    if (normalizedMinDate) {
      const fallback = new Date(normalizedMinDate);
      fallback.setFullYear(fallback.getFullYear() + 1);
      return fallback;
    }
    return null;
  }, [maxDate, normalizedMinDate]);

  const normalizeDate = useCallback((date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }, []);

  const clampDate = useCallback(
    (date: Date): Date => {
      const normalized = normalizeDate(date);
      if (normalizedMinDate && normalized < normalizedMinDate) {
        return new Date(normalizedMinDate);
      }
      if (normalizedMaxDate && normalized > normalizedMaxDate) {
        return new Date(normalizedMaxDate);
      }
      return normalized;
    },
    [normalizeDate, normalizedMaxDate, normalizedMinDate]
  );

  const clampRange = useCallback(
    (value: DateRange): DateRange => {
      const from = clampDate(value.from);
      const maybeTo = value.to ? clampDate(value.to) : undefined;
      const to = maybeTo && maybeTo < from ? from : maybeTo;
      return { from, to };
    },
    [clampDate]
  );

  const datesEqual = useCallback((a?: Date, b?: Date): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a.getTime() === b.getTime();
  }, []);

  const resolveDateInput = useCallback(
    (input: Date | string | undefined, fallback: Date): Date => {
      if (input == null) {
        return new Date(fallback);
      }
      const resolved =
        typeof input === 'string'
          ? input.trim().length > 0
            ? getDateAdjustedForTimezone(input)
            : fallback
          : input;
      const date = new Date(resolved);
      if (Number.isNaN(date.getTime())) {
        return new Date(fallback);
      }
      return date;
    },
    []
  );

  const [isOpen, setIsOpen] = useState(false);

  const [range, setRange] = useState<DateRange>(() => {
    const fallbackStart = normalizedMinDate ?? normalizeDate(new Date());
    const fromBase = resolveDateInput(initialDateFrom, fallbackStart);
    const toBase =
      initialDateTo != null
        ? resolveDateInput(initialDateTo, fromBase)
        : new Date(fromBase);
    return clampRange({ from: fromBase, to: toBase });
  });

  const [rangeCompare, setRangeCompare] = useState<DateRange | undefined>(
    () => {
      if (!showCompare || !initialCompareFrom) return undefined;
      const fallbackStart = normalizedMinDate ?? normalizeDate(new Date());
      const fromBase = resolveDateInput(initialCompareFrom, fallbackStart);
      const toBase =
        initialCompareTo != null
          ? resolveDateInput(initialCompareTo, fromBase)
          : new Date(fromBase);
      return clampRange({ from: fromBase, to: toBase });
    }
  );

  // Refs to store the values of range and rangeCompare when the date picker is opened
  const openedRangeRef = useRef<DateRange | undefined>(undefined);
  const openedRangeCompareRef = useRef<DateRange | undefined>(undefined);

  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 960 : false
  );

  useEffect(() => {
    const handleResize = (): void => {
      setIsSmallScreen(window.innerWidth < 960);
    };

    window.addEventListener('resize', handleResize);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const resetValues = (): void => {
    const fallbackStart = normalizedMinDate ?? normalizeDate(new Date());
    const baseFrom = resolveDateInput(initialDateFrom, fallbackStart);
    const baseTo =
      initialDateTo != null
        ? resolveDateInput(initialDateTo, baseFrom)
        : new Date(baseFrom);
    setRange(clampRange({ from: baseFrom, to: baseTo }));

    if (showCompare && initialCompareFrom) {
      const compareFrom = resolveDateInput(initialCompareFrom, fallbackStart);
      const compareTo =
        initialCompareTo != null
          ? resolveDateInput(initialCompareTo, compareFrom)
          : new Date(compareFrom);
      setRangeCompare(clampRange({ from: compareFrom, to: compareTo }));
    } else {
      setRangeCompare(undefined);
    }
  };
  // Helper function to check if two date ranges are equal
  const areRangesEqual = useCallback(
    (a?: DateRange, b?: DateRange): boolean => {
      if (!a || !b) return a === b;
      return (
        a.from.getTime() === b.from.getTime() &&
        (!a.to || !b.to || a.to.getTime() === b.to.getTime())
      );
    },
    []
  );

  useEffect(() => {
    setRange((prev) => {
      const clamped = clampRange(prev);
      if (
        datesEqual(prev.from, clamped.from) &&
        datesEqual(prev.to, clamped.to)
      ) {
        return prev;
      }
      return clamped;
    });

    setRangeCompare((prev) => {
      if (!prev) return prev;
      const clamped = clampRange(prev);
      if (
        datesEqual(prev.from, clamped.from) &&
        datesEqual(prev.to, clamped.to)
      ) {
        return prev;
      }
      return clamped;
    });
  }, [clampRange, datesEqual]);

  useEffect(() => {
    if (isOpen) return;

    const fallbackStart = normalizedMinDate ?? normalizeDate(new Date());
    const fromBase = resolveDateInput(initialDateFrom, fallbackStart);
    const toBase =
      initialDateTo != null
        ? resolveDateInput(initialDateTo, fromBase)
        : new Date(fromBase);
    const nextRange = clampRange({ from: fromBase, to: toBase });

    setRange((prevRange) =>
      areRangesEqual(prevRange, nextRange) ? prevRange : nextRange
    );

    if (showCompare && initialCompareFrom) {
      const compareFrom = resolveDateInput(initialCompareFrom, fallbackStart);
      const compareTo =
        initialCompareTo != null
          ? resolveDateInput(initialCompareTo, compareFrom)
          : new Date(compareFrom);
      const nextCompare = clampRange({ from: compareFrom, to: compareTo });
      setRangeCompare((prevCompare) =>
        areRangesEqual(prevCompare, nextCompare) ? prevCompare : nextCompare
      );
    } else if (rangeCompare) {
      setRangeCompare(undefined);
    }
  }, [
    initialDateFrom,
    initialDateTo,
    initialCompareFrom,
    initialCompareTo,
    showCompare,
    normalizedMinDate,
    isOpen,
    rangeCompare,
    clampRange,
    resolveDateInput,
    normalizeDate,
    areRangesEqual,
  ]);

  useEffect(() => {
    if (isOpen) {
      openedRangeRef.current = range;
      openedRangeCompareRef.current = rangeCompare;
    }
  }, [isOpen, range, rangeCompare]);

  const disabledDays = useMemo(() => {
    const matchers: Matcher[] = [];
    if (normalizedMinDate) matchers.push({ before: normalizedMinDate });
    if (normalizedMaxDate) matchers.push({ after: normalizedMaxDate });
    return matchers.length > 0 ? matchers : undefined;
  }, [normalizedMinDate, normalizedMaxDate]);

  const fromMonth = useMemo(() => {
    if (!normalizedMinDate) return undefined;
    return new Date(
      normalizedMinDate.getFullYear(),
      normalizedMinDate.getMonth(),
      1
    );
  }, [normalizedMinDate]);

  const toMonth = useMemo(() => {
    if (!normalizedMaxDate) return undefined;
    return new Date(
      normalizedMaxDate.getFullYear(),
      normalizedMaxDate.getMonth(),
      1
    );
  }, [normalizedMaxDate]);

  const initialMonth = useMemo(() => {
    const base = new Date(range.from);
    if (!isSmallScreen) {
      base.setMonth(base.getMonth() - 1);
    }
    if (fromMonth && base < fromMonth) {
      return new Date(fromMonth);
    }
    if (toMonth && base > toMonth) {
      return new Date(toMonth);
    }
    return base;
  }, [fromMonth, isSmallScreen, range.from, toMonth]);

  const calendarFormatters = useMemo(
    () => ({
      formatMonthDropdown: (date: Date) =>
        date.toLocaleString(locale, { month: 'short' }),
    }),
    [locale]
  );

  const renderRangeLabel = (value: DateRange): string => {
    const formattedFrom = formatDate(value.from, locale);
    const formattedTo =
      value.to != null
        ? `${rangeSeparator}${formatDate(value.to, locale)}`
        : '';
    return `${formattedFrom}${formattedTo}`;
  };

  return (
    <Popover
      modal={true}
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          resetValues();
        }
        setIsOpen(open);
      }}
    >
      <PopoverTrigger asChild>
        <Button size={'lg'} variant='outline'>
          <div className='text-right'>
            <div className='py-1'>
              <div>{renderRangeLabel(range)}</div>
            </div>
          </div>
          <div className='pl-1 opacity-60 -mr-2 scale-125'>
            {isOpen ? (
              <ChevronUpIcon width={24} />
            ) : (
              <ChevronDownIcon width={24} />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className='w-auto'>
        <div className='flex py-2'>
          <div className='flex'>
            <div className='flex flex-col'>
              <div className='flex flex-col lg:flex-row gap-2 px-3 justify-end items-center lg:items-start pb-4 lg:pb-0'>
                <div className='flex flex-col gap-2'>
                  {showCompare && rangeCompare != null && (
                    <div className='flex gap-2'>
                      <DateInput
                        value={rangeCompare?.from}
                        onChange={(date) => {
                          const safeFrom = clampDate(date);
                          setRangeCompare((prevRangeCompare) => {
                            if (prevRangeCompare) {
                              const existingTo = prevRangeCompare.to
                                ? clampDate(prevRangeCompare.to)
                                : undefined;
                              const safeTo =
                                existingTo && existingTo < safeFrom
                                  ? safeFrom
                                  : existingTo;
                              return {
                                from: safeFrom,
                                to: safeTo,
                              };
                            }
                            return {
                              from: safeFrom,
                              to: safeFrom,
                            };
                          });
                        }}
                      />
                      <div className='py-1'>-</div>
                      <DateInput
                        value={rangeCompare?.to}
                        onChange={(date) => {
                          if (!rangeCompare || !rangeCompare.from) return;
                          const safeTo = clampDate(date);
                          const safeFrom = clampDate(rangeCompare.from);
                          const adjustedFrom =
                            safeTo < safeFrom ? safeTo : safeFrom;
                          setRangeCompare({
                            from: adjustedFrom,
                            to: safeTo,
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Calendar
                  mode='range'
                  disabled={disabledDays}
                  fromMonth={fromMonth}
                  toMonth={toMonth}
                  locale={calendarLocale}
                  formatters={calendarFormatters}
                  onSelect={(value: { from?: Date; to?: Date } | undefined) => {
                    if (value?.from) {
                      const nextFrom = clampDate(value.from);
                      const nextTo = value?.to
                        ? clampDate(value.to)
                        : undefined;
                      setRange({
                        from: nextFrom,
                        to: nextTo && nextTo < nextFrom ? nextFrom : nextTo,
                      });
                    }
                  }}
                  selected={range}
                  numberOfMonths={isSmallScreen ? 1 : 2}
                  defaultMonth={initialMonth}
                />
              </div>
            </div>
          </div>
        </div>
        <div className='flex justify-end gap-2 py-2 pr-4'>
          <Button
            onClick={() => {
              setIsOpen(false);
              resetValues();
            }}
            variant='ghost'
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={() => {
              setIsOpen(false);
              if (
                !areRangesEqual(range, openedRangeRef.current) ||
                !areRangesEqual(rangeCompare, openedRangeCompareRef.current)
              ) {
                onUpdate?.({ range, rangeCompare });
              }
            }}
          >
            {applyLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

DateRangePicker.displayName = 'DateRangePicker';
DateRangePicker.filePath =
  'libs/shared/ui-kit/src/lib/date-range-picker/date-range-picker.tsx';
