"use client";

import { useEffect, useRef, useState } from "react";
import { monthKey, parseMonthKey } from "@/lib/calc";
import { t } from "@/lib/i18n";

export interface MonthData {
  hpg: boolean;
  treatment: boolean;
  weights: boolean;
  vaccines: boolean;
}

interface Props {
  value: string;
  onChange: (key: string) => void;
  dataByMonth: Record<string, MonthData>;
}

export function MonthPicker({ value, onChange, dataByMonth }: Props) {
  const parsed = parseMonthKey(value) ?? {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  };
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed.year);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setViewYear(parsed.year);
  }, [open, parsed.year]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const select = (monthIdx: number) => {
    onChange(monthKey(viewYear, monthIdx));
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full sm:w-48 h-11 px-3 rounded-lg border border-border bg-surface text-sm text-text hover:border-primary focus:border-primary focus:outline-none transition-colors flex items-center justify-between gap-2"
      >
        <span className="truncate">
          {t.months[parsed.month]} {parsed.year}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 text-text-muted shrink-0"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open ? (
        <div className="absolute z-40 mt-2 inset-x-0 sm:left-auto sm:right-0 sm:w-72 bg-surface border border-border rounded-xl shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              aria-label="Año anterior"
              className="h-8 w-8 rounded-md hover:bg-surface-2 text-text-muted inline-flex items-center justify-center"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-sm font-semibold tabular-nums">
              {viewYear}
            </span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              aria-label="Año siguiente"
              className="h-8 w-8 rounded-md hover:bg-surface-2 text-text-muted inline-flex items-center justify-center"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {t.months.map((label, idx) => {
              const key = monthKey(viewYear, idx);
              const data = dataByMonth[key];
              const has = data && (data.hpg || data.treatment || data.weights || data.vaccines);
              const selected =
                parsed.year === viewYear && parsed.month === idx;
              const parts: string[] = [];
              if (data?.hpg) parts.push("HPG");
              if (data?.treatment) parts.push("Tratamiento");
              if (data?.weights) parts.push("Pesadas");
              if (data?.vaccines) parts.push("Vacunas");
              const title = has
                ? parts.join(" · ")
                : "Sin datos";
              return (
                <div key={key} className="relative group">
                  <button
                    type="button"
                    onClick={() => select(idx)}
                    className={`w-full h-10 rounded-md text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5 ${
                      selected
                        ? "bg-primary text-white"
                        : "bg-surface-2 text-text hover:bg-border"
                    }`}
                  >
                    {has ? (
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          selected ? "bg-white" : "bg-primary"
                        }`}
                        aria-hidden
                      />
                    ) : null}
                    {label.slice(0, 3)}
                  </button>
                  {has ? (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2 py-1 text-[10px] font-medium rounded-md bg-text text-surface whitespace-nowrap shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      {title}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
