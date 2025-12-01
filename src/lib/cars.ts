import { unstable_cache as cache } from 'next/cache';

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const FALLBACK_IMAGE = '/cars.webp';
const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET && process.env.SUPABASE_STORAGE_BUCKET.trim().length > 0
    ? process.env.SUPABASE_STORAGE_BUCKET.trim()
    : 'images';
const SUPABASE_STORAGE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');

export const CAR_TRANSMISSIONS = ['manual', 'automatic'] as const;
export const CAR_FUELS = ['petrol', 'diesel', 'electric', 'hybrid'] as const;
export const CAR_BODY_TYPES = ['sedan', 'hatchback', 'suv', 'wagon', 'van', 'pickup', 'coupe'] as const;
export const CAR_COLORS = ['milky_beige', 'white', 'silver_metal', 'blue', 'metal_blue', 'gray'] as const;
export const CAR_COLOR_SWATCH: Record<CarColor, string> = {
  milky_beige: '#f5efe6',
  white: '#ffffff',
  silver_metal: '#d9dfe5',
  blue: '#2563eb',
  metal_blue: '#1d3b72',
  gray: '#94a3b8',
};

export type CarTransmission = (typeof CAR_TRANSMISSIONS)[number];
export type CarFuel = (typeof CAR_FUELS)[number];
export type CarBodyType = (typeof CAR_BODY_TYPES)[number];
export type CarColor = (typeof CAR_COLORS)[number];

export type Car = {
  id: string;
  manufacturer: string;
  model: string;
  name: string;
  bodyType: CarBodyType;
  fuel: CarFuel;
  transmission: CarTransmission;
  colors: CarColor[];
  seats: number;
  smallLuggage: number;
  largeLuggage: number;
  image: string;
  images: string[];
  prices: number[];
  createdAt: string;
  updatedAt: string;
};

type PrismaCarWithColors = Prisma.CarGetPayload<{
  include: {
    CarColors: {
      include: {
        Colors: true;
      };
    };
  };
}>;

const ensureArray = <T,>(value: T[] | null | undefined): T[] => {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  return value;
};

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const buildPublicImageUrl = (value: string | null | undefined): string | null => {
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

const COLOR_ALIASES: Record<string, CarColor> = {
  silver_metallic: 'silver_metal',
  metallic_blue: 'metal_blue',
  blue_metallic: 'metal_blue',
  blue_metal: 'metal_blue',
  grey: 'gray',
};

const normalizeColor = (value: string | null | undefined): CarColor | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');

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
  options: readonly T[]
): T => {
  if (typeof value !== 'string') {
    return options[0];
  }
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return (options.includes(normalized as T)
    ? (normalized as T)
    : options[0]) as T;
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

const mapCar = (car: PrismaCarWithColors): Car => {
  const images = normalizeImages(car.images ?? []);
  const relationColors = car.CarColors?.map((relation) => relation.Colors?.name ?? null) ?? [];
  const colors = normalizeColors(relationColors);
  const rawPrices = car.monthlyPrices;
  const prices = normalizePrices(rawPrices);

  const image = images.length > 0 ? images[0] : FALLBACK_IMAGE;

  const isoString = (value: Date | string | null | undefined) =>
    value instanceof Date ? value.toISOString() : value ?? new Date().toISOString();

  const normalizedBodyType = normalizeOption(car.bodyType, CAR_BODY_TYPES);
  const normalizedFuel = normalizeOption(car.fuel, CAR_FUELS);
  const normalizedTransmission = normalizeOption(
    car.transmission,
    CAR_TRANSMISSIONS
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
    createdAt: isoString(car.createdAt),
    updatedAt: isoString(car.updatedAt),
  };
};

const CAR_INCLUDE = {
  CarColors: {
    include: {
      Colors: true,
    },
  },
} as const;

const fetchCars = async (): Promise<Car[]> => {
  const cars = await prisma.car.findMany({
    include: CAR_INCLUDE,
    orderBy: [
      { manufacturer: 'asc' },
      { model: 'asc' },
    ],
  });
  return cars.map(mapCar);
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
  { tags: ['cars'] }
);

export const getCarById = async (id: string): Promise<Car | null> => {
  if (!id) return null;

  return fetchCarById(id);
};
