"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";
import { t } from "@/lib/i18n";

interface Props {
  low: number;
  moderate: number;
  high: number;
}

const RAD = Math.PI / 180;

function renderPercentLabel(props: {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  percent?: number;
  fill: string;
}) {
  const { cx, cy, midAngle, outerRadius, percent, fill } = props;
  if (!percent) return null;
  const r = outerRadius + 18;
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontSize={12}
      fontWeight={600}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
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
          label={renderPercentLabel as never}
          labelLine={false}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} stroke="none" />
          ))}
        </Pie>
        <Legend
          iconType="circle"
          formatter={(v) => <span style={{ color: "#1f2518" }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
