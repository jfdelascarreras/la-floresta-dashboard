const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatHa(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const digits = Number.isInteger(value) ? 0 : 1;
  return `${formatNumber(value, digits)} ha`;
}

export function formatMm(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${formatNumber(value, Number.isInteger(value) ? 0 : 1)} mm`;
}

export function formatBs(value: number | null | undefined): string {
  if (value == null) return "—";
  return `Bs ${formatNumber(value, 0)}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  const monthIndex = Number(month) - 1;
  if (!year || !day || monthIndex < 0 || monthIndex > 11) return value;
  return `${Number(day)} ${MONTHS[monthIndex]} ${year}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/La_Paz",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const monthIndex = Number(pick("month")) - 1;
  if (monthIndex < 0 || monthIndex > 11) return value;
  const hour = pick("hour").padStart(2, "0");
  const minute = pick("minute").padStart(2, "0");
  return `${Number(pick("day"))} ${MONTHS[monthIndex]} ${pick("year")} · ${hour}:${minute}`;
}

export function loteNombre(id: string | null | undefined, nombres: Map<string, string>): string {
  if (!id) return "—";
  return nombres.get(id) ?? id;
}
