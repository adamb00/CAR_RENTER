import { unstable_cache as cache } from 'next/cache';

import {
  CAR_BODY_TYPES,
  CAR_COLOR_SWATCH,
  CAR_COLORS,
  CAR_FUELS,
  CAR_TRANSMISSIONS,
  type Car,
  type CarBodyType,
  type CarColor,
  type CarFuel,
  type CarTransmission,
} from '@/lib/cars-shared';
import { prisma } from '@/lib/prisma';
import { RENT_STATUS_CANCELLED } from '@/lib/requestStatus';
import type { Prisma } from '@prisma/client';

const FALLBACK_IMAGE = '/cars.webp';
const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET &&
  process.env.SUPABASE_STORAGE_BUCKET.trim().length > 0
    ? process.env.SUPABASE_STORAGE_BUCKET.trim()
    : 'images';
const SUPABASE_STORAGE_URL = (process.env.SUPABASE_URL ?? '').replace(
  /\/$/,
  '',
);

export {
  CAR_BODY_TYPES,
  CAR_COLOR_SWATCH,
  CAR_COLORS,
  CAR_FUELS,
  CAR_TRANSMISSIONS,
};
export type { Car, CarBodyType, CarColor, CarFuel, CarTransmission };

type PrismaCarWithColors = Prisma.CarGetPayload<{
  include: {
    Colors: true;
  };
}>;

type CarAvailability = {
  availableCount?: number;
};

export type CarActionPromotion = {
  id: string;
  island: string;
  carId: string;
  carName: string;
  date: string;
  endDate: string;
  price: number;
  image: string;
  seats: number;
  smallLuggage: number;
  largeLuggage: number;
};

const ensureArray = <T>(value: T[] | null | undefined): T[] => {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  return value;
};

const normalizeDailyMultipliers = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] =>
        typeof entry[1] === 'number' && Number.isFinite(entry[1]),
    ),
  );
};

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const buildPublicImageUrl = (
  value: string | null | undefined,
): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isAbsoluteUrl(trimmed)) {
    return trimmed;
  }

  const normalized = trimmed.replace(/^\/+/, '');

  if (!SUPABASE_STORAGE_URL) {
    return `/${normalized}`;
  }

  return `${SUPABASE_STORAGE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${normalized}`;
};

const normalizeImages = (values: string[] | null): string[] => {
  const images = ensureArray(values)
    .map((value) => buildPublicImageUrl(value))
    .filter((url): url is string => Boolean(url));

  return Array.from(new Set(images));
};

const formatDateParam = (date: Date): string => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number): Date => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const DAY_MS = 1000 * 60 * 60 * 24;

const parseDateParam = (date: string): Date =>
  new Date(`${date}T00:00:00.000Z`);

const isNextDate = (previousDate: string, nextDate: string): boolean =>
  parseDateParam(nextDate).getTime() -
    parseDateParam(previousDate).getTime() ===
  DAY_MS;

const COLOR_ALIASES: Record<string, CarColor> = {
  silver_metallic: 'silver_metal',
  metallic_blue: 'metal_blue',
  blue_metallic: 'metal_blue',
  blue_metal: 'metal_blue',
  grey: 'gray',
};

const normalizeColor = (value: string | null | undefined): CarColor | null => {
  if (!value) return null;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if ((CAR_COLORS as readonly string[]).includes(normalized)) {
    return normalized as CarColor;
  }

  const alias = COLOR_ALIASES[normalized];
  return alias ?? null;
};

const normalizeColors = (values: unknown): CarColor[] => {
  if (!Array.isArray(values)) return [];

  const colors = values
    .map((color) => {
      if (typeof color === 'string') return color;
      if (!color || typeof color !== 'object') return null;

      const candidate = color as Record<string, unknown>;
      const nestedColor =
        candidate.color ?? candidate.Color ?? candidate.Colors;
      const nestedRecord =
        nestedColor && typeof nestedColor === 'object'
          ? (nestedColor as Record<string, unknown>)
          : null;

      const value =
        candidate.name ??
        candidate.key ??
        candidate.value ??
        nestedRecord?.name ??
        nestedRecord?.key ??
        nestedRecord?.value ??
        null;

      return typeof value === 'string' ? value : null;
    })
    .map((value) => normalizeColor(value))
    .filter((value): value is CarColor => Boolean(value));

  return Array.from(new Set(colors));
};

const normalizeOption = <T extends string>(
  value: string | null | undefined,
  options: readonly T[],
): T => {
  if (typeof value !== 'string') {
    return options[0];
  }
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return (
    options.includes(normalized as T) ? (normalized as T) : options[0]
  ) as T;
};

const normalizePrices = (value: unknown): number[] => {
  const prices: number[] = [];

  const addIfNumber = (candidate: unknown) => {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      prices.push(candidate);
      return;
    }
    if (typeof candidate === 'string') {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed)) {
        prices.push(parsed);
      }
    }
  };

  const extractFromObject = (obj: Record<string, unknown>) => {
    const candidates = [
      obj.price,
      obj.amount,
      obj.value,
      obj.weekly,
      obj.week,
      (obj as { eur?: unknown }).eur,
    ];
    candidates.forEach(addIfNumber);
    Object.values(obj).forEach(addIfNumber);
  };

  if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        extractFromObject(entry as Record<string, unknown>);
        return;
      }
      addIfNumber(entry);
    });
    return prices;
  }

  if (value && typeof value === 'object') {
    extractFromObject(value as Record<string, unknown>);
    return prices;
  }

  addIfNumber(value);

  return prices;
};

const mapCar = (
  car: PrismaCarWithColors,
  availability: CarAvailability = {},
): Car => {
  const images = normalizeImages(car.images ?? []);
  const relationColors = car.Colors?.map((color) => color.name ?? null) ?? [];
  const colors = normalizeColors(relationColors);
  const rawPrices = car.monthlyPrices;
  const prices = normalizePrices(rawPrices);

  const image = images.length > 0 ? images[0] : FALLBACK_IMAGE;

  const isoString = (value: Date | string | null | undefined) =>
    value instanceof Date
      ? value.toISOString()
      : (value ?? new Date().toISOString());

  const normalizedBodyType = normalizeOption(car.bodyType, CAR_BODY_TYPES);
  const normalizedFuel = normalizeOption(car.fuel, CAR_FUELS);
  const normalizedTransmission = normalizeOption(
    car.transmission,
    CAR_TRANSMISSIONS,
  );

  return {
    id: car.id,
    manufacturer: car.manufacturer,
    model: car.model,
    name: `${car.manufacturer} ${car.model}`.trim(),
    bodyType: normalizedBodyType,
    fuel: normalizedFuel,
    transmission: normalizedTransmission,
    colors,
    seats: car.seats,
    smallLuggage: car.smallLuggage,
    largeLuggage: car.largeLuggage,
    image,
    images,
    prices,
    dailyMultiplier: normalizeDailyMultipliers(car.dailyMultiplier),
    createdAt: isoString(car.createdAt),
    updatedAt: isoString(car.updatedAt),
    availableCount: availability.availableCount,
  };
};

const CAR_INCLUDE = {
  Colors: true,
} as const;

export const fetchCars = async (
  startDate?: string,
  endDate?: string,
): Promise<Car[]> => {
  const hasDateRange = Boolean(startDate && endDate);
  const requestedStart = hasDateRange ? new Date(startDate as string) : null;
  const requestedEnd = hasDateRange ? new Date(endDate as string) : null;

  const cars = await prisma.car.findMany({
    include: {
      ...CAR_INCLUDE,
      FleetVehicles: true,
    },
    orderBy: [{ manufacturer: 'asc' }, { model: 'asc' }],
  });

  if (
    !requestedStart ||
    !requestedEnd ||
    Number.isNaN(requestedStart.getTime()) ||
    Number.isNaN(requestedEnd.getTime()) ||
    requestedStart > requestedEnd
  ) {
    return cars.map((car) => mapCar(car));
  }

  const fleetVehicleIds = cars.flatMap((car) =>
    car.FleetVehicles.filter((vehicle) => vehicle.status !== 'maintenance').map(
      (vehicle) => vehicle.id,
    ),
  );

  const rentalsInRange =
    fleetVehicleIds.length > 0
      ? await prisma.rentRequest.findMany({
          where: {
            archivedAt: null,
            status: { not: RENT_STATUS_CANCELLED },
            assignedFleetVehicleId: { in: fleetVehicleIds },
            rentalStart: { lte: requestedEnd },
            rentalEnd: { gte: requestedStart },
          },
          select: {
            assignedFleetVehicleId: true,
          },
        })
      : [];

  const blockedVehicleIds = new Set(
    rentalsInRange
      .map((rental) => rental.assignedFleetVehicleId)
      .filter((vehicleId): vehicleId is string => Boolean(vehicleId)),
  );

  return cars.map((car) => {
    const availableCount = car.FleetVehicles.filter(
      (vehicle) =>
        vehicle.status !== 'maintenance' && !blockedVehicleIds.has(vehicle.id),
    ).length;

    return mapCar(car, { availableCount });
  });
};

const fetchCarById = async (id: string): Promise<Car | null> => {
  const car = await prisma.car.findUnique({
    where: { id },
    include: CAR_INCLUDE,
  });
  return car ? mapCar(car) : null;
};

export const getCars = cache(
  async (): Promise<Car[]> => {
    return fetchCars();
  },
  ['cars'],
  { tags: ['cars'], revalidate: 60 },
);

export const getCarById = cache(
  async (id: string): Promise<Car | null> => {
    if (!id) return null;
    return fetchCarById(id);
  },
  ['car-by-id'],
  { tags: ['cars'] },
);

export const getCarPrice = async (
  island?: string,
  startDate?: string,
  endDate?: string,
) => {
  if (!startDate || !island || !endDate) {
    return [];
  }

  return await prisma.carPrices.findMany({
    where: {
      island: island,
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    },
    orderBy: { date: 'asc' },
  });
};

export const getCarActions = async (): Promise<CarActionPromotion[]> => {
  const actions = await prisma.carPrices.findMany({
    where: { action: true, date: { gte: new Date() } },
    include: { Cars: true },
    orderBy: [
      { island: 'asc' },
      { carId: 'asc' },
      { price: 'asc' },
      { date: 'asc' },
    ],
  });

  const promotions = actions.reduce<CarActionPromotion[]>((items, action) => {
    const images = normalizeImages(action.Cars.images ?? []);
    const startDate = formatDateParam(action.date);
    const previousPromotion = items.at(-1);

    if (
      previousPromotion &&
      previousPromotion.island === action.island &&
      previousPromotion.carId === action.carId &&
      previousPromotion.price === action.price &&
      isNextDate(previousPromotion.endDate, startDate)
    ) {
      previousPromotion.endDate = startDate;
      return items;
    }

    items.push({
      id: action.id,
      island: action.island,
      carId: action.carId,
      carName: `${action.Cars.manufacturer} ${action.Cars.model}`,
      date: startDate,
      endDate: startDate,
      price: action.price,
      image: images[0] ?? FALLBACK_IMAGE,
      seats: action.Cars.seats,
      smallLuggage: action.Cars.smallLuggage,
      largeLuggage: action.Cars.largeLuggage,
    });

    return items;
  }, []);

  return promotions
    .map((promotion) => ({
      ...promotion,
      endDate: formatDateParam(addDays(parseDateParam(promotion.endDate), 1)),
    }))
    .sort((first, second) => first.date.localeCompare(second.date));
};
