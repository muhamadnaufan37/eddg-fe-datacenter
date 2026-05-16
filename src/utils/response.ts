const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const extractArrayResult = <T>(payload: unknown): T[] => {
  const source = isRecord(payload)
    ? (payload.data ?? payload.result ?? payload.items ?? payload.rows)
    : payload;

  if (Array.isArray(source)) {
    return source as T[];
  }

  if (isRecord(source) && Array.isArray(source.data)) {
    return source.data as T[];
  }

  if (
    isRecord(source) &&
    isRecord(source.data) &&
    Array.isArray(source.data.data)
  ) {
    return source.data.data as T[];
  }

  if (isRecord(source) && source.data && typeof source.data === "object") {
    return [source.data as T];
  }

  if (isRecord(source)) {
    return [source as T];
  }

  return [];
};

export const extractSingleResult = <T>(payload: unknown): T | null => {
  const results = extractArrayResult<T>(payload);
  return results.length > 0 ? results[0] : null;
};
