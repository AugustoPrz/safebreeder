"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLOR_ENTRADA = "#4d7c2a"; // primary green
const COLOR_SALIDA = "#c8a415"; // sun

export interface EntryExitDatum {
  name: string;
  entrada: number;
  salida: number;
  gainTotal: number | null;
  gainPerAnimal: number | null;
}

interface Props {
  data: EntryExitDatum[];
}

export function EntryExitWeightByLot({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 40, right: 12, left: 0, bottom: 8 }}
        barCategoryGap="22%"
      >
        <CartesianGrid stroke="#e3e6dc" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#6b6f5d" }}
          stroke="#e3e6dc"
        />
        <YAxis tick={{ fontSize: 11, fill: "#6b6f5d" }} stroke="#e3e6dc" />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            borderColor: "#e3e6dc",
          }}
          formatter={(value) =>
            typeof value === "number" ? `${Math.round(value)} kg` : "—"
          }
        />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          content={() => (
            <div className="flex justify-center gap-4 text-[11px] mt-1">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 inline-block rounded-sm"
                  style={{ backgroundColor: COLOR_ENTRADA }}
                />
                Entrada
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 inline-block rounded-sm"
                  style={{ backgroundColor: COLOR_SALIDA }}
                />
                Salida
              </span>
            </div>
          )}
        />
        <Bar
          dataKey="entrada"
          name="Entrada"
          fill={COLOR_ENTRADA}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="salida"
          name="Salida"
          fill={COLOR_SALIDA}
          radius={[4, 4, 0, 0]}
        >
          <LabelList
            dataKey="gainTotal"
            position="top"
            offset={6}
            fontSize={11}
            fontWeight={600}
            fill="#1f2518"
            formatter={(v) =>
              typeof v === "number" ? `+${Math.round(v)} kg` : ""
            }
          />
          <LabelList
            dataKey="gainPerAnimal"
            position="top"
            offset={20}
            fontSize={10}
            fill="#6b6f5d"
            formatter={(v) =>
              typeof v === "number" ? `+${v.toFixed(1)} kg/an.` : ""
            }
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
