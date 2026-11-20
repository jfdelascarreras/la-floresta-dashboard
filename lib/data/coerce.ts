export function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

export function asInt(value: unknown): number | null {
  const number = asNumber(value);
  return number == null ? null : Math.trunc(number);
}

export function coerceNumbers<T>(row: T, keys: (keyof T)[]): T {
  const next = { ...row };
  for (const key of keys) {
    next[key] = asNumber(row[key]) as T[keyof T];
  }
  return next;
}
