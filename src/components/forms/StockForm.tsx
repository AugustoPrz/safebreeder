"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { STOCK_BREEDS, STOCK_SEXES, STOCK_SIZES } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { useLot } from "@/hooks/useDb";
import { t } from "@/lib/i18n";
import type { StockAnimal } from "@/lib/types";
import { downloadStockCsv } from "@/lib/stockCsv";

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
  const displayRows =
    rows.length > 0
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

  const toggleMuerto = (idx: number) => {
    const today = new Date().toISOString().slice(0, 10);
    const next = displayRows.map((r, i) => {
      if (i !== idx) return r;
      const becomingDead = !r.muerto;
      return {
        ...r,
        muerto: becomingDead,
        // Set deathDate on transition into dead, clear on revive.
        deathDate: becomingDead ? r.deathDate ?? today : undefined,
      };
    });
    setStock(lotId, { rows: next });
  };

  const handleDownload = () => {
    downloadStockCsv(displayRows, lot?.name ?? "stock");
  };

  return (
    <Card>
      <div className="px-5 pt-4 pb-3 border-b border-border flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{t.stock.title}</h2>
          <p className="text-xs text-text-muted">{t.stock.subtitle}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownload}
          type="button"
          title={t.stock.downloadHint}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 mr-1"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t.stock.download}
        </Button>
      </div>

      {/* Desktop / wide screens */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2/60 text-text-muted text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2.5 text-left w-10">#</th>
              <th className="px-2 py-2.5 text-left">{t.stock.caravana}</th>
              <th className="px-2 py-2.5 text-left">{t.stock.origen}</th>
              <th className="px-2 py-2.5 text-left">{t.stock.sexo}</th>
              <th className="px-2 py-2.5 text-left">{t.stock.peso}</th>
              <th className="px-2 py-2.5 text-left">{t.stock.tamano}</th>
              <th className="px-2 py-2.5 text-left">{t.stock.raza}</th>
              <th className="px-2 py-2.5 text-left">{t.stock.observaciones}</th>
              <th className="px-2 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, idx) => (
              <tr
                key={idx}
                className={`border-t border-border hover:bg-surface-2/30 align-middle ${
                  row.muerto
                    ? "bg-clay-soft/20 [&>td:not(:last-child)]:opacity-60"
                    : ""
                }`}
              >
                <td className="px-4 py-2 text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <span>{idx + 1}</span>
                    {row.muerto ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide bg-clay-soft text-clay-soft-text">
                        {t.stock.deadBadge}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    className="h-9"
                    value={row.caravana}
                    onChange={(e) =>
                      updateRow(idx, { caravana: e.target.value })
                    }
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    className="h-9"
                    value={row.origen}
                    onChange={(e) =>
                      updateRow(idx, { origen: e.target.value })
                    }
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Select
                    className="h-9"
                    value={row.sexo}
                    onChange={(e) =>
                      updateRow(idx, {
                        sexo: e.target.value as StockAnimal["sexo"],
                      })
                    }
                  >
                    <option value="">—</option>
                    {STOCK_SEXES.map((s) => (
                      <option key={s} value={s}>
                        {t.stock.sexes[s]}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    className="h-9"
                    inputMode="decimal"
                    value={row.peso}
                    onChange={(e) => updateRow(idx, { peso: e.target.value })}
                    placeholder="kg"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Select
                    className="h-9"
                    value={row.tamano}
                    onChange={(e) =>
                      updateRow(idx, {
                        tamano: e.target.value as StockAnimal["tamano"],
                      })
                    }
                  >
                    <option value="">—</option>
                    {STOCK_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {t.stock.sizes[s]}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-2 py-1.5">
                  <Select
                    className="h-9"
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
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    className="h-9"
                    value={row.observaciones}
                    onChange={(e) =>
                      updateRow(idx, { observaciones: e.target.value })
                    }
                    placeholder={t.stock.observationsPlaceholder}
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <RowActionsMenu
                    isDead={!!row.muerto}
                    canDelete={displayRows.length > 1}
                    onToggleDead={() => toggleMuerto(idx)}
                    onDelete={() => deleteRow(idx)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-border">
        {displayRows.map((row, idx) => (
          <div
            key={idx}
            className={`p-4 space-y-3 ${row.muerto ? "bg-clay-soft/20" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                #{idx + 1}
                {row.muerto ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide bg-clay-soft text-clay-soft-text">
                    {t.stock.deadBadge}
                  </span>
                ) : null}
              </span>
              <RowActionsMenu
                isDead={!!row.muerto}
                canDelete={displayRows.length > 1}
                onToggleDead={() => toggleMuerto(idx)}
                onDelete={() => deleteRow(idx)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t.stock.caravana}>
                <Input
                  value={row.caravana}
                  onChange={(e) =>
                    updateRow(idx, { caravana: e.target.value })
                  }
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
                  inputMode="decimal"
                  value={row.peso}
                  onChange={(e) => updateRow(idx, { peso: e.target.value })}
                  placeholder="kg"
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
            </div>
            <Field label={t.stock.observaciones}>
              <Input
                value={row.observaciones}
                onChange={(e) =>
                  updateRow(idx, { observaciones: e.target.value })
                }
                placeholder={t.stock.observationsPlaceholder}
              />
            </Field>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-border flex justify-end bg-surface-2/30">
        <Button variant="secondary" size="sm" onClick={addRow} type="button">
          + {t.stock.addRow}
        </Button>
      </div>
    </Card>
  );
}

interface RowActionsMenuProps {
  isDead: boolean;
  canDelete: boolean;
  onToggleDead: () => void;
  onDelete: () => void;
}

function RowActionsMenu({
  isDead,
  canDelete,
  onToggleDead,
  onDelete,
}: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.stock.rowMenuTrigger}
        aria-haspopup="menu"
        aria-expanded={open}
        className="text-text-muted hover:text-clay inline-flex p-1 rounded hover:bg-surface-2"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="w-4 h-4"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-20 min-w-[160px] bg-surface border border-border rounded-lg shadow-lg overflow-hidden"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onToggleDead();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-surface-2 flex items-center gap-2"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-clay-soft-text"
              aria-hidden="true"
            >
              {/* Ghost */}
              <path d="M9 10h.01" />
              <path d="M15 10h.01" />
              <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
            </svg>
            {isDead ? t.stock.unmarkDead : t.stock.markDead}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            disabled={!canDelete}
            className="w-full text-left px-3 py-2 text-sm hover:bg-clay-soft/40 text-clay-soft-text flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed border-t border-border"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="w-4 h-4"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            </svg>
            {t.stock.delete}
          </button>
        </div>
      ) : null}
    </div>
  );
}
