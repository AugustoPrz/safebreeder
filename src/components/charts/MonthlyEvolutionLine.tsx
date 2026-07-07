"use client";

import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

// High-contrast palette; distinct hues so adjacent series read apart.
const PALETTE = [
  "#4d7c2a", // green
  "#c8a415", // gold
  "#2f6690", // blue
  "#b5461f", // clay
  "#7a3fa0", // purple
  "#0f766e", // teal
  "#be123c", // crimson
  "#5b6b8c", // slate
];
// Once colours wrap, vary the dash pattern so repeated colours still differ.
const DASHES = ["0", "6 3", "2 3"];
const strokeStyle = (i: number) => ({
  stroke: PALETTE[i % PALETTE.length],
  strokeDasharray: DASHES[Math.floor(i / PALETTE.length) % DASHES.length],
});

interface Props {
  rows: Record<string, number | string>[];
  /** One line per series; `key` matches the data key in each row. */
  series: { key: string; name: string }[];
}

export function MonthlyEvolutionLine({ rows, series }: Props) {
  const multiSeries = series.length > 1;
  return (
    // Legend rendered as plain HTML OUTSIDE the SVG — Recharts' <Legend>
    // wraps its content in <foreignObject>, which causes WebKit/Safari to
    // rasterise the entire chart when printing (blocky PDF output).
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 24, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#e3e6dc" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#6b6f5d" }}
              stroke="#e3e6dc"
            />
            <YAxis tick={{ fontSize: 11, fill: "#6b6f5d" }} stroke="#e3e6dc" />
            {series.map((s, i) => {
              const { stroke, strokeDasharray } = strokeStyle(i);
              return (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={stroke}
                  strokeDasharray={strokeDasharray}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                >
                  <LabelList
                    dataKey={s.key}
                    position="top"
                    fill={stroke}
                    fontSize={10}
                    fontWeight={600}
                  />
                </Line>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {multiSeries && (
        <div className="flex items-center justify-center gap-4 pb-1 flex-shrink-0 flex-wrap">
          {series.map((s, i) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-text-muted">
              <span
                className="inline-block flex-shrink-0"
                style={{
                  width: 20,
                  height: 2,
                  background: strokeStyle(i).stroke,
                  borderRadius: 1,
                }}
              />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
