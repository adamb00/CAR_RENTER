import { prisma } from './prisma';

const getDailyInsurancePrice = (
  dailyInsurancePrices: unknown,
  days: number,
): number | null => {
  if (
    !dailyInsurancePrices ||
    typeof dailyInsurancePrices !== 'object' ||
    Array.isArray(dailyInsurancePrices)
  ) {
    return null;
  }

  const prices = dailyInsurancePrices as Record<string, unknown>;
  const directPrice = prices[String(days)];

  if (typeof directPrice === 'number' && Number.isFinite(directPrice)) {
    return directPrice;
  }

  const fallback = Object.entries(prices).reduce<{
    day: number;
    price: number;
  } | null>((current, [dayKey, price]) => {
    const day = Number(dayKey);

    if (
      !Number.isFinite(day) ||
      day > days ||
      typeof price !== 'number' ||
      !Number.isFinite(price)
    ) {
      return current;
    }

    if (current && current.day >= day) return current;

    return { day, price };
  }, null);

  return fallback?.price ?? null;
};

export const getInsurancePrice = async (
  age: number | undefined,
  days: number,
): Promise<number | null> => {
  const insurance = await prisma.insurance.findFirst();

  if (!insurance) return null;
  if (!Number.isFinite(days) || days <= 0) return null;

  const {
    underAgeLimit,
    overAgeLimit,
    underAgeMultiplier,
    overAgeMultiplier,
    dailyInsurancePrices,
  } = insurance;

  const insurancePrice = getDailyInsurancePrice(dailyInsurancePrices, days);

  let multiplier = 1;

  let baseInsurance = 0;

  if (typeof age === 'number' && Number.isFinite(age)) {
    if (age <= underAgeLimit) {
      multiplier = underAgeMultiplier;
      if (insurancePrice) baseInsurance = insurancePrice;
    } else if (age >= overAgeLimit) {
      multiplier = overAgeMultiplier;
      if (insurancePrice) baseInsurance = insurancePrice;
    }
  }

  if (insurancePrice === null) return null;

  return baseInsurance + insurancePrice * multiplier;
};
