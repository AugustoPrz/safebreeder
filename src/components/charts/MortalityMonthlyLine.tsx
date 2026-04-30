"use client";

import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: { label: string; count: number }[];
}

const COLOR = "#b5461f"; // clay — mortality

export function MortalityMonthlyLine({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 28, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="#e3e6dc" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#6b6f5d" }}
          stroke="#e3e6dc"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#6b6f5d" }}
          stroke="#e3e6dc"
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            borderColor: "#e3e6dc",
          }}
          formatter={(v) => (typeof v === "number" ? `${v} animales` : "—")}
        />
        <Line
          type="monotone"
          dataKey="count"
          name="Muertes"
          stroke={COLOR}
          strokeWidth={2}
          dot={{ r: 4, fill: COLOR }}
          activeDot={{ r: 5 }}
        >
          <LabelList
            dataKey="count"
            position="top"
            fill={COLOR}
            fontSize={11}
            fontWeight={600}
          />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
}
