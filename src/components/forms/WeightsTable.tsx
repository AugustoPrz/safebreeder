"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";
import {
  calculateAdg,
  formatInt,
  formatNumber,
  previousMonthKey,
  summarizeWeights,
} from "@/lib/calc";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { WeightRecord } from "@/lib/types";

interface Props {
  lotId: string;
  monthKey: string;
}

const emptyRecord: WeightRecord = { rows: [], notes: "" };

export function WeightsTable({ lotId, monthKey }: Props) {
  const record =
    useStore((s) => s.db.weights[lotId]?.[monthKey]) ?? emptyRecord;
  const prevKey = previousMonthKey(monthKey);
  const previousRecord =
    useStore((s) => (prevKey ? s.db.weights[lotId]?.[prevKey] : undefined)) ??
    emptyRecord;

  const addRow = useStore((s) => s.addWeightRow);
  const updateRow = useStore((s) => s.updateWeightRow);
  const deleteRow = useStore((s) => s.deleteWeightRow);
  const setNotes = useStore((s) => s.setWeightNotes);

  const prevMap = new Map(
    previousRecord.rows.map((r) => [r.tagId.trim(), r.weightKg]),
  );

  const summary = summarizeWeights(record.rows, previousRecord.rows);

  const parseNum = (v: string): number | null =>
    v === "" ? null : Number.isNaN(Number(v)) ? null : Number(v);

  return (
    <div className="space-y-4">
      <Card>
        <div className="px-5 pt-4 pb-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{t.weights.title}</h2>
            <p className="text-xs text-text-muted">{t.weights.subtitle}</p>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2/60 text-text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5 text-left w-10">#</th>
                <th className="px-4 py-2.5 text-left">{t.weights.tagId}</th>
                <th className="px-4 py-2.5 text-left">{t.weights.current}</th>
                <th className="px-4 py-2.5 text-left">{t.weights.previous}</th>
                <th className="px-4 py-2.5 text-left">{t.weights.gain}</th>
                <th className="px-4 py-2.5 text-left">{t.weights.adg}</th>
                <th className="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {record.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-text-muted"
                  >
                    {t.common.empty}
                  </td>
                </tr>
              ) : (
                record.rows.map((row, idx) => {
                  const prev = prevMap.get(row.tagId.trim()) ?? null;
                  const adg = calculateAdg(row.weightKg, prev);
                  const gain =
                    row.weightKg !== null && prev !== null
                      ? row.weightKg - prev
                      : null;
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
                      <td className="px-4 py-2 text-text-muted">
                        {prev === null ? "—" : formatNumber(prev, 1)}
                      </td>
                      <td className="px-4 py-2">
                        {gain === null
                          ? "—"
                          : `${gain >= 0 ? "+" : ""}${formatNumber(gain, 1)}`}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            adg === null
                              ? "text-text-muted"
                              : adg >= 0
                                ? "text-primary font-medium"
                                : "text-clay font-medium"
                          }
                        >
                          {adg === null ? "—" : formatNumber(adg, 2)}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => deleteRow(lotId, monthKey, idx)}
                          className="text-text-muted hover:text-clay"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-border">
          {record.rows.length === 0 ? (
            <div className="p-6 text-center text-text-muted text-sm">
              {t.common.empty}
            </div>
          ) : (
            record.rows.map((row, idx) => {
              const prev = prevMap.get(row.tagId.trim()) ?? null;
              const adg = calculateAdg(row.weightKg, prev);
              return (
                <div key={idx} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-muted">
                      #{idx + 1}
                    </span>
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
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label={t.weights.tagId}>
                      <Input
                        value={row.tagId}
                        onChange={(e) =>
                          updateRow(lotId, monthKey, idx, {
                            tagId: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label={t.weights.current}>
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
                  </div>
                  <div className="grid grid-cols-3 text-xs gap-2 text-text-muted">
                    <div>
                      <div>{t.weights.previous}</div>
                      <div className="text-text">
                        {prev === null ? "—" : formatNumber(prev, 1)}
                      </div>
                    </div>
                    <div>
                      <div>{t.weights.adg}</div>
                      <div
                        className={
                          adg === null
                            ? "text-text-muted"
                            : adg >= 0
                              ? "text-primary"
                              : "text-clay"
                        }
                      >
                        {adg === null ? "—" : formatNumber(adg, 2)}
                      </div>
                    </div>
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
            + {t.weights.addRow}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatBox label={t.weights.animals} value={formatInt(summary.count)} />
        <StatBox
          label={t.weights.avgWeight}
          value={formatNumber(summary.avgWeight, 1)}
        />
        <StatBox
          label={t.weights.avgAdg}
          value={formatNumber(summary.avgAdg, 2)}
        />
      </div>

      <Card>
        <CardBody>
          <Field label={t.common.observations}>
            <Textarea
              value={record.notes}
              onChange={(e) => setNotes(lotId, monthKey, e.target.value)}
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
