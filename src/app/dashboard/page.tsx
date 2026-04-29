"use client";

import { useMemo, useState } from "react";
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
  sumLatestWeights,
  sumStockEntryWeights,
  summarizeWeights,
} from "@/lib/calc";
import { t } from "@/lib/i18n";
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
  const downloadPdf = () => {
    window.print();
  };

  const lots = useMemo(
    () => (filter ? allLots.filter((l) => l.establishmentId === filter) : allLots),
    [allLots, filter],
  );

  const metrics = useMemo(() => {
    let samples = 0;
    let low = 0;
    let moderate = 0;
    let high = 0;
    for (const lot of lots) {
      const months = hpgByLot[lot.id];
      if (!months) continue;
      for (const rec of Object.values(months)) {
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
  }, [lots, hpgByLot]);

  const hpgByLotData = useMemo(() => {
    return lots
      .map((lot) => {
        const months = hpgByLot[lot.id];
        if (!months) return null;
        const all = Object.values(months).flatMap((m) => m.rows);
        const avg = averageHpg(all);
        if (avg === null) return null;
        return { name: lot.name, value: Math.round(avg) };
      })
      .filter((x): x is { name: string; value: number } => x !== null)
      .sort((a, b) => b.value - a.value);
  }, [lots, hpgByLot]);

  const distribution = useMemo(() => {
    const all = lots.flatMap((lot) =>
      Object.values(hpgByLot[lot.id] ?? {}).flatMap((r) => r.rows),
    );
    return hpgDistribution(all);
  }, [lots, hpgByLot]);

  const evolution = useMemo(() => {
    const monthSet = new Set<string>();
    for (const lot of lots) {
      for (const key of Object.keys(hpgByLot[lot.id] ?? {})) monthSet.add(key);
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
  }, [lots, hpgByLot]);

  const adgData = useMemo(() => {
    return lots
      .map((lot) => {
        const months = weightsByLot[lot.id];
        if (!months) return null;
        const keys = Object.keys(months).sort();
        if (keys.length < 2) return null;
        const lastKey = keys[keys.length - 1];
        const prevKey = keys[keys.length - 2];
        const last = summarizeWeights(months[lastKey].rows);
        const prev = summarizeWeights(months[prevKey].rows);
        const perTag = summarizeWeights(
          months[lastKey].rows,
          months[prevKey].rows,
        );
        const daysBetween = monthsDiffDays(prevKey, lastKey);
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
  }, [lots, weightsByLot]);

  const weightData = useMemo(() => {
    return lots
      .map((lot) => {
        const months = weightsByLot[lot.id];
        if (!months) return null;
        const keys = Object.keys(months).sort();
        if (keys.length === 0) return null;
        const lastKey = keys[keys.length - 1];
        const summary = summarizeWeights(months[lastKey].rows);
        if (summary.avgWeight === null) return null;
        return { name: lot.name, value: Math.round(summary.avgWeight) };
      })
      .filter((x): x is { name: string; value: number } => x !== null);
  }, [lots, weightsByLot]);

  const treatmentsData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lot of lots) {
      const months = treatmentsByLot[lot.id];
      if (!months) continue;
      for (const rec of Object.values(months)) {
        const drug = rec.drug?.trim();
        if (!drug) continue;
        counts.set(drug, (counts.get(drug) ?? 0) + 1);
      }
    }
    return Array.from(counts, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value,
    );
  }, [lots, treatmentsByLot]);

  // ── Producción de la recría ─────────────────────────────────────────────
  // Per-lot entrada (sum of stock peso) vs salida (sum of latest month weights),
  // plus the gain (total and per-animal).
  const productionByLot = useMemo<EntryExitDatum[]>(() => {
    return lots
      .map((lot) => {
        const stockRows = stockByLot[lot.id]?.rows ?? [];
        const entry = sumStockEntryWeights(stockRows);
        const latest = sumLatestWeights(weightsByLot[lot.id]);
        if (entry.totalKg === 0 && (!latest || latest.totalKg === 0)) {
          return null;
        }
        const entrada = Math.round(entry.totalKg);
        const salida = latest ? Math.round(latest.totalKg) : 0;
        let gainTotal: number | null = null;
        let gainPerAnimal: number | null = null;
        if (entry.totalKg > 0 && latest && latest.totalKg > 0) {
          gainTotal = salida - entrada;
          const animalCount = Math.max(entry.weighedCount, latest.count);
          if (animalCount > 0) {
            gainPerAnimal = (latest.totalKg - entry.totalKg) / animalCount;
          }
        }
        return {
          name: lot.name,
          entrada,
          salida,
          gainTotal,
          gainPerAnimal,
        };
      })
      .filter((x): x is EntryExitDatum => x !== null);
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

  // ── Resumen de tratamientos (cronológico) ───────────────────────────────
  const treatmentsLog = useMemo<TreatmentLogEntry[]>(() => {
    const entries: TreatmentLogEntry[] = [];
    for (const lot of lots) {
      // Antiparasitarios + ectoparasitarios (mismo Treatment, distintos productos)
      const treatmentMonths = treatmentsByLot[lot.id];
      if (treatmentMonths) {
        for (const rec of Object.values(treatmentMonths)) {
          const date = rec.date ?? "";
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
        for (const rec of Object.values(vaccineMonths)) {
          for (const row of rec.rows ?? []) {
            const brand = row.brand?.trim();
            const typeLabel = row.type ? t.vaccines.types[row.type] : "";
            const product = brand || typeLabel;
            if (!product) continue;
            entries.push({
              lotName: lot.name,
              date: row.date ?? "",
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
  }, [lots, treatmentsByLot, vaccinesByLot]);

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
          <button
            type="button"
            onClick={downloadPdf}
            aria-label="Imprimir / Exportar PDF"
            className="h-11 w-11 rounded-lg bg-surface-2 inline-flex items-center justify-center hover:bg-border shrink-0 no-print"
          >
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
          </button>
        </div>
      </div>

      <div className="space-y-6 print-area">

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Kpi label={t.dashboard.kpiLots} value={formatInt(metrics.lots)} />
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
            <MonthlyEvolutionLine rows={evolution.rows} lots={evolution.lots} />
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
            title={t.dashboard.chartProduction}
            subtitle={t.dashboard.chartProductionSubtitle}
            height={Math.max(280, productionByLot.length * 56 + 80)}
          >
            {productionByLot.length === 0 ? (
              <EmptyMini text="Cargá Stock y Pesadas para ver la producción" />
            ) : (
              <EntryExitWeightByLot data={productionByLot} />
            )}
          </ChartCard>

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
    <div className="bg-surface border border-border rounded-xl px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-text-muted font-medium">
        {label}
      </div>
      <div className={`text-2xl font-semibold mt-0.5 ${color}`}>{value}</div>
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
  );
}

function monthsDiffDays(fromKey: string, toKey: string): number {
  const a = /^(\d{4})-(\d{2})$/.exec(fromKey);
  const b = /^(\d{4})-(\d{2})$/.exec(toKey);
  if (!a || !b) return 0;
  const d1 = new Date(Number(a[1]), Number(a[2]) - 1, 1);
  const d2 = new Date(Number(b[1]), Number(b[2]) - 1, 1);
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
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
      const perTag = summarizeWeights(current.rows, prev.rows);
      let adg: number | null = perTag.avgAdg;
      if (adg === null) {
        const lastSum = summarizeWeights(current.rows);
        const prevSum = summarizeWeights(prev.rows);
        const days = monthsDiffDays(prevKey, m.key);
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
