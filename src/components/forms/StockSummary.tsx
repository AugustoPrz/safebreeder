"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardBody } from "@/components/ui/Card";
import { t } from "@/lib/i18n";
import type { StockAnimal, StockSize } from "@/lib/types";

interface Props {
  rows: StockAnimal[];
}

interface WeightBucket {
  label: string;
  min: number;
  max: number;
  total: number;
  Macho: number;
  Hembra: number;
  cabeza: number;
  cuerpo: number;
  cola: number;
}

const COLOR_MACHO = "#4d7c2a"; // primary green
const COLOR_HEMBRA = "#c8a415"; // sun/yellow
const COLOR_TAMANO: Record<StockSize, string> = {
  cabeza: "#4d7c2a",
  cuerpo: "#c8a415",
  cola: "#b5461f",
};

export function StockSummary({ rows }: Props) {
  const machos = rows.filter((r) => r.sexo === "macho").length;
  const hembras = rows.filter((r) => r.sexo === "hembra").length;

  const weightBuckets = useMemo(() => buildWeightBuckets(rows), [rows]);
  const origenData = useMemo(() => buildOrigenData(rows), [rows]);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Kpi
          label={t.stock.sexes.macho + "s"}
          value={machos.toString()}
          tone="primary"
        />
        <Kpi
          label={t.stock.sexes.hembra + "s"}
          value={hembras.toString()}
          tone="sun"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Distribución de peso */}
        <Card>
          <div className="px-5 pt-4 pb-3 border-b border-border">
            <h3 className="font-semibold text-sm">Distribución de peso</h3>
            <p className="text-xs text-text-muted">
              3 rangos automáticos · machos / hembras y tamaño
            </p>
          </div>
          <CardBody>
            {weightBuckets.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-sm">
                Sin datos de peso
              </div>
            ) : (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weightBuckets}
                      margin={{ top: 16, right: 12, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid
                        stroke="#e3e6dc"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#6b6f5d" }}
                        stroke="#e3e6dc"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#6b6f5d" }}
                        stroke="#e3e6dc"
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          borderColor: "#e3e6dc",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar
                        dataKey="Macho"
                        stackId="sex"
                        fill={COLOR_MACHO}
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="Hembra"
                        stackId="sex"
                        fill={COLOR_HEMBRA}
                        radius={[6, 6, 0, 0]}
                      >
                        <LabelList
                          dataKey="total"
                          position="top"
                          fill="#1f2518"
                          fontSize={11}
                          fontWeight={600}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Tamaño breakdown per bucket */}
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted font-medium mb-2">
                    Tamaño por rango
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {weightBuckets.map((b) => (
                      <div
                        key={b.label}
                        className="bg-surface-2/40 rounded-lg px-3 py-2"
                      >
                        <div className="text-xs font-medium mb-1">
                          {b.label}
                        </div>
                        <div className="space-y-0.5 text-[11px] text-text-muted">
                          <SizeLine
                            label={t.stock.sizes.cabeza}
                            value={b.cabeza}
                            color={COLOR_TAMANO.cabeza}
                          />
                          <SizeLine
                            label={t.stock.sizes.cuerpo}
                            value={b.cuerpo}
                            color={COLOR_TAMANO.cuerpo}
                          />
                          <SizeLine
                            label={t.stock.sizes.cola}
                            value={b.cola}
                            color={COLOR_TAMANO.cola}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* Distribución por origen */}
        <Card>
          <div className="px-5 pt-4 pb-3 border-b border-border">
            <h3 className="font-semibold text-sm">Distribución por origen</h3>
            <p className="text-xs text-text-muted">
              Cantidad de animales según procedencia
            </p>
          </div>
          <CardBody>
            {origenData.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-sm">
                Sin datos de origen
              </div>
            ) : (
              <div style={{ height: Math.max(180, origenData.length * 36) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={origenData}
                    layout="vertical"
                    margin={{ top: 8, right: 28, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid
                      stroke="#e3e6dc"
                      strokeDasharray="3 3"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#6b6f5d" }}
                      stroke="#e3e6dc"
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 11, fill: "#1f2518" }}
                      stroke="#e3e6dc"
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        borderColor: "#e3e6dc",
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {origenData.map((_, i) => (
                        <Cell key={i} fill={COLOR_MACHO} />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="right"
                        fill="#1f2518"
                        fontSize={11}
                        fontWeight={600}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function buildWeightBuckets(rows: StockAnimal[]): WeightBucket[] {
  const weighed = rows
    .map((r) => ({
      ...r,
      pesoNum: Number(String(r.peso).replace(",", ".")),
    }))
    .filter((r) => Number.isFinite(r.pesoNum) && r.pesoNum > 0);

  if (weighed.length === 0) return [];

  const min = Math.min(...weighed.map((r) => r.pesoNum));
  const max = Math.max(...weighed.map((r) => r.pesoNum));

  // If everyone has the same weight, single bucket.
  if (min === max) {
    return [makeBucket(`${formatKg(min)}`, min, max, weighed)];
  }

  const span = max - min;
  const step = span / 3;
  // Use rounded boundaries so the labels read cleanly.
  const b1 = roundNice(min + step);
  const b2 = roundNice(min + 2 * step);

  const buckets: { lo: number; hi: number; label: string }[] = [
    { lo: min, hi: b1, label: `${formatKg(min)}–${formatKg(b1)}` },
    { lo: b1, hi: b2, label: `${formatKg(b1)}–${formatKg(b2)}` },
    { lo: b2, hi: max, label: `${formatKg(b2)}–${formatKg(max)}` },
  ];

  return buckets.map((b, i) =>
    makeBucket(
      b.label,
      b.lo,
      b.hi,
      weighed.filter((r) =>
        // Lower-inclusive on every bucket; upper-inclusive only on the last
        // so the very heaviest animal still falls into bucket 3.
        i === buckets.length - 1
          ? r.pesoNum >= b.lo && r.pesoNum <= b.hi
          : r.pesoNum >= b.lo && r.pesoNum < b.hi,
      ),
    ),
  );
}

function makeBucket(
  label: string,
  min: number,
  max: number,
  rows: { sexo: StockAnimal["sexo"]; tamano: StockAnimal["tamano"] }[],
): WeightBucket {
  return {
    label,
    min,
    max,
    total: rows.length,
    Macho: rows.filter((r) => r.sexo === "macho").length,
    Hembra: rows.filter((r) => r.sexo === "hembra").length,
    cabeza: rows.filter((r) => r.tamano === "cabeza").length,
    cuerpo: rows.filter((r) => r.tamano === "cuerpo").length,
    cola: rows.filter((r) => r.tamano === "cola").length,
  };
}

function buildOrigenData(rows: StockAnimal[]) {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = r.origen.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function roundNice(n: number) {
  // Whole kg is plenty for cattle.
  return Math.round(n);
}

function formatKg(n: number) {
  return `${roundNice(n)}`;
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "sun";
}) {
  const color = tone === "primary" ? "text-primary" : "text-sun-soft-text";
  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-text-muted font-medium">
        {label}
      </div>
      <div className={`text-2xl font-semibold mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}

function SizeLine({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full inline-block"
          style={{ backgroundColor: color }}
        />
        {label}
      </span>
      <span className="text-text font-medium tabular-nums">{value}</span>
    </div>
  );
}
