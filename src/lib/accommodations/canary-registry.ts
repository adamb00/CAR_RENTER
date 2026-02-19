import 'server-only';

import {
  type AccommodationSource,
  type AccommodationSuggestion,
  MIN_ACCOMMODATION_QUERY_LENGTH,
} from './types';

type DatasetConfig = {
  source: AccommodationSource;
  url: string;
};

type AccommodationRecord = AccommodationSuggestion & {
  normalizedName: string;
  normalizedAddress: string;
  normalizedLocation: string;
  searchIndex: string;
};

type SearchRegistryParams = {
  query: string;
  limit?: number;
};

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const DEFAULT_RESULT_LIMIT = 12;
const MAX_RESULT_LIMIT = 25;
const ALLOWED_ISLANDS = new Set(['fuerteventura', 'lanzarote']);

const resolveDatasetUrl = (envKey: string, fallback: string): string => {
  const value = process.env[envKey];
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
};

const DATASETS: readonly DatasetConfig[] = [
  {
    source: 'hotel',
    url: resolveDatasetUrl(
      'CANARIAS_HOTELS_CSV_URL',
      'https://datos.canarias.es/catalogos/general/dataset/429db33d-cbce-4920-b1b6-b4dde9e5f90f/resource/87741d75-2ce2-4a45-8131-ad8263257664/download/establecimientos-hoteleros-inscritos-en-el-registro-general-turistico-de-canarias.csv'
    ),
  },
  {
    source: 'extrahotel',
    url: resolveDatasetUrl(
      'CANARIAS_EXTRAHOTEL_CSV_URL',
      'https://datos.canarias.es/catalogos/general/dataset/1364104c-b86c-4ab9-8ef5-12fdf399aa01/resource/d98c2617-db26-4d15-8ee4-3b2da1130bd0/download/establecimientos-extrahoteleros-sin-viviendas-vacacionales-inscritos-en-el-registro-general-turi.csv'
    ),
  },
  {
    source: 'vacation_rental',
    url: resolveDatasetUrl(
      'CANARIAS_VV_CSV_URL',
      'https://datos.canarias.es/catalogos/general/dataset/9f4355a2-d086-4384-ba72-d8c99aa2d544/resource/8ff8cc43-c00b-4513-8f42-a5b961c579e1/download/establecimientos-extrahoteleros-de-tipologia-vivienda-vacacional-inscritos-en-el-registro-genera.csv'
    ),
  },
] as const;

let cachedRecords:
  | {
      expiresAt: number;
      value: AccommodationRecord[];
    }
  | null = null;
let loadPromise: Promise<AccommodationRecord[]> | null = null;

const normalizeForSearch = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const cleanValue = (value: string | undefined): string => {
  if (!value) return '';
  const normalized = value.replace(/^\uFEFF/, '').trim();
  if (normalized === '_U') return '';
  return normalized;
};

const parseSemicolonCsv = (content: string): Record<string, string>[] => {
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

    if (!inQuotes && char === ';') {
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

  const [rawHeaders, ...rawDataRows] = rows;
  const headers = rawHeaders.map((header) => cleanValue(header));

  return rawDataRows.map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = cleanValue(row[index]);
    });
    return record;
  });
};

const toAccommodationRecord = (
  row: Record<string, string>,
  source: AccommodationSource,
  rowIndex: number
): AccommodationRecord | null => {
  const id = cleanValue(row.establecimiento_id) || `${source}-${rowIndex}`;
  const name = cleanValue(row.establecimiento_nombre_comercial);
  const address = cleanValue(row.direccion);
  const postalCode = cleanValue(row.direccion_codigo_postal);
  const municipality = cleanValue(
    row.direccion_municipio_nombre || row.direcion_municipio_nombre
  );
  const locality = cleanValue(row.direccion_localidad_nombre);
  const island = cleanValue(row.direccion_isla_nombre);
  const province = cleanValue(row.direccion_provincia_nombre);

  if (!name && !address) {
    return null;
  }

  const normalizedName = normalizeForSearch(name);
  const normalizedAddress = normalizeForSearch(address);
  const normalizedLocation = normalizeForSearch(
    [municipality, locality, island, province, postalCode].join(' ')
  );

  const searchIndex = normalizeForSearch(
    [name, address, municipality, locality, island, province, postalCode].join(
      ' '
    )
  );

  return {
    id,
    source,
    name: name || address,
    address,
    postalCode,
    municipality,
    locality,
    island,
    province,
    country: 'Spain',
    normalizedName,
    normalizedAddress,
    normalizedLocation,
    searchIndex,
  };
};

const fetchDatasetRecords = async (
  dataset: DatasetConfig
): Promise<AccommodationRecord[]> => {
  const response = await fetch(dataset.url, {
    cache: 'no-store',
    headers: {
      Accept: 'text/csv,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${dataset.source} dataset: HTTP ${response.status}`
    );
  }

  const content = await response.text();
  const parsed = parseSemicolonCsv(content);

  return parsed
    .map((row, index) => toAccommodationRecord(row, dataset.source, index))
    .filter((record): record is AccommodationRecord => record !== null);
};

const loadAllAccommodationRecords = async (): Promise<AccommodationRecord[]> => {
  const loaded = await Promise.allSettled(
    DATASETS.map((dataset) => fetchDatasetRecords(dataset))
  );

  const merged = new Map<string, AccommodationRecord>();

  loaded.forEach((result) => {
    if (result.status !== 'fulfilled') return;

    result.value.forEach((record) => {
      if (!ALLOWED_ISLANDS.has(normalizeForSearch(record.island))) {
        return;
      }

      const dedupeKey = normalizeForSearch(
        [
          record.name,
          record.address,
          record.postalCode,
          record.municipality,
        ].join('|')
      );
      if (!merged.has(dedupeKey)) {
        merged.set(dedupeKey, record);
      }
    });
  });

  return Array.from(merged.values());
};

const getAccommodationRegistryRecords = async (): Promise<
  AccommodationRecord[]
> => {
  const now = Date.now();

  if (cachedRecords && cachedRecords.expiresAt > now) {
    return cachedRecords.value;
  }

  if (!loadPromise) {
    loadPromise = loadAllAccommodationRecords()
      .then((records) => {
        cachedRecords = {
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

const rankRecord = (record: AccommodationRecord, query: string): number => {
  let score = 0;

  if (record.normalizedName.startsWith(query)) score += 60;
  if (record.normalizedAddress.startsWith(query)) score += 40;
  if (record.normalizedLocation.startsWith(query)) score += 20;

  if (record.normalizedName.includes(query)) score += 24;
  if (record.normalizedAddress.includes(query)) score += 16;
  if (record.normalizedLocation.includes(query)) score += 8;

  return score;
};

export const searchAccommodationRegistry = async ({
  query,
  limit,
}: SearchRegistryParams): Promise<AccommodationSuggestion[]> => {
  const normalizedQuery = normalizeForSearch(query);

  if (normalizedQuery.length < MIN_ACCOMMODATION_QUERY_LENGTH) {
    return [];
  }

  const safeLimit = Math.max(
    1,
    Math.min(limit ?? DEFAULT_RESULT_LIMIT, MAX_RESULT_LIMIT)
  );

  const searchTerms = normalizedQuery.split(' ').filter(Boolean);
  const records = await getAccommodationRegistryRecords();

  return records
    .filter((record) =>
      searchTerms.every((term) => record.searchIndex.includes(term))
    )
    .map((record) => ({
      score: rankRecord(record, normalizedQuery),
      record,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.record.name.localeCompare(b.record.name, 'es', {
        sensitivity: 'base',
      });
    })
    .slice(0, safeLimit)
    .map(({ record }) => ({
      id: record.id,
      name: record.name,
      address: record.address,
      postalCode: record.postalCode,
      municipality: record.municipality,
      locality: record.locality,
      island: record.island,
      province: record.province,
      country: record.country,
      source: record.source,
    }));
};
