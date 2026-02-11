export const CAR_TRANSMISSIONS = ['manual', 'automatic'] as const;
export const CAR_FUELS = ['petrol', 'diesel', 'electric', 'hybrid'] as const;
export const CAR_BODY_TYPES = [
  'sedan',
  'hatchback',
  'suv',
  'wagon',
  'van',
  'pickup',
  'coupe',
] as const;
export const CAR_COLORS = [
  'milky_beige',
  'white',
  'silver_metal',
  'blue',
  'metal_blue',
  'gray',
] as const;

export type CarTransmission = (typeof CAR_TRANSMISSIONS)[number];
export type CarFuel = (typeof CAR_FUELS)[number];
export type CarBodyType = (typeof CAR_BODY_TYPES)[number];
export type CarColor = (typeof CAR_COLORS)[number];

export const CAR_COLOR_SWATCH: Record<CarColor, string> = {
  milky_beige: '#f5efe6',
  white: '#ffffff',
  silver_metal: '#d9dfe5',
  blue: '#2563eb',
  metal_blue: '#1d3b72',
  gray: '#94a3b8',
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
