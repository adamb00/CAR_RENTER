import 'server-only';

import {
  type AirportSuggestion,
  MIN_AIRPORT_QUERY_LENGTH,
} from './types';

type AirportRecord = AirportSuggestion & {
  searchIndex: string;
  normalizedName: string;
};

type SearchAirportsParams = {
  query: string;
  limit?: number;
};

type CsvRow = Record<string, string>;

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

const AIRPORTS_CSV_URL =
  process.env.OURAIRPORTS_CSV_URL?.trim() ||
  'https://ourairports.com/data/airports.csv';

const ALLOWED_IATA = new Set(['ACE', 'FUE']);
const ALLOWED_ICAO = new Set(['GCRR', 'GCFV']);

let cache: {
  expiresAt: number;
  value: AirportRecord[];
} | null = null;
let loadPromise: Promise<AirportRecord[]> | null = null;

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const clean = (value: string | undefined): string => {
  if (!value) return '';
  return value.replace(/^\uFEFF/, '').trim();
};

const parseCsv = (content: string): CsvRow[] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];

    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        currentField += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ',') {
      currentRow.push(currentField);
      currentField = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && content[i + 1] === '\n') {
        i += 1;
      }
      currentRow.push(currentField);
      currentField = '';
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  const [rawHeaders, ...rawRows] = rows;
  const headers = rawHeaders.map((header) => clean(header));

  return rawRows.map((row) => {
    const record: CsvRow = {};
    headers.forEach((header, idx) => {
      record[header] = clean(row[idx]);
    });
    return record;
  });
};

const resolveIsland = (row: CsvRow): 'lanzarote' | 'fuerteventura' | null => {
  const name = normalize(row.name || '');
  const municipality = normalize(row.municipality || '');
  const ident = clean(row.ident).toUpperCase();
  const iata = clean(row.iata_code).toUpperCase();

  if (
    iata === 'ACE' ||
    ident === 'GCRR' ||
    name.includes('lanzarote') ||
    municipality.includes('lanzarote')
  ) {
    return 'lanzarote';
  }

  if (
    iata === 'FUE' ||
    ident === 'GCFV' ||
    name.includes('fuerteventura') ||
    municipality.includes('fuerteventura')
  ) {
    return 'fuerteventura';
  }

  return null;
};

const toAirportRecord = (row: CsvRow, index: number): AirportRecord | null => {
  const isoCountry = clean(row.iso_country).toUpperCase();
  const isoRegion = clean(row.iso_region).toUpperCase();
  const scheduled = normalize(row.scheduled_service || '');
  const iataCode = clean(row.iata_code).toUpperCase();
  const ident = clean(row.ident).toUpperCase();

  if (isoCountry !== 'ES' || isoRegion !== 'ES-CN') {
    return null;
  }

  if (scheduled !== 'yes') {
    return null;
  }

  const isTargetAirport = ALLOWED_IATA.has(iataCode) || ALLOWED_ICAO.has(ident);
  if (!isTargetAirport) {
    return null;
  }

  const island = resolveIsland(row);
  if (!island) {
    return null;
  }

  const name = clean(row.name);
  if (!name) {
    return null;
  }

  const municipality = clean(row.municipality);
  const normalizedName = normalize(name);
  const searchIndex = normalize([name, municipality, iataCode, ident].join(' '));

  return {
    id: clean(row.id) || `airport-${index}`,
    ident,
    iataCode,
    name,
    municipality,
    island,
    country: 'Spain',
    isoCountry,
    isoRegion,
    normalizedName,
    searchIndex,
  };
};

const loadAirportRecords = async (): Promise<AirportRecord[]> => {
  const response = await fetch(AIRPORTS_CSV_URL, {
    cache: 'no-store',
    headers: {
      Accept: 'text/csv,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch airports CSV: HTTP ${response.status}`);
  }

  const csv = await response.text();
  const parsed = parseCsv(csv);

  return parsed
    .map((row, index) => toAirportRecord(row, index))
    .filter((record): record is AirportRecord => record !== null);
};

const getAirportRecords = async (): Promise<AirportRecord[]> => {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.value;
  }

  if (!loadPromise) {
    loadPromise = loadAirportRecords()
      .then((records) => {
        cache = {
          expiresAt: Date.now() + CACHE_TTL_MS,
          value: records,
        };
        return records;
      })
      .finally(() => {
        loadPromise = null;
      });
  }

  return loadPromise;
};

const rankAirport = (record: AirportRecord, query: string): number => {
  let score = 0;

  if (record.normalizedName.startsWith(query)) score += 50;
  if (record.searchIndex.startsWith(query)) score += 30;
  if (record.searchIndex.includes(query)) score += 20;
  if (record.iataCode.toLowerCase() === query) score += 70;
  if (record.ident.toLowerCase() === query) score += 65;

  return score;
};

export const searchAirports = async ({
  query,
  limit,
}: SearchAirportsParams): Promise<AirportSuggestion[]> => {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length < MIN_AIRPORT_QUERY_LENGTH) {
    return [];
  }

  const safeLimit = Math.max(1, Math.min(limit ?? DEFAULT_LIMIT, MAX_LIMIT));
  const terms = normalizedQuery.split(' ').filter(Boolean);

  const airports = await getAirportRecords();

  return airports
    .filter((record) => terms.every((term) => record.searchIndex.includes(term)))
    .map((record) => ({
      score: rankAirport(record, normalizedQuery),
      record,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.record.name.localeCompare(b.record.name, 'en', {
        sensitivity: 'base',
      });
    })
    .slice(0, safeLimit)
    .map(({ record }) => ({
      id: record.id,
      ident: record.ident,
      iataCode: record.iataCode,
      name: record.name,
      municipality: record.municipality,
      island: record.island,
      country: record.country,
      isoCountry: record.isoCountry,
      isoRegion: record.isoRegion,
    }));
};
