"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
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
    // Legend is intentionally rendered as plain HTML OUTSIDE the SVG.
    // Recharts' <Legend> uses <foreignObject> internally, and WebKit/Safari
    // rasterises any SVG that contains <foreignObject> when printing —
    // producing the blocky pixelated output seen in PDF exports.
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
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
              isAnimationActive={false}
              label={renderPercentLabel as never}
              labelLine={false}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* HTML legend — keeps the SVG <foreignObject>-free so WebKit prints it as vectors */}
      <div className="flex items-center justify-center gap-4 pb-1 flex-shrink-0">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs text-text-muted">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: d.color }}
            />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  );
}
