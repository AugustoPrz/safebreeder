import { HPG_THRESHOLD_HIGH, HPG_THRESHOLD_LOW } from "./constants";
import type { HpgRow, WeightRow } from "./types";

export type HpgLevel = "none" | "low" | "moderate" | "high";

export function classifyHpg(value: number | null | undefined): HpgLevel {
  if (value === null || value === undefined || Number.isNaN(value)) return "none";
  if (value <= HPG_THRESHOLD_LOW) return "low";
  if (value <= HPG_THRESHOLD_HIGH) return "moderate";
  return "high";
}

export function averageHpg(rows: HpgRow[]): number | null {
  const values = rows
    .map((r) => r.hpg)
    .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function maxHpg(rows: HpgRow[]): number | null {
  const values = rows
    .map((r) => r.hpg)
    .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (values.length === 0) return null;
  return Math.max(...values);
}

export function positiveRate(rows: HpgRow[]): number | null {
  const scored = rows.filter((r) => typeof r.hpg === "number");
  if (scored.length === 0) return null;
  const positives = scored.filter((r) => (r.hpg ?? 0) > 0).length;
  return (positives / scored.length) * 100;
}

export function hpgDistribution(rows: HpgRow[]) {
  let low = 0;
  let moderate = 0;
  let high = 0;
  for (const r of rows) {
    const level = classifyHpg(r.hpg);
    if (level === "low") low++;
    else if (level === "moderate") moderate++;
    else if (level === "high") high++;
  }
  return { low, moderate, high };
}

export function calculateAdg(
  currentKg: number | null | undefined,
  previousKg: number | null | undefined,
): number | null {
  if (
    currentKg === null ||
    currentKg === undefined ||
    previousKg === null ||
    previousKg === undefined
  ) {
    return null;
  }
  return (currentKg - previousKg) / 30;
}

export function summarizeWeights(
  rows: WeightRow[],
  previousRows: WeightRow[] = [],
) {
  const prevMap = new Map(previousRows.map((r) => [r.tagId.trim(), r.weightKg]));
  const weights = rows
    .map((r) => r.weightKg)
    .filter((v): v is number => typeof v === "number");
  const adgs: number[] = [];
  for (const r of rows) {
    const prev = prevMap.get(r.tagId.trim());
    const adg = calculateAdg(r.weightKg, prev ?? null);
    if (adg !== null) adgs.push(adg);
  }
  return {
    count: rows.length,
    avgWeight:
      weights.length > 0
        ? weights.reduce((a, b) => a + b, 0) / weights.length
        : null,
    avgAdg:
      adgs.length > 0 ? adgs.reduce((a, b) => a + b, 0) / adgs.length : null,
  };
}

export function formatNumber(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatInt(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Math.round(value).toLocaleString("es-AR");
}

export function monthKey(year: number, monthIndex0: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
}

export function parseMonthKey(key: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1 };
}

export function previousMonthKey(key: string): string | null {
  const parsed = parseMonthKey(key);
  if (!parsed) return null;
  const d = new Date(parsed.year, parsed.month - 1, 1);
  return monthKey(d.getFullYear(), d.getMonth());
}

export function formatMonthKey(key: string, monthNames: readonly string[]): string {
  const parsed = parseMonthKey(key);
  if (!parsed) return key;
  return `${monthNames[parsed.month]} ${parsed.year}`;
}
