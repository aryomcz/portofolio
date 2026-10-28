import type { ExperienceTenure, YearMonth } from "@/data/portfolio";

const MONTH_LABELS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

function parseYearMonth(value: YearMonth): { year: number; month: number } {
  const [year, month] = value.split("-");
  return { year: Number(year), month: Number(month) };
}

/** `"2023-07"` → `"JUL 2023"` */
export function formatYearMonth(value: YearMonth): string {
  const { year, month } = parseYearMonth(value);
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

/** `{ start: "2023-07", end: "2023-12" }` → `"JUL 2023 — DEC 2023"` */
export function formatTenure({ start, end }: ExperienceTenure): string {
  return `${formatYearMonth(start)} — ${end ? formatYearMonth(end) : "PRESENT"}`;
}

/**
 * Inclusive length of a completed tenure (`"6 mos"`, `"1 yr 2 mos"`).
 * Returns `null` for ongoing roles so the static HTML never bakes in a
 * build-time "today" that would drift from the client's clock.
 */
export function formatTenureLength({ start, end }: ExperienceTenure): string | null {
  if (end === null) return null;

  const from = parseYearMonth(start);
  const to = parseYearMonth(end);
  const totalMonths = (to.year - from.year) * 12 + (to.month - from.month) + 1;
  if (totalMonths <= 0) return null;

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} mo${months > 1 ? "s" : ""}`);
  return parts.join(" ");
}
