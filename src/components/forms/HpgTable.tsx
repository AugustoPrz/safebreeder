"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  addDaysIso,
  buildIcs,
  downloadIcs,
  googleCalendarUrl,
  reminderWindow,
  type CalendarEvent,
} from "@/lib/calendar";
import { useEstablishment, useLot } from "@/hooks/useDb";
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
  const setSampleDate = useStore((s) => s.setHpgSampleDate);

  const lot = useLot(lotId);
  const est = useEstablishment(lot?.establishmentId);

  // Constrain the picker to the selected month. monthKey = "YYYY-MM".
  const monthValid = /^\d{4}-\d{2}$/.test(monthKey);
  const minDate = monthValid ? `${monthKey}-01` : "";
  const maxDate = monthValid
    ? (() => {
        const [y, mIdx] = monthKey.split("-").map((n) => parseInt(n, 10));
        // new Date(y, mIdx, 0) = last day of month mIdx (since JS month is 0-indexed)
        const lastDay = new Date(y, mIdx, 0).getDate();
        return `${monthKey}-${String(lastDay).padStart(2, "0")}`;
      })()
    : "";

  // Default the sample date to the 1st of the selected month — the user can
  // override (within the month). We don't auto-persist the default; we save
  // only when the user changes it or fires a calendar action.
  const defaultSampleDate = minDate;
  const displayDate = record.sampleDate ?? defaultSampleDate;

  const avg = averageHpg(record.rows);
  const max = maxHpg(record.rows);
  const pos = positiveRate(record.rows);

  const parseNum = (v: string): number | null =>
    v === "" ? null : Number.isNaN(Number(v)) ? null : Number(v);

  const buildEvent = (sampleIso: string): CalendarEvent => {
    const { start, end } = reminderWindow(sampleIso);
    const cycleDate = addDaysIso(sampleIso, 30);
    const lotUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/lots/${lotId}/hpg`
        : `https://safebreeder.com/lots/${lotId}/hpg`;
    const lotName = lot?.name ?? "lote";
    const estName = est?.name ?? "establecimiento";
    const locationParts = [
      est?.name,
      est?.district,
      est?.province,
    ].filter(Boolean) as string[];
    return {
      uid: `hpg-${lotId}-${monthKey}@safebreeder.com`,
      title: t.hpg.reminder.eventTitle(lotName),
      description: t.hpg.reminder.eventDescription({
        lotName,
        estName,
        cycleDate,
        lotUrl,
      }),
      location: locationParts.length > 0 ? locationParts.join(", ") : undefined,
      start,
      end,
    };
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const handleAddGoogle = () => {
    if (!displayDate) return;
    setMenuOpen(false);
    // If we're using the default and the user hasn't touched it, persist it
    // so the reminder is reproducible across sessions.
    if (!record.sampleDate) setSampleDate(lotId, monthKey, displayDate);
    const url = googleCalendarUrl(buildEvent(displayDate));
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownloadIcs = () => {
    if (!displayDate) return;
    setMenuOpen(false);
    if (!record.sampleDate) setSampleDate(lotId, monthKey, displayDate);
    const ics = buildIcs(buildEvent(displayDate));
    const safeName = (lot?.name ?? "lote").replace(/[^\w-]+/g, "_");
    downloadIcs(ics, `safebreeder-hpg-${safeName}-${displayDate}.ics`);
  };

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

        {/* Reminder: sample date + calendar buttons */}
        <div className="px-5 py-4 border-b border-border bg-surface-2/30">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-shrink-0">
              <Field label={t.hpg.sampleDate}>
                <Input
                  type="date"
                  value={displayDate}
                  min={minDate || undefined}
                  max={maxDate || undefined}
                  onChange={(e) =>
                    setSampleDate(lotId, monthKey, e.target.value || null)
                  }
                  className="w-44"
                />
              </Field>
            </div>
            <div ref={menuRef} className="relative pb-px">
              <Button
                variant="secondary"
                disabled={!displayDate}
                onClick={() => setMenuOpen((o) => !o)}
                type="button"
              >
                <CalendarIcon />
                {t.hpg.reminder.trigger}
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                />
              </Button>
              {menuOpen ? (
                <div className="absolute left-0 top-full mt-1.5 z-20 min-w-[230px] bg-surface border border-border rounded-lg shadow-md overflow-hidden">
                  <button
                    type="button"
                    onClick={handleAddGoogle}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-surface-2 flex items-center gap-2"
                  >
                    <GoogleIcon />
                    {t.hpg.reminder.addGoogle}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadIcs}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-surface-2 flex items-center gap-2 border-t border-border"
                  >
                    <DownloadIcon />
                    {t.hpg.reminder.downloadIcs}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            {t.hpg.reminder.helper}
          </p>
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

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ChevronDownIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 shrink-0 text-text-muted"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
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
