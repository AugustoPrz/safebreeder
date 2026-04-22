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
import type { Lot } from "@/lib/types";

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
  lots: Lot[];
}

export function MonthlyEvolutionLine({ rows, lots }: Props) {
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
        {lots.map((lot, i) => (
          <Line
            key={lot.id}
            type="monotone"
            dataKey={lot.id}
            name={lot.name}
            stroke={PALETTE[i % PALETTE.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          >
            <LabelList
              dataKey={lot.id}
              position="top"
              style={{
                fontSize: 10,
                fill: PALETTE[i % PALETTE.length],
                fontWeight: 600,
              }}
            />
          </Line>
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
