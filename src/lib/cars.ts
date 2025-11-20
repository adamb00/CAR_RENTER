import { cache } from 'react';

import { getSupabaseServerClient } from '@/lib/supabase/server';

const FALLBACK_IMAGE = '/cars.webp';
const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET && process.env.SUPABASE_STORAGE_BUCKET.trim().length > 0
    ? process.env.SUPABASE_STORAGE_BUCKET.trim()
    : 'images';
const SUPABASE_STORAGE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');

export const CAR_CATEGORIES = ['small', 'medium', 'large', 'suv'] as const;
export const CAR_TRANSMISSIONS = ['manual', 'automatic'] as const;
export const CAR_FUELS = ['petrol', 'diesel', 'electric', 'hybrid'] as const;
export const CAR_STATUSES = ['available', 'rented', 'maintenance', 'inactive', 'reserved'] as const;
export const CAR_BODY_TYPES = ['sedan', 'hatchback', 'suv', 'wagon', 'van', 'pickup', 'coupe'] as const;
export const CAR_TIRE_TYPES = ['summer', 'winter', 'all_season'] as const;
export const CAR_COLORS = ['milky_beige', 'white', 'silver_metal', 'blue', 'metal_blue', 'gray'] as const;

export type CarCategory = (typeof CAR_CATEGORIES)[number];
export type CarTransmission = (typeof CAR_TRANSMISSIONS)[number];
export type CarFuel = (typeof CAR_FUELS)[number];
export type CarStatus = (typeof CAR_STATUSES)[number];
export type CarBodyType = (typeof CAR_BODY_TYPES)[number];
export type CarTireType = (typeof CAR_TIRE_TYPES)[number];
export type CarColor = (typeof CAR_COLORS)[number];

type SupabaseCar = {
  licensePlate: string;
  category: CarCategory;
  manufacturer: string;
  model: string;
  year: number;
  firstRegistration: string;
  bodyType: CarBodyType;
  colors: string[] | null;
  dailyPrices: number[] | null;
  images: string[] | null;
  description: string | null;
  odometer: number;
  seats: number;
  smallLuggage: number;
  largeLuggage: number;
  transmission: CarTransmission;
  fuel: CarFuel;
  vin: string;
  engineNumber: string;
  fleetJoinedAt: string;
  status: CarStatus;
  inspectionValidUntil: string;
  tires: CarTireType;
  nextServiceAt: string | null;
  serviceNotes: string | null;
  notes: string | null;
  knownDamages: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Car = {
  id: string;
  licensePlate: string;
  manufacturer: string;
  model: string;
  name: string;
  year: number;
  firstRegistration: string;
  bodyType: CarBodyType;
  colors: CarColor[];
  dailyPrices: number[];
  pricePerDay: number;
  image: string;
  images: string[];
  description: string | null;
  odometer: number;
  seats: number;
  smallLuggage: number;
  largeLuggage: number;
  category: CarCategory;
  transmission: CarTransmission;
  fuel: CarFuel;
  vin: string;
  engineNumber: string;
  fleetJoinedAt: string;
  status: CarStatus;
  inspectionValidUntil: string;
  tires: CarTireType;
  nextServiceAt: string | null;
  serviceNotes: string | null;
  notes: string | null;
  knownDamages: string | null;
  createdAt: string;
  updatedAt: string;
};

const COLOR_ALIASES: Record<string, CarColor> = {
  silver_metallic: 'silver_metal',
  metallic_blue: 'metal_blue',
  blue_metallic: 'metal_blue',
  blue_metal: 'metal_blue',
  grey: 'gray',
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

const normalizeColor = (value: string): CarColor | null => {
  if ((CAR_COLORS as readonly string[]).includes(value)) {
    return value as CarColor;
  }
  const alias = COLOR_ALIASES[value];
  return alias ?? null;
};

const normalizeColors = (values: string[] | null): CarColor[] => {
  const colors = ensureArray(values)
    .map((color) => normalizeColor(color))
    .filter((color): color is CarColor => Boolean(color));

  return Array.from(new Set(colors));
};

const mapCar = (car: SupabaseCar): Car => {
  const colors = normalizeColors(car.colors);
  const images = normalizeImages(car.images);
  const rawDailyPrices = ensureArray(car.dailyPrices);
  const dailyPrices = rawDailyPrices.filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value)
  );
  const pricePerDay = dailyPrices.length > 0 ? Math.min(...dailyPrices) : 0;

  const image = images.length > 0 ? images[0] : FALLBACK_IMAGE;

  return {
    id: car.licensePlate,
    licensePlate: car.licensePlate,
    manufacturer: car.manufacturer,
    model: car.model,
    name: `${car.manufacturer} ${car.model}`.trim(),
    year: car.year,
    firstRegistration: car.firstRegistration,
    bodyType: car.bodyType,
    colors,
    dailyPrices,
    pricePerDay,
    image,
    images,
    description: car.description,
    odometer: car.odometer,
    seats: car.seats,
    smallLuggage: car.smallLuggage,
    largeLuggage: car.largeLuggage,
    category: car.category,
    transmission: car.transmission,
    fuel: car.fuel,
    vin: car.vin,
    engineNumber: car.engineNumber,
    fleetJoinedAt: car.fleetJoinedAt,
    status: car.status,
    inspectionValidUntil: car.inspectionValidUntil,
    tires: car.tires,
    nextServiceAt: car.nextServiceAt,
    serviceNotes: car.serviceNotes,
    notes: car.notes,
    knownDamages: car.knownDamages,
    createdAt: car.createdAt,
    updatedAt: car.updatedAt,
  };
};

const fetchCars = async (statusFilter?: CarStatus): Promise<Car[]> => {
  const client = getSupabaseServerClient();
  let query = client.from('Cars').select('*').order('manufacturer', { ascending: true }).order('model', {
    ascending: true,
  });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch cars from Supabase: ${error.message}`);
  }

  return (data ?? []).map(mapCar);
};

export const getCars = cache(async (): Promise<Car[]> => {
  return fetchCars('available');
});

export const getCarById = cache(async (id: string): Promise<Car | null> => {
  if (!id) return null;

  const client = getSupabaseServerClient();
  const { data, error } = await client.from('Cars').select('*').eq('licensePlate', id).maybeSingle();

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
