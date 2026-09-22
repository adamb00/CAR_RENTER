import { prisma } from '@/lib/prisma';

type DeliveryPriceCandidate = {
  city: string;
  price: number;
};

export type DeliveryPriceEstimate = {
  city: string;
  price: number;
  distanceKm?: number;
};

type DeliveryPriceLookupInput = {
  address?: string;
  city?: string;
  island?: string;
};

type Coordinates = {
  lat: number;
  lng: number;
};

type DeliveryPriceDistanceCandidate = DeliveryPriceEstimate & {
  distanceKm: number;
};

type GeocodeResponse = {
  status: string;
  results?: Array<{
    geometry?: {
      location?: Coordinates;
    };
  }>;
};

const geocodeCache = new Map<string, Coordinates | null>();

const CANARY_ISLANDS_BOUNDS = {
  north: 29.5,
  south: 27.5,
  east: -13.0,
  west: -18.5,
};

const ISLAND_BOUNDS: Record<
  string,
  { north: number; south: number; east: number; west: number }
> = {
  fuerteventura: {
    north: 28.82,
    south: 27.98,
    east: -13.72,
    west: -14.6,
  },
  lanzarote: {
    north: 29.32,
    south: 28.82,
    east: -13.33,
    west: -13.96,
  },
};

const normalizeCity = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ');

const getEditDistance = (left: string, right: string): number => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost,
      );
    }

    for (let index = 0; index < previous.length; index += 1) {
      previous[index] = current[index];
    }
  }

  return previous[right.length] ?? 0;
};

const getCityScore = (query: string, candidate: string): number => {
  if (query === candidate) return 0;
  if (candidate.includes(query) || query.includes(candidate)) return 0.1;

  const distance = getEditDistance(query, candidate);
  return distance / Math.max(query.length, candidate.length, 1);
};

const getGoogleMapsApiKey = (): string | undefined =>
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const toIslandKey = (island?: string): string => normalizeCity(island ?? '');

const getBoundsForIsland = (
  island?: string,
): { north: number; south: number; east: number; west: number } =>
  ISLAND_BOUNDS[toIslandKey(island)] ?? CANARY_ISLANDS_BOUNDS;

const getIslandName = (island?: string): string => {
  const islandKey = toIslandKey(island);
  if (islandKey === 'fuerteventura') return 'Fuerteventura';
  if (islandKey === 'lanzarote') return 'Lanzarote';
  return '';
};

const buildGeocodeUrl = (
  query: string,
  apiKey: string,
  island?: string,
): string => {
  const bounds = getBoundsForIsland(island);
  const params = new URLSearchParams({
    address: query,
    key: apiKey,
    region: 'es',
    components: 'country:ES',
  });

  params.set(
    'bounds',
    `${bounds.south},${bounds.west}|${bounds.north},${bounds.east}`,
  );

  return `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
};

const geocodeLocation = async (
  query: string,
  island?: string,
): Promise<Coordinates | null> => {
  const normalizedQuery = normalizeCity(query);
  if (!normalizedQuery) return null;

  const cacheKey = `${normalizedQuery}:${toIslandKey(island)}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    geocodeCache.set(cacheKey, null);
    return null;
  }

  try {
    const response = await fetch(buildGeocodeUrl(query, apiKey, island), {
      next: { revalidate: 60 * 60 * 24 * 30 },
    });

    if (!response.ok) {
      geocodeCache.set(cacheKey, null);
      return null;
    }

    const payload = (await response.json()) as GeocodeResponse;
    const location = payload.results?.[0]?.geometry?.location ?? null;

    geocodeCache.set(cacheKey, location);
    return location;
  } catch (error) {
    console.error('Delivery city geocoding failed', error);
    geocodeCache.set(cacheKey, null);
    return null;
  }
};

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const getDistanceKm = (from: Coordinates, to: Coordinates): number => {
  const earthRadiusKm = 6371;
  const latDistance = toRadians(to.lat - from.lat);
  const lngDistance = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);

  const haversine =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(fromLat) *
      Math.cos(toLat) *
      Math.sin(lngDistance / 2) *
      Math.sin(lngDistance / 2);

  return (
    earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
};

const findNearestByText = (
  normalizedCity: string,
  prices: DeliveryPriceCandidate[],
): DeliveryPriceEstimate | null => {
  const nearest = prices
    .map((candidate) => ({
      ...candidate,
      score: getCityScore(normalizedCity, normalizeCity(candidate.city)),
    }))
    .sort((left, right) => left.score - right.score)[0];

  if (!nearest) return null;

  return {
    city: nearest.city,
    price: nearest.price,
  };
};

const findNearestByCoordinates = async (
  input: DeliveryPriceLookupInput,
  prices: DeliveryPriceCandidate[],
): Promise<DeliveryPriceEstimate | null> => {
  const islandName = getIslandName(input.island);
  const addressQuery = input.address?.trim();
  const cityQuery = input.city?.trim();
  const lookupQuery =
    addressQuery ||
    [cityQuery, islandName, 'Canary Islands', 'Spain']
      .filter(Boolean)
      .join(', ');
  const lookupCoordinates = await geocodeLocation(lookupQuery, input.island);
  if (!lookupCoordinates) return null;

  const candidates = await Promise.all(
    prices.map(async (candidate) => {
      const candidateQuery = [candidate.city, islandName, 'Canary Islands', 'Spain']
        .filter(Boolean)
        .join(', ');
      const coordinates = await geocodeLocation(candidateQuery, input.island);
      if (!coordinates) return null;

      return {
        city: candidate.city,
        price: candidate.price,
        distanceKm: getDistanceKm(lookupCoordinates, coordinates),
      };
    }),
  );

  const nearest = candidates
    .filter(
      (candidate): candidate is DeliveryPriceDistanceCandidate =>
        candidate !== null,
    )
    .sort((left, right) => {
      const distanceDiff = (left.distanceKm ?? 0) - (right.distanceKm ?? 0);
      if (distanceDiff !== 0) return distanceDiff;
      return left.price - right.price;
    })[0];

  return nearest ?? null;
};

export const findNearestDeliveryPrice = async (
  input: DeliveryPriceLookupInput,
): Promise<DeliveryPriceEstimate | null> => {
  const city = input.city ?? input.address ?? '';
  const normalizedCity = normalizeCity(city);
  if (!normalizedCity) return null;

  const prices = (await prisma.deliveryPrices.findMany({
    select: {
      city: true,
      price: true,
    },
  })) as DeliveryPriceCandidate[];

  if (prices.length === 0) return null;

  return (
    (await findNearestByCoordinates(input, prices)) ??
    findNearestByText(normalizedCity, prices)
  );
};
