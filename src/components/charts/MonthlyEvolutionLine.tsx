"use client";

import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
const PALETTE = [
  "#4d7c2a",
  "#c8a415",
  "#2f6690",
  "#b5461f",
  "#7a8450",
  "#8a2f15",
];

interface Props {
  rows: Record<string, number | string>[];
  /** One line per series; `key` matches the data key in each row. */
  series: { key: string; name: string }[];
}

export function MonthlyEvolutionLine({ rows, series }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rows} margin={{ top: 24, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="#e3e6dc" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#6b6f5d" }}
          stroke="#e3e6dc"
        />
        <YAxis tick={{ fontSize: 11, fill: "#6b6f5d" }} stroke="#e3e6dc" />
        <Legend
          iconType="line"
          formatter={(v) => <span style={{ color: "#1f2518" }}>{v}</span>}
        />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={PALETTE[i % PALETTE.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          >
            <LabelList
              dataKey={s.key}
              position="top"
              fill={PALETTE[i % PALETTE.length]}
              fontSize={10}
              fontWeight={600}
            />
          </Line>
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
