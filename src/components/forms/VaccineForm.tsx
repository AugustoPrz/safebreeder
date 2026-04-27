"use client";

import { Card, CardBody } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { VACCINE_DOSE_NUMBERS, VACCINE_TYPES } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { VaccineRecord, VaccineRow } from "@/lib/types";

interface Props {
  lotId: string;
  monthKey: string;
}

const emptyRow: VaccineRow = {
  date: "",
  type: "",
  doseNumber: "",
  brand: "",
  dose: "",
};

export function VaccineForm({ lotId, monthKey }: Props) {
  const record =
    useStore((s) => s.db.vaccines[lotId]?.[monthKey]) ?? { rows: [] };
  const setMonth = useStore((s) => s.setVaccineMonth);

  // Always render at least one row visually so the form isn't empty.
  const displayRows = record.rows.length > 0 ? record.rows : [emptyRow];

  const updateRow = (idx: number, patch: Partial<VaccineRow>) => {
    const next = displayRows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    setMonth(lotId, monthKey, { rows: next });
  };

  const addRow = () => {
    setMonth(lotId, monthKey, { rows: [...displayRows, { ...emptyRow }] });
  };

  const deleteRow = (idx: number) => {
    const next = displayRows.filter((_, i) => i !== idx);
    setMonth(lotId, monthKey, { rows: next });
  };

  return (
    <Card>
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <h2 className="font-semibold">{t.vaccines.title}</h2>
        <p className="text-xs text-text-muted">{t.vaccines.subtitle}</p>
      </div>
      <CardBody className="space-y-4">
        {displayRows.map((row, idx) => {
          const canDelete = displayRows.length > 1 || record.rows.length > 0;
          return (
            <div
              key={idx}
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_auto_1fr_1fr_auto] gap-3 items-end ${
                idx > 0
                  ? "pt-4 border-t border-border"
                  : ""
              }`}
            >
              <Field label={t.vaccines.date}>
                <Input
                  type="date"
                  value={row.date}
                  onChange={(e) => updateRow(idx, { date: e.target.value })}
                />
              </Field>
              <Field label={t.vaccines.type}>
                <Select
                  value={row.type}
                  onChange={(e) =>
                    updateRow(idx, { type: e.target.value as VaccineRow["type"] })
                  }
                >
                  <option value="">—</option>
                  {VACCINE_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {t.vaccines.types[v]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t.vaccines.doseNumber}>
                <Select
                  value={row.doseNumber ?? ""}
                  onChange={(e) =>
                    updateRow(idx, {
                      doseNumber: e.target.value as VaccineRow["doseNumber"],
                    })
                  }
                  className="lg:w-32"
                >
                  <option value="">—</option>
                  {VACCINE_DOSE_NUMBERS.map((d) => (
                    <option key={d} value={d}>
                      {t.vaccines.doseNumbers[d]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t.vaccines.brand}>
                <Input
                  value={row.brand}
                  onChange={(e) => updateRow(idx, { brand: e.target.value })}
                  placeholder="Ej: Bovishield"
                />
              </Field>
              <Field label={t.vaccines.dose}>
                <Input
                  value={row.dose}
                  onChange={(e) => updateRow(idx, { dose: e.target.value })}
                  placeholder="Ej: 5 ml"
                />
              </Field>
              <button
                type="button"
                onClick={() => deleteRow(idx)}
                disabled={!canDelete}
                aria-label="Eliminar vacuna"
                className="h-11 w-11 rounded-lg bg-surface-2 hover:bg-clay-soft hover:text-clay text-text-muted inline-flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shrink-0 transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          );
        })}

        <div className="pt-2 flex justify-end">
          <Button variant="secondary" onClick={addRow} type="button">
            + {t.vaccines.addAnother}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
