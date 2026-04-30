"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLOR_ENTRADA = "#4d7c2a"; // primary green
const COLOR_SALIDA = "#c8a415"; // sun

export interface EntryExitDatum {
  name: string;
  entrada: number;
  salida: number;
  gainTotal: number | null;
  gainPerAnimal: number | null;
}

interface InternalDatum extends EntryExitDatum {
  gainLabel: string | null;
}

interface Props {
  data: EntryExitDatum[];
}

function buildGainLabel(d: EntryExitDatum): string | null {
  const total = d.gainTotal;
  const perAnimal = d.gainPerAnimal;
  const parts: string[] = [];
  if (typeof total === "number") parts.push(`+${Math.round(total)} kg`);
  if (typeof perAnimal === "number")
    parts.push(`+${perAnimal.toFixed(1)} kg/an.`);
  return parts.length ? parts.join(" · ") : null;
}

export function EntryExitWeightByLot({ data }: Props) {
  const enriched: InternalDatum[] = useMemo(
    () => data.map((d) => ({ ...d, gainLabel: buildGainLabel(d) })),
    [data],
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={enriched}
        margin={{ top: 32, right: 16, left: 0, bottom: 8 }}
        barCategoryGap="22%"
      >
        <CartesianGrid stroke="#e3e6dc" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#6b6f5d" }}
          stroke="#e3e6dc"
        />
        <YAxis tick={{ fontSize: 11, fill: "#6b6f5d" }} stroke="#e3e6dc" />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            borderColor: "#e3e6dc",
          }}
          formatter={(value) =>
            typeof value === "number" ? `${Math.round(value)} kg` : "—"
          }
        />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          content={() => (
            <div className="flex justify-center gap-4 text-[11px] mt-1">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 inline-block rounded-sm"
                  style={{ backgroundColor: COLOR_ENTRADA }}
                />
                Entrada
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 inline-block rounded-sm"
                  style={{ backgroundColor: COLOR_SALIDA }}
                />
                Salida
              </span>
            </div>
          )}
        />
        <Bar
          dataKey="entrada"
          name="Entrada"
          fill={COLOR_ENTRADA}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="salida"
          name="Salida"
          fill={COLOR_SALIDA}
          radius={[4, 4, 0, 0]}
        >
          {/* Single-line label combining total + per-animal gains. We render
              via `content` (raw <text>) so the SVG keeps it on one line — the
              built-in formatter+position sometimes wrapped on narrow widths. */}
          <LabelList
            dataKey="gainLabel"
            content={(props) => {
              const { x, y, width, value } = props as {
                x: number;
                y: number;
                width: number;
                value: string | null | undefined;
              };
              if (!value) return null;
              return (
                <text
                  x={x + width / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="#1f2518"
                >
                  {value}
                </text>
              );
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
