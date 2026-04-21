"use client";

import { Field, Select } from "@/components/ui/Input";
import { monthKey, parseMonthKey } from "@/lib/calc";
import { t } from "@/lib/i18n";

interface Props {
  value: string;
  onChange: (key: string) => void;
}

const YEAR_MIN = 2020;
const YEAR_MAX = 2035;

export function MonthYearSelector({ value, onChange }: Props) {
  const parsed = parseMonthKey(value) ?? {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  };

  const years: number[] = [];
  for (let y = YEAR_MIN; y <= YEAR_MAX; y++) years.push(y);

  return (
    <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:grid-cols-[minmax(160px,auto)_minmax(110px,auto)]">
      <Field label={t.period.month}>
        <Select
          value={parsed.month}
          onChange={(e) =>
            onChange(monthKey(parsed.year, Number(e.target.value)))
          }
        >
          {t.months.map((m, idx) => (
            <option key={m} value={idx}>
              {m}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t.period.year}>
        <Select
          value={parsed.year}
          onChange={(e) =>
            onChange(monthKey(Number(e.target.value), parsed.month))
          }
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
