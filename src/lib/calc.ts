import { HPG_THRESHOLD_HIGH, HPG_THRESHOLD_LOW } from "./constants";
import type {
  HpgRow,
  StockAnimal,
  WeightRecord,
  WeightRow,
  MonthKey,
} from "./types";

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
  days = 30,
): number | null {
  if (
    currentKg === null ||
    currentKg === undefined ||
    previousKg === null ||
    previousKg === undefined
  ) {
    return null;
  }
  if (!days || days <= 0) return null;
  return (currentKg - previousKg) / days;
}

export function summarizeWeights(
  rows: WeightRow[],
  previousRows: WeightRow[] = [],
  days = 30,
) {
  const prevMap = new Map(previousRows.map((r) => [r.tagId.trim(), r.weightKg]));
  const weights = rows
    .map((r) => r.weightKg)
    .filter((v): v is number => typeof v === "number");
  const adgs: number[] = [];
  for (const r of rows) {
    const prev = prevMap.get(r.tagId.trim());
    const adg = calculateAdg(r.weightKg, prev ?? null, days);
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

/** Days between the 1st of two YYYY-MM month keys. Crosses year boundaries. */
export function monthsDiffDays(fromKey: string, toKey: string): number {
  const a = /^(\d{4})-(\d{2})$/.exec(fromKey);
  const b = /^(\d{4})-(\d{2})$/.exec(toKey);
  if (!a || !b) return 0;
  const d1 = new Date(Number(a[1]), Number(a[2]) - 1, 1);
  const d2 = new Date(Number(b[1]), Number(b[2]) - 1, 1);
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

/**
 * Most recent month key strictly before `monthKey` that has at least one
 * numeric weight, or null. Lets GDP compare against the last actual weighing
 * even when intermediate months were skipped.
 */
export function previousWeighedMonthKey(
  weightsByMonth: Record<MonthKey, WeightRecord> | undefined,
  monthKey: string,
): string | null {
  if (!weightsByMonth) return null;
  const candidates = Object.keys(weightsByMonth)
    .filter((k) => k < monthKey)
    .filter((k) =>
      (weightsByMonth[k]?.rows ?? []).some(
        (r) => typeof r.weightKg === "number" && Number.isFinite(r.weightKg),
      ),
    )
    .sort();
  return candidates.length > 0 ? candidates[candidates.length - 1] : null;
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

/**
 * Filter stock rows to "active" animals — those still in the rodeo today.
 * Excludes both dead (`muerto`) and sold (`vendido`) since neither is part
 * of the current state. Used by every "current state" stat across the app
 * so they don't pollute counts, distributions, or production deltas.
 * Historical/tab data (Pesadas, HPG, GDP) keeps its own data unchanged.
 */
export function liveStockRows(rows: StockAnimal[]): StockAnimal[] {
  return rows.filter((r) => !r.muerto && !r.vendido);
}

/**
 * Per-lot Producción aggregate: walks each Stock animal and pairs its
 * entry weight (`peso`) with its most recent recorded weight in Pesadas
 * (matching `caravana ↔ tagId`). Dead animals are excluded entirely;
 * sold and live are both included. Only animals with **both** an entry
 * peso and a recorded weight contribute, so the entrada/salida pair is
 * always over the same set and `producido = salida − entrada` is exact.
 *
 * For sold animals, their `lastWeightForTag` returns the last pre-sale
 * weighing — naturally freezing their contribution to producido.
 */
export function lotProduction(
  rows: StockAnimal[],
  weightsByMonth: Record<MonthKey, WeightRecord> | undefined,
): { entrada: number; salida: number; matched: number } {
  let entrada = 0;
  let salida = 0;
  let matched = 0;
  for (const r of rows) {
    if (r.muerto) continue;
    const peso = parseStockPeso(r.peso);
    if (peso <= 0) continue;
    const last = lastWeightForTag(weightsByMonth, r.caravana);
    if (last === null) continue;
    entrada += peso;
    salida += last;
    matched++;
  }
  return { entrada, salida, matched };
}

/**
 * Most recent `weightKg` recorded for a caravana across all months in a
 * lot's weight record. Returns null if no match. Used to compute the
 * average sale weight from Pesadas data when an animal is marked as sold.
 */
export function lastWeightForTag(
  weightsByMonth: Record<MonthKey, WeightRecord> | undefined,
  caravana: string,
): number | null {
  if (!weightsByMonth) return null;
  const tag = caravana.trim();
  if (!tag) return null;
  const keys = Object.keys(weightsByMonth).sort().reverse();
  for (const key of keys) {
    const row = weightsByMonth[key].rows.find(
      (r) => r.tagId.trim() === tag && typeof r.weightKg === "number",
    );
    if (row && typeof row.weightKg === "number") return row.weightKg;
  }
  return null;
}

/** Parse a stock animal's `peso` string (kg). Empty / non-numeric → 0. */
function parseStockPeso(s: string): number {
  if (!s) return 0;
  const n = Number(String(s).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Total entry weight (kg) for a lot's stock rows.
 * Returns { totalKg, weighedCount } — `weighedCount` is the number of
 * animals with a parseable, positive `peso`, useful for averaging.
 */
export function sumStockEntryWeights(rows: StockAnimal[]): {
  totalKg: number;
  weighedCount: number;
} {
  let totalKg = 0;
  let weighedCount = 0;
  for (const r of rows) {
    const kg = parseStockPeso(r.peso);
    if (kg > 0) {
      totalKg += kg;
      weighedCount++;
    }
  }
  return { totalKg, weighedCount };
}

/**
 * Sum of `weightKg` from the most recent month's rows in a lot's weight
 * record. Returns null if there are no months or no numeric weights.
 */
export function sumLatestWeights(
  weightsByMonth: Record<MonthKey, WeightRecord> | undefined,
): { totalKg: number; count: number; monthKey: MonthKey } | null {
  if (!weightsByMonth) return null;
  const keys = Object.keys(weightsByMonth).sort();
  if (keys.length === 0) return null;
  const lastKey = keys[keys.length - 1];
  const rows = weightsByMonth[lastKey].rows;
  let totalKg = 0;
  let count = 0;
  for (const r of rows) {
    if (typeof r.weightKg === "number" && Number.isFinite(r.weightKg)) {
      totalKg += r.weightKg;
      count++;
    }
  }
  if (count === 0) return null;
  return { totalKg, count, monthKey: lastKey };
}
