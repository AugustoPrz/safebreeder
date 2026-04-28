"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { STOCK_BREEDS, STOCK_SEXES, STOCK_SIZES } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { useLot } from "@/hooks/useDb";
import { t } from "@/lib/i18n";
import type { StockAnimal } from "@/lib/types";

interface Props {
  lotId: string;
}

const emptyAnimal: StockAnimal = {
  caravana: "",
  origen: "",
  sexo: "",
  peso: "",
  tamano: "",
  raza: "",
  observaciones: "",
};

export function StockForm({ lotId }: Props) {
  const lot = useLot(lotId);
  const record = useStore((s) => s.db.stock[lotId]);
  const setStock = useStore((s) => s.setStock);

  // Auto-seed: when there's no record yet but the lot has a head count,
  // initialize with N empty animal rows. Persisted on first save.
  const seedCount = useMemo(() => {
    if (record) return 0;
    return lot?.headCount && lot.headCount > 0 ? lot.headCount : 1;
  }, [record, lot?.headCount]);

  const rows = record?.rows ?? [];
  const displayRows = rows.length > 0
    ? rows
    : Array.from({ length: seedCount }, () => ({ ...emptyAnimal }));

  // Persist the seed exactly once so add/delete/update behave consistently.
  useEffect(() => {
    if (!record && displayRows.length > 0) {
      setStock(lotId, { rows: displayRows });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotId]);

  const updateRow = (idx: number, patch: Partial<StockAnimal>) => {
    const next = displayRows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    setStock(lotId, { rows: next });
  };

  const addRow = () => {
    setStock(lotId, { rows: [...displayRows, { ...emptyAnimal }] });
  };

  const deleteRow = (idx: number) => {
    const next = displayRows.filter((_, i) => i !== idx);
    setStock(lotId, { rows: next });
  };

  return (
    <Card>
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <h2 className="font-semibold">{t.stock.title}</h2>
        <p className="text-xs text-text-muted">{t.stock.subtitle}</p>
      </div>
      <CardBody className="space-y-4">
        {displayRows.map((row, idx) => {
          const canDelete = displayRows.length > 1;
          return (
            <div
              key={idx}
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_1fr_auto_1.2fr_1.6fr_auto] gap-3 items-end ${
                idx > 0 ? "pt-4 border-t border-border" : ""
              }`}
            >
              <Field label={t.stock.caravana}>
                <Input
                  value={row.caravana}
                  onChange={(e) => updateRow(idx, { caravana: e.target.value })}
                />
              </Field>
              <Field label={t.stock.origen}>
                <Input
                  value={row.origen}
                  onChange={(e) => updateRow(idx, { origen: e.target.value })}
                />
              </Field>
              <Field label={t.stock.sexo}>
                <Select
                  value={row.sexo}
                  onChange={(e) =>
                    updateRow(idx, {
                      sexo: e.target.value as StockAnimal["sexo"],
                    })
                  }
                  className="lg:w-32"
                >
                  <option value="">—</option>
                  {STOCK_SEXES.map((s) => (
                    <option key={s} value={s}>
                      {t.stock.sexes[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t.stock.peso}>
                <Input
                  value={row.peso}
                  onChange={(e) => updateRow(idx, { peso: e.target.value })}
                  placeholder="kg"
                  inputMode="decimal"
                />
              </Field>
              <Field label={t.stock.tamano}>
                <Select
                  value={row.tamano}
                  onChange={(e) =>
                    updateRow(idx, {
                      tamano: e.target.value as StockAnimal["tamano"],
                    })
                  }
                  className="lg:w-32"
                >
                  <option value="">—</option>
                  {STOCK_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {t.stock.sizes[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t.stock.raza}>
                <Select
                  value={row.raza}
                  onChange={(e) =>
                    updateRow(idx, {
                      raza: e.target.value as StockAnimal["raza"],
                    })
                  }
                >
                  <option value="">—</option>
                  {STOCK_BREEDS.map((b) => (
                    <option key={b} value={b}>
                      {t.stock.breeds[b]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t.stock.observaciones}>
                <Input
                  value={row.observaciones}
                  onChange={(e) =>
                    updateRow(idx, { observaciones: e.target.value })
                  }
                  placeholder={t.stock.observationsPlaceholder}
                />
              </Field>
              <button
                type="button"
                onClick={() => deleteRow(idx)}
                disabled={!canDelete}
                aria-label={t.stock.deleteRow}
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
            + {t.stock.addRow}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
