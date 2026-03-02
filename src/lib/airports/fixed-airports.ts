export type FixedAirportId = 'lanzarote' | 'fuerteventura';

export type FixedAirportOption = {
  id: FixedAirportId;
  locationName: string;
  country: string;
  city: string;
  postalCode: string;
};

export const FIXED_AIRPORT_OPTIONS: readonly FixedAirportOption[] = [
  {
    id: 'lanzarote',
    locationName: 'Lanzarote Airport (ACE)',
    country: 'Spain',
    city: 'Lanzarote',
    postalCode: '35500',
  },
  {
    id: 'fuerteventura',
    locationName: 'Fuerteventura Airport (FUE)',
    country: 'Spain',
    city: 'Fuerteventura',
    postalCode: '35600',
  },
];

export const FIXED_AIRPORT_LOCATION_NAMES = FIXED_AIRPORT_OPTIONS.map(
  (airport) => airport.locationName,
);

export const isFixedAirportLocationName = (
  value?: string | null,
): value is FixedAirportOption['locationName'] =>
  typeof value === 'string' && FIXED_AIRPORT_LOCATION_NAMES.includes(value);

export const getFixedAirportByLocationName = (
  locationName?: string | null,
): FixedAirportOption | undefined =>
  FIXED_AIRPORT_OPTIONS.find((airport) => airport.locationName === locationName);
