type RentUpdateEntry = Record<string, unknown>;

type RentUpdateRecord = {
  timestamp: string;
} & RentUpdateEntry;

const isRecordArray = (value: unknown): value is RentUpdateRecord[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      'timestamp' in item
  );

const isRecord = (value: unknown): value is RentUpdateRecord =>
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  'timestamp' in value;

const coerceUpdates = (
  previous: string | null | undefined
): RentUpdateRecord[] => {
  if (!previous) return [];
  try {
    const parsed = JSON.parse(previous);
    if (isRecordArray(parsed)) {
      return parsed;
    }
    if (isRecord(parsed)) {
      return [parsed];
    }
    if (typeof parsed === 'string' && parsed.trim().length > 0) {
      return [
        {
          timestamp: new Date(0).toISOString(),
          previous: parsed,
        },
      ];
    }
  } catch {
    /* ignore */
  }
  return [
    {
      timestamp: new Date(0).toISOString(),
      previous: previous,
    },
  ];
};

export function appendRentUpdateLog(
  previous: string | null | undefined,
  entry: RentUpdateEntry
): string {
  const rows = coerceUpdates(previous);
  rows.push({
    timestamp: new Date().toISOString(),
    ...entry,
  });
  return JSON.stringify(rows);
}
