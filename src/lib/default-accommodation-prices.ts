import type { QuoteCarOption } from '@/components/contact/quote.types';

export type AccommodationDailyPrice = {
  days: number;
  price_eur: number;
  full_insurance_eur: number;
};

export type AccommodationDailyPriceByModel = {
  model: string;
  prices: AccommodationDailyPrice[];
};

export const ACCOMMODATION_DAILY_PRICES: AccommodationDailyPriceByModel[] = [
  {
    model: 'KIA PICANTO',
    prices: [
      {
        days: 1,
        price_eur: 59,
        full_insurance_eur: 15,
      },
      {
        days: 2,
        price_eur: 95,
        full_insurance_eur: 24,
      },
      {
        days: 3,
        price_eur: 125,
        full_insurance_eur: 27,
      },
      {
        days: 4,
        price_eur: 165,
        full_insurance_eur: 32,
      },
      {
        days: 5,
        price_eur: 205,
        full_insurance_eur: 37,
      },
      {
        days: 6,
        price_eur: 225,
        full_insurance_eur: 42,
      },
      {
        days: 7,
        price_eur: 235,
        full_insurance_eur: 50,
      },
    ],
  },

  {
    model: 'KIA STONIC',
    prices: [
      {
        days: 1,
        price_eur: 75,
        full_insurance_eur: 15,
      },
      {
        days: 2,
        price_eur: 115,
        full_insurance_eur: 24,
      },
      {
        days: 3,
        price_eur: 145,
        full_insurance_eur: 27,
      },
      {
        days: 4,
        price_eur: 185,
        full_insurance_eur: 32,
      },
      {
        days: 5,
        price_eur: 215,
        full_insurance_eur: 37,
      },
      {
        days: 6,
        price_eur: 235,
        full_insurance_eur: 42,
      },
      {
        days: 7,
        price_eur: 255,
        full_insurance_eur: 50,
      },
    ],
  },
];

const normalizeCarModel = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');

export const getAccommodationModelPriceList = (carName: string) => {
  const normalized = normalizeCarModel(carName);
  return ACCOMMODATION_DAILY_PRICES.find(
    (entry) => normalizeCarModel(entry.model) === normalized,
  );
};

export const getAccommodationPriceForDay = (
  carName: string,
  rentalDays: number,
) => {
  const modelList = getAccommodationModelPriceList(carName);
  if (!modelList) return null;
  return modelList.prices.find((price) => price.days === rentalDays) ?? null;
};

export const filterCarsByAccommodationPriceList = (
  cars: QuoteCarOption[],
): QuoteCarOption[] =>
  cars.filter((car) => Boolean(getAccommodationModelPriceList(car.name)));
