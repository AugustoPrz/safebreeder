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
import { useStore } from "@/lib/store";
import {
  averageHpg,
  classifyHpg,
  formatInt,
  formatMonthKey,
  formatNumber,
  hpgDistribution,
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

  const [filter, setFilter] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const downloadPdf = async () => {
    if (!captureRef.current) return;
    setExporting(true);
    const restores: Array<() => void> = [];
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const svgs = Array.from(
        captureRef.current.querySelectorAll("svg"),
      ) as SVGSVGElement[];
      await Promise.all(
        svgs.map(async (svg) => {
          const rect = svg.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const clone = svg.cloneNode(true) as SVGSVGElement;
          clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
          clone.setAttribute("width", String(rect.width));
          clone.setAttribute("height", String(rect.height));
          const xml = new XMLSerializer().serializeToString(clone);
          const dataUrl =
            "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
          const img = new Image();
          img.src = dataUrl;
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("svg load"));
          });
          const canvas = document.createElement("canvas");
          canvas.width = rect.width * 2;
          canvas.height = rect.height * 2;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const replacement = document.createElement("img");
          replacement.style.width = `${rect.width}px`;
          replacement.style.height = `${rect.height}px`;
          replacement.style.display = "block";
          await new Promise<void>((resolve, reject) => {
            replacement.onload = () => resolve();
            replacement.onerror = () => reject(new Error("img load"));
            replacement.src = canvas.toDataURL("image/png");
          });
          const parent = svg.parentElement;
          if (!parent) return;
          const nextSibling = svg.nextSibling;
          parent.insertBefore(replacement, svg);
          parent.removeChild(svg);
          restores.push(() => {
            replacement.remove();
            parent.insertBefore(svg, nextSibling);
          });
        }),
      );

      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      let y = margin;
      let remaining = imgH;
      const sliceH = pageH - margin * 2;
      const srcRatio = canvas.height / imgH;
      let srcY = 0;
      while (remaining > 0) {
        const currentH = Math.min(sliceH, remaining);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = currentH * srcRatio;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(
          canvas,
          0,
          srcY,
          canvas.width,
          sliceCanvas.height,
          0,
          0,
          canvas.width,
          sliceCanvas.height,
        );
        pdf.addImage(
          sliceCanvas.toDataURL("image/png"),
          "PNG",
          margin,
          y,
          imgW,
          currentH,
        );
        remaining -= currentH;
        srcY += sliceCanvas.height;
        if (remaining > 0) {
          pdf.addPage();
          y = margin;
        }
      }
      const date = new Date().toISOString().slice(0, 10);
      pdf.save(`safebreeder_estadisticas_${date}.pdf`);
    } finally {
      for (const r of restores) r();
      setExporting(false);
    }
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
            disabled={exporting}
            aria-label="Descargar PDF"
            className="h-11 w-11 rounded-lg bg-surface-2 inline-flex items-center justify-center hover:bg-border shrink-0 disabled:opacity-50"
          >
            {exporting ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5 animate-spin"
              >
                <path d="M21 12a9 9 0 1 1-6.2-8.55" />
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

      <div ref={captureRef} className="space-y-6">

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
  children,
  height = 280,
}: {
  title: string;
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <Card>
      <div className="px-5 py-3 border-b border-border">
        <h3 className="font-semibold text-sm">{title}</h3>
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
