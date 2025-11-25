import { cache } from 'react';

import { getSupabaseServerClient } from '@/lib/supabase/server';

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

type SupabaseColorValue = {
  name?: string | null;
  key?: string | null;
  value?: string | null;
  color?: {
    name?: string | null;
    key?: string | null;
    value?: string | null;
  } | null;
};

type SupabaseCar = {
  id: string;
  manufacturer: string;
  model: string;
  bodyType: CarBodyType;
  prices?: (number | string | null)[] | number | string | null;
  images: string[] | null;
  seats: number;
  smallLuggage: number;
  largeLuggage: number;
  transmission: CarTransmission;
  fuel: CarFuel;
  colors?: (SupabaseColorValue | string)[] | null;
  createdAt: string;
  updatedAt: string;
};

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

      const candidate = color as SupabaseColorValue;
      const nestedColor =
        candidate.color ??
        (candidate as { Color?: SupabaseColorValue | null }).Color ??
        (candidate as { Colors?: SupabaseColorValue | null }).Colors;
      return (
        candidate.name ??
        candidate.key ??
        candidate.value ??
        nestedColor?.name ??
        nestedColor?.key ??
        nestedColor?.value ??
        null
      );
    })
    .map((value) => normalizeColor(value))
    .filter((value): value is CarColor => Boolean(value));

  return Array.from(new Set(colors));
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

const mapCar = (car: SupabaseCar): Car => {
  const images = normalizeImages(car.images);
  const colors = normalizeColors(
    car.colors ??
      (car as { CarColors?: unknown }).CarColors ??
      (car as { Colors?: unknown }).Colors ??
      (car as { _CarColors?: unknown })._CarColors
  );
  const rawPrices =
    (car as { prices?: unknown; price?: unknown }).prices ??
    (car as { price?: unknown }).price ??
    (car as { Prices?: unknown }).Prices ??
    (car as { PricesPerWeek?: unknown }).PricesPerWeek ??
    (car as { weeklyPrices?: unknown }).weeklyPrices ??
    (car as { weekly_prices?: unknown }).weekly_prices ??
    (car as { monthlyPrices?: unknown }).monthlyPrices ??
    (car as { monthly_prices?: unknown }).monthly_prices;
  const prices = normalizePrices(rawPrices);

  const image = images.length > 0 ? images[0] : FALLBACK_IMAGE;

  return {
    id: car.id,
    manufacturer: car.manufacturer,
    model: car.model,
    name: `${car.manufacturer} ${car.model}`.trim(),
    bodyType: car.bodyType,
    fuel: car.fuel,
    transmission: car.transmission,
    colors,
    seats: car.seats,
    smallLuggage: car.smallLuggage,
    largeLuggage: car.largeLuggage,
    image,
    images,
    prices,
    createdAt: car.createdAt,
    updatedAt: car.updatedAt,
  };
};

const selectColumns = '*, _CarColors(Colors(*))';
const isMissingColorsRelationError = (error: { message?: string; details?: string } | null) => {
  const message = `${error?.message ?? ''} ${error?.details ?? ''}`.toLowerCase();
  return (
    message.includes("relationship between 'cars' and 'colors'") ||
    message.includes('relationship between cars and colors') ||
    message.includes('carcolors') ||
    message.includes('_carcolors')
  );
};

const fetchCars = async (): Promise<Car[]> => {
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from('Cars')
    .select(selectColumns)
    .order('manufacturer', { ascending: true })
    .order('model', { ascending: true });

  if (error && (error.code === '42703' || isMissingColorsRelationError(error))) {
    const fallback = await client
      .from('Cars')
      .select('*')
      .order('manufacturer', { ascending: true })
      .order('model', { ascending: true });

    if (fallback.error) {
      throw new Error(`Failed to fetch cars from Supabase: ${fallback.error.message}`);
    }

    return (fallback.data ?? []).map(mapCar);
  }

  if (error) {
    throw new Error(`Failed to fetch cars from Supabase: ${error.message}`);
  }

  return (data ?? []).map(mapCar);
};

export const getCars = cache(async (): Promise<Car[]> => {
  return fetchCars();
});

export const getCarById = cache(async (id: string): Promise<Car | null> => {
  if (!id) return null;

  const client = getSupabaseServerClient();
  const { data, error } = await client.from('Cars').select(selectColumns).eq('id', id).maybeSingle();

  if (error && (error.code === '42703' || isMissingColorsRelationError(error))) {
    const fallback = await client.from('Cars').select('*').eq('id', id).maybeSingle();
    if (fallback.error) {
      if (fallback.error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch car ${id} from Supabase: ${fallback.error.message}`);
    }
    if (!fallback.data) {
      return null;
    }
    return mapCar(fallback.data as SupabaseCar);
  }

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch car ${id} from Supabase: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapCar(data);
});
