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

export function WeightByLotBar({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 24, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="#e3e6dc" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#6b6f5d" }}
          stroke="#e3e6dc"
        />
        <YAxis tick={{ fontSize: 11, fill: "#6b6f5d" }} stroke="#e3e6dc" />
        <Bar dataKey="value" name="Peso promedio" fill="#2f6690" radius={[6, 6, 0, 0]}>
          <LabelList
            dataKey="value"
            position="top"
            formatter={((v: unknown) => `${v} kg`) as never}
            style={{ fontSize: 11, fill: "#1f2518", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
