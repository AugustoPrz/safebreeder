"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Textarea } from "@/components/ui/Input";
import {
  averageHpg,
  classifyHpg,
  formatInt,
  formatNumber,
  maxHpg,
  positiveRate,
} from "@/lib/calc";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { HpgRecord } from "@/lib/types";

interface Props {
  lotId: string;
  monthKey: string;
}

const emptyRecord: HpgRecord = { rows: [], notes: "" };

const hpgLabels: Record<string, string> = {
  none: t.hpg.none,
  low: t.hpg.low,
  moderate: t.hpg.moderate,
  high: t.hpg.high,
};

export function HpgTable({ lotId, monthKey }: Props) {
  const record =
    useStore((s) => s.db.hpg[lotId]?.[monthKey]) ?? emptyRecord;
  const addRow = useStore((s) => s.addHpgRow);
  const updateRow = useStore((s) => s.updateHpgRow);
  const deleteRow = useStore((s) => s.deleteHpgRow);
  const setNotes = useStore((s) => s.setHpgNotes);

  const avg = averageHpg(record.rows);
  const max = maxHpg(record.rows);
  const pos = positiveRate(record.rows);

  const parseNum = (v: string): number | null =>
    v === "" ? null : Number.isNaN(Number(v)) ? null : Number(v);

  return (
    <div className="space-y-4">
      <Card>
        <div className="px-5 pt-4 pb-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-semibold">{t.hpg.title}</h2>
            <p className="text-xs text-text-muted">{t.hpg.subtitle}</p>
          </div>
          <span className="text-xs text-text-muted">{t.hpg.legend}</span>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2/60 text-text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5 text-left w-10">#</th>
                <th className="px-4 py-2.5 text-left">{t.hpg.tagId}</th>
                <th className="px-4 py-2.5 text-left">{t.hpg.weight}</th>
                <th className="px-4 py-2.5 text-left">{t.hpg.value}</th>
                <th className="px-4 py-2.5 text-left">{t.hpg.level}</th>
                <th className="px-4 py-2.5 w-14"></th>
              </tr>
            </thead>
            <tbody>
              {record.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-text-muted"
                  >
                    {t.common.empty}
                  </td>
                </tr>
              ) : (
                record.rows.map((row, idx) => {
                  const level = classifyHpg(row.hpg);
                  return (
                    <tr
                      key={idx}
                      className="border-t border-border hover:bg-surface-2/30"
                    >
                      <td className="px-4 py-2 text-text-muted">{idx + 1}</td>
                      <td className="px-2 py-1.5">
                        <Input
                          className="h-9"
                          value={row.tagId}
                          onChange={(e) =>
                            updateRow(lotId, monthKey, idx, {
                              tagId: e.target.value,
                            })
                          }
                          placeholder="Ej: 123"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          className="h-9"
                          type="number"
                          inputMode="decimal"
                          value={row.weightKg ?? ""}
                          onChange={(e) =>
                            updateRow(lotId, monthKey, idx, {
                              weightKg: parseNum(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          className="h-9"
                          type="number"
                          inputMode="numeric"
                          value={row.hpg ?? ""}
                          onChange={(e) =>
                            updateRow(lotId, monthKey, idx, {
                              hpg: parseNum(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Badge variant={level}>{hpgLabels[level]}</Badge>
                      </td>
                      <td className="px-4 py-1.5 align-middle text-center">
                        <button
                          type="button"
                          onClick={() => deleteRow(lotId, monthKey, idx)}
                          className="text-text-muted hover:text-clay inline-flex"
                          aria-label={t.common.delete}
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {record.rows.length === 0 ? (
            <div className="p-6 text-center text-text-muted text-sm">
              {t.common.empty}
            </div>
          ) : (
            record.rows.map((row, idx) => {
              const level = classifyHpg(row.hpg);
              return (
                <div key={idx} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-text-muted">
                        #{idx + 1}
                      </span>
                      <Badge variant={level}>{hpgLabels[level]}</Badge>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteRow(lotId, monthKey, idx)}
                      className="text-text-muted hover:text-clay"
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
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label={t.hpg.tagId}>
                      <Input
                        value={row.tagId}
                        onChange={(e) =>
                          updateRow(lotId, monthKey, idx, {
                            tagId: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label={t.hpg.weight}>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={row.weightKg ?? ""}
                        onChange={(e) =>
                          updateRow(lotId, monthKey, idx, {
                            weightKg: parseNum(e.target.value),
                          })
                        }
                      />
                    </Field>
                    <Field label={t.hpg.value}>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={row.hpg ?? ""}
                        onChange={(e) =>
                          updateRow(lotId, monthKey, idx, {
                            hpg: parseNum(e.target.value),
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-border flex justify-end bg-surface-2/30">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => addRow(lotId, monthKey)}
          >
            + {t.hpg.addRow}
          </Button>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label={t.hpg.sampleCount} value={formatInt(record.rows.length)} />
        <StatBox label={t.hpg.average} value={formatNumber(avg, 0)} />
        <StatBox label={t.hpg.max} value={formatInt(max)} />
        <StatBox
          label={t.hpg.positives}
          value={pos === null ? "—" : `${formatNumber(pos, 0)}%`}
        />
      </div>

      <Card>
        <CardBody>
          <Field label={t.common.observations}>
            <Textarea
              value={record.notes}
              onChange={(e) => setNotes(lotId, monthKey, e.target.value)}
              placeholder="Ej: Muestras tomadas durante la recorrida…"
            />
          </Field>
        </CardBody>
      </Card>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-text-muted font-medium">
        {label}
      </div>
      <div className="text-xl font-semibold mt-0.5">{value}</div>
    </div>
  );
}
