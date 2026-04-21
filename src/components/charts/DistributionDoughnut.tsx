"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { t } from "@/lib/i18n";

interface Props {
  low: number;
  moderate: number;
  high: number;
}

export function DistributionDoughnut({ low, moderate, high }: Props) {
  const data = [
    { name: t.hpg.low, value: low, color: "#4d7c2a" },
    { name: t.hpg.moderate, value: moderate, color: "#c8a415" },
    { name: t.hpg.high, value: high, color: "#b5461f" },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={85}
          paddingAngle={2}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: "1px solid #e3e6dc",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend
          iconType="circle"
          formatter={(v) => <span style={{ color: "#1f2518" }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
