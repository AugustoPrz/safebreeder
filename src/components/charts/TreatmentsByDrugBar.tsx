"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: { name: string; value: number }[];
}

export function TreatmentsByDrugBar({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 36, left: 12, bottom: 8 }}
      >
        <CartesianGrid
          stroke="#e3e6dc"
          strokeDasharray="3 3"
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#6b6f5d" }}
          stroke="#e3e6dc"
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "#1f2518" }}
          stroke="#e3e6dc"
          width={110}
        />
        <Bar
          dataKey="value"
          name="Aplicaciones"
          fill="#4d7c2a"
          maxBarSize={20}
          radius={[0, 6, 6, 0]}
        >
          <LabelList
            dataKey="value"
            position="right"
            style={{ fontSize: 11, fill: "#1f2518", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
