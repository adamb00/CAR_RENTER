export type AccommodationSource =
  | 'hotel'
  | 'extrahotel'
  | 'vacation_rental';

export type AccommodationSuggestion = {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  municipality: string;
  locality: string;
  island: string;
  province: string;
  country: string;
  source: AccommodationSource;
};

export const MIN_ACCOMMODATION_QUERY_LENGTH = 2;
