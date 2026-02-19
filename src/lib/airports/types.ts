export type AirportSuggestion = {
  id: string;
  ident: string;
  iataCode: string;
  name: string;
  municipality: string;
  island: 'lanzarote' | 'fuerteventura';
  country: string;
  isoCountry: string;
  isoRegion: string;
};

export const MIN_AIRPORT_QUERY_LENGTH = 1;
