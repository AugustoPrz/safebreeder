"use client";

import { useMemo, useRef, useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Select } from "@/components/ui/Input";
import { HpgByLotBar } from "@/components/charts/HpgByLotBar";
import { DistributionDoughnut } from "@/components/charts/DistributionDoughnut";
import { MonthlyEvolutionLine } from "@/components/charts/MonthlyEvolutionLine";
import { AdgBar } from "@/components/charts/AdgBar";
import { WeightByLotBar } from "@/components/charts/WeightByLotBar";
import { TreatmentsByDrugBar } from "@/components/charts/TreatmentsByDrugBar";
import {
  EntryExitWeightByLot,
  type EntryExitDatum,
} from "@/components/charts/EntryExitWeightByLot";
import { MortalityMonthlyLine } from "@/components/charts/MortalityMonthlyLine";
import {
  TreatmentsLog,
  type TreatmentLogEntry,
} from "@/components/forms/TreatmentsLog";
import { useStore } from "@/lib/store";
import {
  averageHpg,
  classifyHpg,
  formatInt,
  formatMonthKey,
  formatNumber,
  hpgDistribution,
  lastWeightForTag,
  liveStockRows,
  lotProduction,
  monthsDiffDays,
  previousWeighedMonthKey,
  summarizeWeights,
} from "@/lib/calc";
import { t } from "@/lib/i18n";
import { generateStatsReport } from "@/lib/pdf";
import { captureCharts } from "@/lib/chartExport";
import type { HpgRecord, Lot, WeightRecord } from "@/lib/types";

export default function DashboardPage() {
  const establishments = useStore((s) => s.db.establishments);
  const allLots = useStore((s) => s.db.lots);
  const hpgByLot = useStore((s) => s.db.hpg);
  const weightsByLot = useStore((s) => s.db.weights);
  const treatmentsByLot = useStore((s) => s.db.treatments);
  const vaccinesByLot = useStore((s) => s.db.vaccines);
  const stockByLot = useStore((s) => s.db.stock);

  const [filter, setFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>(""); // "" = all years
  const [originFilter, setOriginFilter] = useState<string>(""); // "" = all origins
  const printRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  // Year filter helpers — closure over yearFilter so memos depend on it
  // implicitly. monthKey is "YYYY-MM"; iso is "YYYY-MM-DD".
  const inYearMonth = (monthKey: string): boolean =>
    yearFilter === "" || monthKey.startsWith(`${yearFilter}-`);
  const inYearDate = (iso: string): boolean =>
    yearFilter === "" || iso.startsWith(`${yearFilter}-`);

  const lots = useMemo(
    () => (filter ? allLots.filter((l) => l.establishmentId === filter) : allLots),
    [allLots, filter],
  );

  // Years available across every time-keyed dataset → drives the picker.
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const collectMonth = (key: string) => {
      const m = /^(\d{4})-\d{2}$/.exec(key);
      if (m) years.add(Number(m[1]));
    };
    const collectDate = (iso?: string) => {
      if (!iso) return;
      const m = /^(\d{4})-\d{2}/.exec(iso);
      if (m) years.add(Number(m[1]));
    };
    for (const lot of allLots) {
      for (const k of Object.keys(hpgByLot[lot.id] ?? {})) collectMonth(k);
      for (const k of Object.keys(weightsByLot[lot.id] ?? {})) collectMonth(k);
      for (const k of Object.keys(treatmentsByLot[lot.id] ?? {})) collectMonth(k);
      const ts = treatmentsByLot[lot.id];
      if (ts) for (const r of Object.values(ts)) collectDate(r.date);
      const vs = vaccinesByLot[lot.id];
      if (vs)
        for (const rec of Object.values(vs))
          for (const row of rec.rows ?? []) collectDate(row.date);
      const sk = stockByLot[lot.id];
      if (sk) for (const r of sk.rows) collectDate(r.deathDate);
    }
    return Array.from(years).sort((a, b) => b - a); // newest first
  }, [allLots, hpgByLot, weightsByLot, treatmentsByLot, vaccinesByLot, stockByLot]);

  const metrics = useMemo(() => {
    let samples = 0;
    let low = 0;
    let moderate = 0;
    let high = 0;
    for (const lot of lots) {
      const months = hpgByLot[lot.id];
      if (!months) continue;
      for (const [key, rec] of Object.entries(months)) {
        if (!inYearMonth(key)) continue;
        for (const row of rec.rows) {
          if (typeof row.hpg === "number") {
            samples++;
            const lvl = classifyHpg(row.hpg);
            if (lvl === "low") low++;
            else if (lvl === "moderate") moderate++;
            else if (lvl === "high") high++;
          }
        }
      }
    }
    const pct = (n: number) => (samples === 0 ? 0 : (n / samples) * 100);
    return {
      lots: lots.length,
      samples,
      lowPct: pct(low),
      modPct: pct(moderate),
      highPct: pct(high),
      low,
      moderate,
      high,
    };
  }, [lots, hpgByLot, yearFilter]);

  // Aggregate Stock counts across the filtered lots — surface as KPIs.
  // Live animals drive Cantidad / Machos / Hembras (current state of the
  // rodeo). Muertos counts the dead-flagged rows on the unfiltered array.
  const stockCounts = useMemo(() => {
    let total = 0;
    let machos = 0;
    let hembras = 0;
    let muertos = 0;
    let vendidos = 0;
    const estIds = new Set<string>();
    for (const lot of lots) {
      estIds.add(lot.establishmentId);
      const rows = stockByLot[lot.id]?.rows ?? [];
      const live = liveStockRows(rows);
      total += live.length;
      for (const r of rows) {
        if (r.muerto) muertos++;
        if (r.vendido) vendidos++;
      }
      for (const r of live) {
        if (r.sexo === "macho") machos++;
        else if (r.sexo === "hembra") hembras++;
      }
    }
    // When a single establishment is filtered, the count is 1 if that est
    // has any lot; if no lots at all, fall back to the total establishments
    // visible to the user (so the KPI doesn't show 0 on first run).
    const estCount = filter
      ? establishments.findIndex((e) => e.id === filter) >= 0
        ? 1
        : 0
      : estIds.size > 0
        ? estIds.size
        : establishments.length;
    return {
      total,
      machos,
      hembras,
      muertos,
      vendidos,
      establishments: estCount,
    };
  }, [lots, stockByLot, filter, establishments]);

  const hpgByLotData = useMemo(() => {
    return lots
      .map((lot) => {
        const months = hpgByLot[lot.id];
        if (!months) return null;
        const all = Object.entries(months)
          .filter(([key]) => inYearMonth(key))
          .flatMap(([, m]) => m.rows);
        const avg = averageHpg(all);
        if (avg === null) return null;
        return { name: lot.name, value: Math.round(avg) };
      })
      .filter((x): x is { name: string; value: number } => x !== null)
      .sort((a, b) => b.value - a.value);
  }, [lots, hpgByLot, yearFilter]);

  const distribution = useMemo(() => {
    const all = lots.flatMap((lot) =>
      Object.entries(hpgByLot[lot.id] ?? {})
        .filter(([key]) => inYearMonth(key))
        .flatMap(([, r]) => r.rows),
    );
    return hpgDistribution(all);
  }, [lots, hpgByLot, yearFilter]);

  const evolution = useMemo(() => {
    const monthSet = new Set<string>();
    for (const lot of lots) {
      for (const key of Object.keys(hpgByLot[lot.id] ?? {})) {
        if (inYearMonth(key)) monthSet.add(key);
      }
    }
    const monthKeys = Array.from(monthSet).sort();
    const rows = monthKeys.map((key) => {
      const row: Record<string, number | string> = {
        label: formatMonthKey(key, t.months),
      };
      for (const lot of lots) {
        const rec = hpgByLot[lot.id]?.[key];
        if (rec) {
          const avg = averageHpg(rec.rows);
          if (avg !== null) row[lot.id] = Math.round(avg);
        }
      }
      return row;
    });
    return { rows, lots };
  }, [lots, hpgByLot, yearFilter]);

  // Monthly GDP evolution per lot — mirrors `evolution` (HPG) but for kg/day.
  // For each month key with weights, compute GDP vs the lot's most recent
  // prior month (per-tag if tagIds match, fall back to avg-weight delta).
  const gdpEvolution = useMemo(() => {
    const monthSet = new Set<string>();
    for (const lot of lots) {
      for (const key of Object.keys(weightsByLot[lot.id] ?? {})) {
        if (inYearMonth(key)) monthSet.add(key);
      }
    }
    const monthKeys = Array.from(monthSet).sort();
    const rows = monthKeys.map((key) => {
      const row: Record<string, number | string> = {
        label: formatMonthKey(key, t.months),
      };
      for (const lot of lots) {
        const lotMonths = weightsByLot[lot.id];
        const current = lotMonths?.[key];
        if (!current) continue;
        const priorKeys = Object.keys(lotMonths)
          .filter((k) => k < key)
          .sort();
        const prevKey = priorKeys[priorKeys.length - 1];
        if (!prevKey) continue;
        const prev = lotMonths[prevKey];
        const days = monthsDiffDays(prevKey, key);
        const perTag = summarizeWeights(current.rows, prev.rows, days);
        let adg: number | null = perTag.avgAdg;
        if (adg === null) {
          const lastSum = summarizeWeights(current.rows);
          const prevSum = summarizeWeights(prev.rows);
          if (
            lastSum.avgWeight !== null &&
            prevSum.avgWeight !== null &&
            days > 0
          ) {
            adg = (lastSum.avgWeight - prevSum.avgWeight) / days;
          }
        }
        if (adg !== null) {
          row[lot.id] = Number(adg.toFixed(2));
        }
      }
      return row;
    });
    // Drop empty months (only the label, no lot data).
    const filtered = rows.filter((r) => Object.keys(r).length > 1);
    return { rows: filtered, lots };
  }, [lots, weightsByLot, yearFilter]);

  // Build caravana→origen map per lot from ALL stock rows. Origen is
  // intrinsic to the animal, so dead/sold animals keep contributing their
  // historical weighings. Empty origen → "Sin origen".
  const origenByLot = useMemo(() => {
    const map = new Map<string, Map<string, string>>();
    for (const lot of lots) {
      const m = new Map<string, string>();
      for (const a of stockByLot[lot.id]?.rows ?? []) {
        const tag = a.caravana.trim();
        if (tag) m.set(tag, a.origen.trim() || t.dashboard.sinOrigen);
      }
      map.set(lot.id, m);
    }
    return map;
  }, [lots, stockByLot]);

  // Monthly average weight (kg) per origin.
  const weightByOriginEvolution = useMemo(() => {
    const monthSet = new Set<string>();
    for (const lot of lots) {
      for (const key of Object.keys(weightsByLot[lot.id] ?? {})) {
        if (inYearMonth(key)) monthSet.add(key);
      }
    }
    const monthKeys = Array.from(monthSet).sort();
    const seriesKeys = new Set<string>();
    const rows = monthKeys.map((key) => {
      const row: Record<string, number | string> = {
        label: formatMonthKey(key, t.months),
      };
      const acc = new Map<string, { sum: number; count: number }>();
      for (const lot of lots) {
        const rec = weightsByLot[lot.id]?.[key];
        if (!rec) continue;
        const omap = origenByLot.get(lot.id);
        for (const r of rec.rows) {
          if (typeof r.weightKg !== "number" || !Number.isFinite(r.weightKg))
            continue;
          const origen = omap?.get(r.tagId.trim()) ?? t.dashboard.sinOrigen;
          const cur = acc.get(origen) ?? { sum: 0, count: 0 };
          cur.sum += r.weightKg;
          cur.count += 1;
          acc.set(origen, cur);
        }
      }
      for (const [origen, { sum, count }] of acc) {
        if (count > 0) {
          row[`o::${origen}`] = Math.round(sum / count);
          seriesKeys.add(origen);
        }
      }
      return row;
    });
    const filtered = rows.filter((r) => Object.keys(r).length > 1);
    const series = Array.from(seriesKeys)
      .sort()
      .map((o) => ({ key: `o::${o}`, name: o }));
    return { rows: filtered, series };
  }, [lots, weightsByLot, origenByLot, yearFilter]);

  // Monthly GDP (kg/day) per origin — per-tag gain over the real day gap to
  // the most recent prior weighing.
  const gdpByOriginEvolution = useMemo(() => {
    const monthSet = new Set<string>();
    for (const lot of lots) {
      for (const key of Object.keys(weightsByLot[lot.id] ?? {})) {
        if (inYearMonth(key)) monthSet.add(key);
      }
    }
    const monthKeys = Array.from(monthSet).sort();
    const seriesKeys = new Set<string>();
    const rows = monthKeys.map((key) => {
      const row: Record<string, number | string> = {
        label: formatMonthKey(key, t.months),
      };
      const acc = new Map<string, { sum: number; count: number }>();
      for (const lot of lots) {
        const lotMonths = weightsByLot[lot.id];
        const current = lotMonths?.[key];
        if (!current) continue;
        const prevKey = previousWeighedMonthKey(lotMonths, key);
        if (!prevKey) continue;
        const days = monthsDiffDays(prevKey, key);
        if (days <= 0) continue;
        const prevMap = new Map(
          (lotMonths[prevKey].rows ?? []).map((r) => [
            r.tagId.trim(),
            r.weightKg,
          ]),
        );
        const omap = origenByLot.get(lot.id);
        for (const r of current.rows) {
          if (typeof r.weightKg !== "number") continue;
          const prevW = prevMap.get(r.tagId.trim());
          if (typeof prevW !== "number") continue;
          const adg = (r.weightKg - prevW) / days;
          const origen = omap?.get(r.tagId.trim()) ?? t.dashboard.sinOrigen;
          const cur = acc.get(origen) ?? { sum: 0, count: 0 };
          cur.sum += adg;
          cur.count += 1;
          acc.set(origen, cur);
        }
      }
      for (const [origen, { sum, count }] of acc) {
        if (count > 0) {
          row[`o::${origen}`] = Number((sum / count).toFixed(2));
          seriesKeys.add(origen);
        }
      }
      return row;
    });
    const filtered = rows.filter((r) => Object.keys(r).length > 1);
    const series = Array.from(seriesKeys)
      .sort()
      .map((o) => ({ key: `o::${o}`, name: o }));
    return { rows: filtered, series };
  }, [lots, weightsByLot, origenByLot, yearFilter]);

  // Origins available to the by-origin charts (union of both series). Drives
  // the origin dropdown that lets the user isolate a single origin's line.
  const availableOrigins = useMemo(() => {
    const set = new Set<string>();
    for (const s of weightByOriginEvolution.series) set.add(s.name);
    for (const s of gdpByOriginEvolution.series) set.add(s.name);
    return Array.from(set).sort();
  }, [weightByOriginEvolution.series, gdpByOriginEvolution.series]);

  // Fall back to "all" if the selected origin disappears after a filter change.
  const effectiveOrigin = availableOrigins.includes(originFilter)
    ? originFilter
    : "";
  const filterSeries = (series: { key: string; name: string }[]) =>
    effectiveOrigin ? series.filter((s) => s.name === effectiveOrigin) : series;

  const adgData = useMemo(() => {
    return lots
      .map((lot) => {
        const months = weightsByLot[lot.id];
        if (!months) return null;
        const keys = Object.keys(months)
          .filter((k) => inYearMonth(k))
          .sort();
        if (keys.length < 2) return null;
        const lastKey = keys[keys.length - 1];
        const prevKey = keys[keys.length - 2];
        const last = summarizeWeights(months[lastKey].rows);
        const prev = summarizeWeights(months[prevKey].rows);
        const daysBetween = monthsDiffDays(prevKey, lastKey);
        const perTag = summarizeWeights(
          months[lastKey].rows,
          months[prevKey].rows,
          daysBetween,
        );
        const adg =
          perTag.avgAdg !== null
            ? perTag.avgAdg
            : last.avgWeight !== null && prev.avgWeight !== null && daysBetween > 0
              ? (last.avgWeight - prev.avgWeight) / daysBetween
              : null;
        if (adg === null) return null;
        return { name: lot.name, value: Number(adg.toFixed(3)) };
      })
      .filter((x): x is { name: string; value: number } => x !== null);
  }, [lots, weightsByLot, yearFilter]);

  const weightData = useMemo(() => {
    return lots
      .map((lot) => {
        const months = weightsByLot[lot.id];
        if (!months) return null;
        const keys = Object.keys(months)
          .filter((k) => inYearMonth(k))
          .sort();
        if (keys.length === 0) return null;
        const lastKey = keys[keys.length - 1];
        const summary = summarizeWeights(months[lastKey].rows);
        if (summary.avgWeight === null) return null;
        return { name: lot.name, value: Math.round(summary.avgWeight) };
      })
      .filter((x): x is { name: string; value: number } => x !== null);
  }, [lots, weightsByLot, yearFilter]);

  const treatmentsData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lot of lots) {
      const months = treatmentsByLot[lot.id];
      if (!months) continue;
      for (const [key, rec] of Object.entries(months)) {
        // Use the date field if present, else the monthKey, to decide year.
        const yearOk = rec.date ? inYearDate(rec.date) : inYearMonth(key);
        if (!yearOk) continue;
        const drug = rec.drug?.trim();
        if (!drug) continue;
        counts.set(drug, (counts.get(drug) ?? 0) + 1);
      }
    }
    return Array.from(counts, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value,
    );
  }, [lots, treatmentsByLot, yearFilter]);

  // ── Producción de la recría ─────────────────────────────────────────────
  // Per-lot entrada vs salida using a per-animal walk: each Stock animal's
  // entry peso pairs with its most recent recorded weight in Pesadas.
  // Dead animals are excluded entirely; sold animals stay in the calc but
  // their last pre-sale weight naturally freezes their contribution.
  const productionByLot = useMemo<EntryExitDatum[]>(() => {
    const out: EntryExitDatum[] = [];
    for (const lot of lots) {
      const stockRows = stockByLot[lot.id]?.rows ?? [];
      const { entrada, salida, matched } = lotProduction(
        stockRows,
        weightsByLot[lot.id],
      );
      if (matched === 0) continue;
      const gainTotal = salida - entrada;
      out.push({
        name: lot.name,
        entrada: Math.round(entrada),
        salida: Math.round(salida),
        gainTotal: Math.round(gainTotal),
        gainPerAnimal: Number((gainTotal / matched).toFixed(1)),
      });
    }
    return out;
  }, [lots, stockByLot, weightsByLot]);

  // Same data as productionByLot but normalized per animal in the lot.
  // Used by the "Promedio por animal" chart so each lot's bars are directly
  // comparable regardless of head count.
  const productionAvgByLot = useMemo<EntryExitDatum[]>(() => {
    const out: EntryExitDatum[] = [];
    for (const lot of lots) {
      const stockRows = stockByLot[lot.id]?.rows ?? [];
      const { entrada, salida, matched } = lotProduction(
        stockRows,
        weightsByLot[lot.id],
      );
      if (matched === 0) continue;
      const avgEntrada = entrada / matched;
      const avgSalida = salida / matched;
      out.push({
        name: lot.name,
        entrada: Number(avgEntrada.toFixed(1)),
        salida: Number(avgSalida.toFixed(1)),
        gainTotal: Number((avgSalida - avgEntrada).toFixed(1)),
        // Bars are already per-animal so the second label is redundant.
        gainPerAnimal: null,
      });
    }
    return out;
  }, [lots, stockByLot, weightsByLot]);

  const productionTotals = useMemo(() => {
    let entrada = 0;
    let salida = 0;
    for (const d of productionByLot) {
      if (d.gainTotal !== null) {
        // Only sum lots with both ends so the delta is meaningful.
        entrada += d.entrada;
        salida += d.salida;
      }
    }
    return {
      entrada,
      salida,
      producido: salida - entrada,
      hasData: productionByLot.some((d) => d.gainTotal !== null),
    };
  }, [productionByLot]);

  // ── Mortandad ──────────────────────────────────────────────────────────
  // Total de animales marcados como muertos en los lotes filtrados, y serie
  // mensual usando deathDate para el chart.
  const mortality = useMemo(() => {
    let total = 0;
    let undated = 0;
    const byMonth = new Map<string, number>();
    for (const lot of lots) {
      const stockRows = stockByLot[lot.id]?.rows ?? [];
      for (const r of stockRows) {
        if (!r.muerto) continue;
        const date = r.deathDate;
        // When a year is selected, count only deaths whose year matches.
        // Undated dead rows are excluded from a year-filtered view (we don't
        // know if they belong to that year).
        if (yearFilter !== "" && (!date || !inYearDate(date))) continue;
        total++;
        if (!date) {
          undated++;
          continue;
        }
        const key = date.slice(0, 7); // YYYY-MM
        if (!/^\d{4}-\d{2}$/.test(key)) {
          undated++;
          continue;
        }
        byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
      }
    }
    const monthly = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({
        key,
        label: formatMonthKey(key, t.months),
        count,
      }));
    return { total, undated, monthly };
  }, [lots, stockByLot, yearFilter]);

  // ── Ventas ─────────────────────────────────────────────────────────────
  // Total de animales marcados como vendidos, peso promedio basado en la
  // pesada más reciente del animal en el tab Pesadas (matcheando caravana)
  // y la fecha de la última venta. Year filter aplica por saleDate.
  const salesSummary = useMemo(() => {
    let total = 0;
    let weightSum = 0;
    let weightCount = 0;
    let unmatched = 0;
    let lastDate = "";
    for (const lot of lots) {
      const stockRows = stockByLot[lot.id]?.rows ?? [];
      const lotWeights = weightsByLot[lot.id];
      for (const r of stockRows) {
        if (!r.vendido) continue;
        const date = r.saleDate;
        if (yearFilter !== "" && (!date || !inYearDate(date))) continue;
        total++;
        if (date && (!lastDate || date > lastDate)) lastDate = date;
        const w = lastWeightForTag(lotWeights, r.caravana);
        if (w !== null) {
          weightSum += w;
          weightCount++;
        } else {
          unmatched++;
        }
      }
    }
    return {
      total,
      avgWeight: weightCount > 0 ? weightSum / weightCount : null,
      lastDate,
      unmatched,
    };
  }, [lots, stockByLot, weightsByLot, yearFilter]);

  // ── Resumen de tratamientos (cronológico) ───────────────────────────────
  const treatmentsLog = useMemo<TreatmentLogEntry[]>(() => {
    const entries: TreatmentLogEntry[] = [];
    // Year filter: drop entries whose year (from date or fallback monthKey)
    // doesn't match the selected year. "Todos los años" disables the gate.
    for (const lot of lots) {
      // Antiparasitarios + ectoparasitarios (mismo Treatment, distintos productos)
      const treatmentMonths = treatmentsByLot[lot.id];
      if (treatmentMonths) {
        for (const [key, rec] of Object.entries(treatmentMonths)) {
          const date = rec.date ?? "";
          // Fall back to monthKey year if no date is set.
          if (yearFilter !== "" && !(date ? inYearDate(date) : inYearMonth(key)))
            continue;
          const drug = rec.drug?.trim();
          const ectoDrug = rec.ectoDrug?.trim();
          if (drug) {
            entries.push({
              lotName: lot.name,
              date,
              product: drug,
              kind: "antiparasitario",
            });
          }
          if (ectoDrug) {
            entries.push({
              lotName: lot.name,
              date,
              product: ectoDrug,
              kind: "ecto",
            });
          }
        }
      }
      // Vacunas (cada VaccineRow es una aplicación)
      const vaccineMonths = vaccinesByLot[lot.id];
      if (vaccineMonths) {
        for (const [key, rec] of Object.entries(vaccineMonths)) {
          for (const row of rec.rows ?? []) {
            const date = row.date ?? "";
            if (
              yearFilter !== "" &&
              !(date ? inYearDate(date) : inYearMonth(key))
            )
              continue;
            const brand = row.brand?.trim();
            const typeLabel = row.type ? t.vaccines.types[row.type] : "";
            const product = brand || typeLabel;
            if (!product) continue;
            entries.push({
              lotName: lot.name,
              date,
              product,
              kind: "vacuna",
            });
          }
        }
      }
    }
    // Sort by date desc, empty dates at the bottom
    entries.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
    return entries;
  }, [lots, treatmentsByLot, vaccinesByLot, yearFilter]);

  const [tableYear, setTableYear] = useState<number | null>(null);

  const defaultTableYear = useMemo(() => {
    let latest = new Date().getFullYear();
    let found = false;
    for (const lot of lots) {
      for (const key of Object.keys(hpgByLot[lot.id] ?? {})) {
        const m = /^(\d{4})-\d{2}$/.exec(key);
        if (m) {
          const y = Number(m[1]);
          if (!found || y > latest) {
            latest = y;
            found = true;
          }
        }
      }
    }
    return latest;
  }, [lots, hpgByLot]);

  const activeYear = tableYear ?? defaultTableYear;

  const tableRows = useMemo(
    () => buildTableRows(lots, hpgByLot, activeYear),
    [lots, hpgByLot, activeYear],
  );

  const gdpTableRows = useMemo(
    () => buildGdpTableRows(lots, weightsByLot, activeYear),
    [lots, weightsByLot, activeYear],
  );

  // Export the whole stats view to a PDF — without opening the print dialog.
  // Charts are captured to PNG via native SVG serialization (chartExport),
  // which keeps the curves intact; KPIs and the GDP table are drawn as
  // first-class PDF content.
  const downloadPdf = async () => {
    if (pdfBusy) return;
    setPdfBusy(true);
    try {
      const root = printRef.current;
      const charts = root ? await captureCharts(root) : [];
      const estName = filter
        ? (establishments.find((e) => e.id === filter)?.name ?? null)
        : null;
      const kpis = [
        {
          label: t.dashboard.kpiEstablishments,
          value: formatInt(stockCounts.establishments),
        },
        { label: t.dashboard.kpiLots, value: formatInt(metrics.lots) },
        {
          label: t.dashboard.kpiStockTotal,
          value: formatInt(stockCounts.total),
        },
        {
          label: "Machos / Hembras",
          value: `${stockCounts.machos} M · ${stockCounts.hembras} H`,
        },
        {
          label: t.dashboard.kpiDeadTotal,
          value: formatInt(stockCounts.muertos),
        },
        {
          label: t.dashboard.kpiSoldTotal,
          value: formatInt(stockCounts.vendidos),
        },
        { label: t.dashboard.kpiSamples, value: formatInt(metrics.samples) },
        {
          label: t.dashboard.kpiLow,
          value: `${formatNumber(metrics.lowPct, 0)}%`,
        },
        {
          label: t.dashboard.kpiModerate,
          value: `${formatNumber(metrics.modPct, 0)}%`,
        },
        {
          label: t.dashboard.kpiHigh,
          value: `${formatNumber(metrics.highPct, 0)}%`,
        },
      ];
      const doc = generateStatsReport({
        establishmentName: estName,
        year: yearFilter || null,
        generatedAt: new Date().toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        kpis,
        charts,
        gdpTable: gdpTableRows.rows.length
          ? {
              year: activeYear,
              monthLabels: gdpTableRows.months.map((m) => m.label),
              rows: gdpTableRows.rows.map((r) => ({
                lotName: r.lotName,
                category: r.category,
                values: gdpTableRows.months.map((m) => r.values[m.key] ?? null),
                average: r.average,
              })),
            }
          : undefined,
      });
      const slug = (estName ?? "estadisticas")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .toLowerCase();
      doc.save(`safebreeder-${slug}-${yearFilter || "todos"}.pdf`);
    } finally {
      setPdfBusy(false);
    }
  };

  if (establishments.length === 0) {
    return (
      <Card>
        <EmptyState
          title={t.dashboard.noData}
          description="Primero creá un establecimiento y cargá datos HPG."
        />
      </Card>
    );
  }

  const emptyState = metrics.samples === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t.dashboard.title}</h1>
          <p className="text-sm text-text-muted mt-1">{t.dashboard.subtitle}</p>
        </div>
        <div className="flex items-end gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:w-72">
            <Field label={t.dashboard.filter}>
              <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="">{t.dashboard.allEstablishments}</option>
                {establishments.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex-1 sm:w-40">
            <Field label={t.dashboard.yearFilter}>
              <Select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="">{t.dashboard.allYears}</option>
                {availableYears.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={pdfBusy}
            aria-label="Descargar PDF"
            title="Descargar PDF"
            className="h-11 w-11 rounded-lg bg-surface-2 inline-flex items-center justify-center hover:bg-border shrink-0 no-print disabled:opacity-50 disabled:cursor-wait"
          >
            {pdfBusy ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5 animate-spin"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-6 print-area" ref={printRef}>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi
          label={t.dashboard.kpiEstablishments}
          value={formatInt(stockCounts.establishments)}
        />
        <Kpi label={t.dashboard.kpiLots} value={formatInt(metrics.lots)} />
        <Kpi
          label={t.dashboard.kpiStockTotal}
          value={formatInt(stockCounts.total)}
        />
        <SexKpi machos={stockCounts.machos} hembras={stockCounts.hembras} />
        <Kpi
          label={t.dashboard.kpiDeadTotal}
          value={formatInt(stockCounts.muertos)}
          variant="high"
        />
        <Kpi
          label={t.dashboard.kpiSoldTotal}
          value={formatInt(stockCounts.vendidos)}
          variant="moderate"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label={t.dashboard.kpiSamples} value={formatInt(metrics.samples)} />
        <Kpi
          label={t.dashboard.kpiLow}
          value={`${formatNumber(metrics.lowPct, 0)}%`}
          variant="low"
        />
        <Kpi
          label={t.dashboard.kpiModerate}
          value={`${formatNumber(metrics.modPct, 0)}%`}
          variant="moderate"
        />
        <Kpi
          label={t.dashboard.kpiHigh}
          value={`${formatNumber(metrics.highPct, 0)}%`}
          variant="high"
        />
      </div>

      {emptyState ? (
        <Card>
          <EmptyState
            title={t.dashboard.noData}
            description="Cargá algún HPG en un lote para ver los gráficos."
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={t.dashboard.chartByLot}>
              <HpgByLotBar data={hpgByLotData} />
            </ChartCard>
            <ChartCard title={t.dashboard.chartDistribution}>
              <DistributionDoughnut
                low={distribution.low}
                moderate={distribution.moderate}
                high={distribution.high}
              />
            </ChartCard>
          </div>

          <ChartCard title={t.dashboard.chartEvolution}>
            <MonthlyEvolutionLine
              rows={evolution.rows}
              series={evolution.lots.map((l) => ({ key: l.id, name: l.name }))}
            />
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={t.dashboard.chartWeight}>
              {weightData.length === 0 ? (
                <EmptyMini text="Sin pesadas cargadas" />
              ) : (
                <WeightByLotBar data={weightData} />
              )}
            </ChartCard>
            <ChartCard title={t.dashboard.chartAdg}>
              {adgData.length === 0 ? (
                <EmptyMini text="Se necesitan al menos 2 pesadas mensuales" />
              ) : (
                <AdgBar data={adgData} />
              )}
            </ChartCard>
          </div>

          <ChartCard title={t.dashboard.chartGdpEvolution}>
            {gdpEvolution.rows.length === 0 ? (
              <EmptyMini text="Se necesitan al menos 2 pesadas mensuales" />
            ) : (
              <MonthlyEvolutionLine
                rows={gdpEvolution.rows}
                series={gdpEvolution.lots.map((l) => ({
                  key: l.id,
                  name: l.name,
                }))}
              />
            )}
          </ChartCard>

          {availableOrigins.length > 0 ? (
            <div className="flex items-end justify-end">
              <div className="w-full sm:w-64">
                <Field label={t.dashboard.originFilter}>
                  <Select
                    value={effectiveOrigin}
                    onChange={(e) => setOriginFilter(e.target.value)}
                  >
                    <option value="">{t.dashboard.allOrigins}</option>
                    {availableOrigins.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
          ) : null}

          <ChartCard title={t.dashboard.chartWeightByOriginEvolution}>
            {weightByOriginEvolution.series.length === 0 ? (
              <EmptyMini text="Sin pesadas cargadas" />
            ) : (
              <MonthlyEvolutionLine
                rows={weightByOriginEvolution.rows}
                series={filterSeries(weightByOriginEvolution.series)}
              />
            )}
          </ChartCard>

          <ChartCard title={t.dashboard.chartGdpByOriginEvolution}>
            {gdpByOriginEvolution.series.length === 0 ? (
              <EmptyMini text="Se necesitan al menos 2 pesadas mensuales" />
            ) : (
              <MonthlyEvolutionLine
                rows={gdpByOriginEvolution.rows}
                series={filterSeries(gdpByOriginEvolution.series)}
              />
            )}
          </ChartCard>

          {/* Producción del rodeo */}
          {productionTotals.hasData ? (
            <Card>
              <div className="px-5 pt-4 pb-3 border-b border-border">
                <h2 className="font-semibold">{t.dashboard.productionTitle}</h2>
                <p className="text-xs text-text-muted">
                  Sumatoria sobre lotes con stock cargado y al menos un mes de pesadas
                </p>
              </div>
              <div className="p-5 grid grid-cols-3 gap-3">
                <Kpi
                  label={t.dashboard.kpiEntradaTotal}
                  value={`${formatInt(productionTotals.entrada)} kg`}
                />
                <Kpi
                  label={t.dashboard.kpiSalidaTotal}
                  value={`${formatInt(productionTotals.salida)} kg`}
                />
                <Kpi
                  label={t.dashboard.kpiProducido}
                  value={`${formatInt(productionTotals.producido)} kg`}
                  variant={productionTotals.producido >= 0 ? "low" : "high"}
                />
              </div>
            </Card>
          ) : null}

          <ChartCard
            title={t.dashboard.chartProductionAvg}
            subtitle={t.dashboard.chartProductionAvgSubtitle}
            height={Math.max(280, productionAvgByLot.length * 56 + 80)}
          >
            {productionAvgByLot.length === 0 ? (
              <EmptyMini text="Cargá Stock y Pesadas para ver el promedio por animal" />
            ) : (
              <EntryExitWeightByLot data={productionAvgByLot} />
            )}
          </ChartCard>

          {/* Mortandad mensual — el total ya vive en el KPI de arriba */}
          <ChartCard
            title={t.dashboard.chartMortality}
            subtitle={
              mortality.undated > 0
                ? `${t.dashboard.chartMortalitySubtitle} · ${t.dashboard.mortalityUndated(mortality.undated)}`
                : t.dashboard.chartMortalitySubtitle
            }
            height={240}
          >
            {mortality.monthly.length === 0 ? (
              <EmptyMini text="Aún no hay muertes con fecha registrada" />
            ) : (
              <MortalityMonthlyLine data={mortality.monthly} />
            )}
          </ChartCard>

          {/* Resumen de ventas — total + peso promedio + última fecha */}
          {salesSummary.total > 0 ? (
            <Card>
              <div className="px-5 pt-4 pb-3 border-b border-border">
                <h3 className="font-semibold text-sm">
                  {t.dashboard.salesSummaryTitle}
                </h3>
                <p className="text-xs text-text-muted">
                  {t.dashboard.salesSummarySubtitle}
                </p>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Kpi
                  label={t.dashboard.kpiSoldTotal}
                  value={formatInt(salesSummary.total)}
                  variant="moderate"
                />
                <Kpi
                  label={t.dashboard.salesAvgWeight}
                  value={
                    salesSummary.avgWeight !== null
                      ? `${formatNumber(salesSummary.avgWeight, 1)} kg`
                      : "—"
                  }
                />
                <Kpi
                  label={t.dashboard.salesLastDate}
                  value={
                    salesSummary.lastDate
                      ? formatMonthKey(
                          salesSummary.lastDate.slice(0, 7),
                          t.months,
                        )
                      : "—"
                  }
                />
              </div>
              {salesSummary.unmatched > 0 ? (
                <div className="px-5 pb-4 -mt-2">
                  <p className="text-xs text-text-muted">
                    {t.dashboard.salesUnmatched(salesSummary.unmatched)}
                  </p>
                </div>
              ) : null}
            </Card>
          ) : null}

          <ChartCard
            title={t.dashboard.chartTreatments}
            height={Math.max(140, treatmentsData.length * 38 + 48)}
          >
            {treatmentsData.length === 0 ? (
              <EmptyMini text="Sin tratamientos cargados" />
            ) : (
              <TreatmentsByDrugBar data={treatmentsData} />
            )}
          </ChartCard>

          <TreatmentsLog entries={treatmentsLog} />

          <Card>
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">{t.dashboard.tableTitle}</h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTableYear(activeYear - 1)}
                  aria-label="Año anterior"
                  className="h-7 w-7 rounded-md hover:bg-surface-2 text-text-muted inline-flex items-center justify-center"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-4 h-4"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className="text-sm font-medium min-w-[3rem] text-center tabular-nums">
                  {activeYear}
                </span>
                <button
                  type="button"
                  onClick={() => setTableYear(activeYear + 1)}
                  aria-label="Año siguiente"
                  className="h-7 w-7 rounded-md hover:bg-surface-2 text-text-muted inline-flex items-center justify-center"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-4 h-4"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2/60 text-text-muted text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2.5 text-left sticky left-0 bg-surface-2/60">
                      Lote
                    </th>
                    <th className="px-3 py-2.5 text-left">Categoría</th>
                    {tableRows.months.map((m) => (
                      <th
                        key={m.key}
                        className="px-2 py-2.5 text-center whitespace-nowrap"
                      >
                        {m.label}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-center whitespace-nowrap border-l border-border">
                      Prom
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.rows.map((row) => (
                    <tr key={row.lotId} className="border-t border-border">
                      <td className="px-3 py-2 font-medium sticky left-0 bg-surface">
                        {row.lotName}
                      </td>
                      <td className="px-3 py-2 text-text-muted whitespace-nowrap">
                        {row.category}
                      </td>
                      {tableRows.months.map((m) => {
                        const v = row.values[m.key];
                        return (
                          <td key={m.key} className="px-2 py-2 text-center">
                            {v === null ? (
                              <span className="text-text-muted">—</span>
                            ) : (
                              <span className={`font-medium ${hpgColor(v)}`}>
                                {v}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center font-semibold border-l border-border">
                        {row.average === null ? (
                          <span className="text-text-muted">—</span>
                        ) : (
                          <span className={hpgColor(row.average)}>
                            {row.average}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">{t.dashboard.tableGdpTitle}</h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTableYear(activeYear - 1)}
                  aria-label="Año anterior"
                  className="h-7 w-7 rounded-md hover:bg-surface-2 text-text-muted inline-flex items-center justify-center"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-4 h-4"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className="text-sm font-medium min-w-[3rem] text-center tabular-nums">
                  {activeYear}
                </span>
                <button
                  type="button"
                  onClick={() => setTableYear(activeYear + 1)}
                  aria-label="Año siguiente"
                  className="h-7 w-7 rounded-md hover:bg-surface-2 text-text-muted inline-flex items-center justify-center"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-4 h-4"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2/60 text-text-muted text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2.5 text-left sticky left-0 bg-surface-2/60">
                      Lote
                    </th>
                    <th className="px-3 py-2.5 text-left">Categoría</th>
                    {gdpTableRows.months.map((m) => (
                      <th
                        key={m.key}
                        className="px-2 py-2.5 text-center whitespace-nowrap"
                      >
                        {m.label}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-center whitespace-nowrap border-l border-border">
                      Prom
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gdpTableRows.rows.map((row) => (
                    <tr key={row.lotId} className="border-t border-border">
                      <td className="px-3 py-2 font-medium sticky left-0 bg-surface">
                        {row.lotName}
                      </td>
                      <td className="px-3 py-2 text-text-muted whitespace-nowrap">
                        {row.category}
                      </td>
                      {gdpTableRows.months.map((m) => {
                        const v = row.values[m.key];
                        return (
                          <td key={m.key} className="px-2 py-2 text-center">
                            {v === null ? (
                              <span className="text-text-muted">—</span>
                            ) : (
                              <span className={`font-medium ${gdpColor(v)}`}>
                                {v.toFixed(2)}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center font-semibold border-l border-border">
                        {row.average === null ? (
                          <span className="text-text-muted">—</span>
                        ) : (
                          <span className={gdpColor(row.average)}>
                            {row.average.toFixed(2)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: "low" | "moderate" | "high";
}) {
  const color =
    variant === "low"
      ? "text-primary"
      : variant === "moderate"
        ? "text-sun-soft-text"
        : variant === "high"
          ? "text-clay"
          : "text-text";
  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3 min-w-0">
      <div
        className="text-[11px] uppercase tracking-wider text-text-muted font-medium truncate"
        title={label}
      >
        {label}
      </div>
      <div className={`text-2xl font-semibold mt-0.5 truncate ${color}`}>
        {value}
      </div>
    </div>
  );
}

/**
 * Combined Macho / Hembra KPI: two figures inside one card, parallel to
 * the StockSummary version on /stock so the dashboard top row reads the
 * same. Uses the primary green / sun yellow tones to match.
 */
function SexKpi({ machos, hembras }: { machos: number; hembras: number }) {
  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3 min-w-0">
      <div
        className="text-[11px] uppercase tracking-wider text-text-muted font-medium truncate"
        title="Machos / Hembras"
      >
        Machos / Hembras
      </div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold text-primary tabular-nums">
            {machos}
          </span>
          <span className="text-[11px] text-text-muted">M</span>
        </div>
        <span className="text-text-muted">·</span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold text-sun-soft-text tabular-nums">
            {hembras}
          </span>
          <span className="text-[11px] text-text-muted">H</span>
        </div>
      </div>
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">
      {text}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  height = 280,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <div data-chart-card>
      <Card>
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">{title}</h3>
          {subtitle ? (
            <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
          ) : null}
        </div>
        <div className="p-5">
          <div style={{ width: "100%", height }}>{children}</div>
        </div>
      </Card>
    </div>
  );
}

function hpgColor(value: number): string {
  const level = classifyHpg(value);
  if (level === "low") return "text-primary";
  if (level === "moderate") return "text-sun-soft-text";
  if (level === "high") return "text-clay";
  return "";
}

function gdpColor(value: number): string {
  if (value > 0) return "text-primary";
  if (value < 0) return "text-clay";
  return "text-text-muted";
}

function buildTableRows(
  lots: Lot[],
  hpgByLot: Record<string, Record<string, HpgRecord>>,
  year: number,
) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    key: `${year}-${String(i + 1).padStart(2, "0")}`,
    label: t.months[i].slice(0, 3),
  }));

  const rows = lots.map((lot) => {
    const values: Record<string, number | null> = {};
    const monthlyAverages: number[] = [];
    for (const m of months) {
      const rec = hpgByLot[lot.id]?.[m.key];
      if (!rec) {
        values[m.key] = null;
      } else {
        const avg = averageHpg(rec.rows);
        if (avg === null) {
          values[m.key] = null;
        } else {
          const rounded = Math.round(avg);
          values[m.key] = rounded;
          monthlyAverages.push(rounded);
        }
      }
    }
    const average =
      monthlyAverages.length === 0
        ? null
        : Math.round(
            monthlyAverages.reduce((s, v) => s + v, 0) / monthlyAverages.length,
          );
    return {
      lotId: lot.id,
      lotName: lot.name,
      category: t.lot.categories[lot.category],
      values,
      average,
    };
  });

  return { months, rows };
}

function buildGdpTableRows(
  lots: Lot[],
  weightsByLot: Record<string, Record<string, WeightRecord>>,
  year: number,
) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    key: `${year}-${String(i + 1).padStart(2, "0")}`,
    label: t.months[i].slice(0, 3),
  }));

  const rows = lots.map((lot) => {
    const lotMonths = weightsByLot[lot.id] ?? {};
    const values: Record<string, number | null> = {};
    const monthlyGdps: number[] = [];
    for (const m of months) {
      const current = lotMonths[m.key];
      if (!current) {
        values[m.key] = null;
        continue;
      }
      const priorKeys = Object.keys(lotMonths)
        .filter((k) => k < m.key)
        .sort();
      const prevKey = priorKeys[priorKeys.length - 1];
      if (!prevKey) {
        values[m.key] = null;
        continue;
      }
      const prev = lotMonths[prevKey];
      const days = monthsDiffDays(prevKey, m.key);
      const perTag = summarizeWeights(current.rows, prev.rows, days);
      let adg: number | null = perTag.avgAdg;
      if (adg === null) {
        const lastSum = summarizeWeights(current.rows);
        const prevSum = summarizeWeights(prev.rows);
        if (
          lastSum.avgWeight !== null &&
          prevSum.avgWeight !== null &&
          days > 0
        ) {
          adg = (lastSum.avgWeight - prevSum.avgWeight) / days;
        }
      }
      if (adg === null) {
        values[m.key] = null;
      } else {
        const rounded = Number(adg.toFixed(3));
        values[m.key] = rounded;
        monthlyGdps.push(rounded);
      }
    }
    const average =
      monthlyGdps.length === 0
        ? null
        : monthlyGdps.reduce((s, v) => s + v, 0) / monthlyGdps.length;
    return {
      lotId: lot.id,
      lotName: lot.name,
      category: t.lot.categories[lot.category],
      values,
      average,
    };
  });

  return { months, rows };
}
