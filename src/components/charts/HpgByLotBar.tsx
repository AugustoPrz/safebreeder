"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { classifyHpg } from "@/lib/calc";

const COLORS: Record<string, string> = {
  low: "#4d7c2a",
  moderate: "#c8a415",
  high: "#b5461f",
  none: "#7a8450",
};

interface Props {
  data: { name: string; value: number }[];
}

export function HpgByLotBar({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="#e3e6dc" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#6b6f5d" }}
          stroke="#e3e6dc"
        />
        <YAxis tick={{ fontSize: 11, fill: "#6b6f5d" }} stroke="#e3e6dc" />
        <Bar dataKey="value" name="HPG promedio" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={COLORS[classifyHpg(d.value)]} />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            style={{ fontSize: 11, fill: "#1f2518", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
