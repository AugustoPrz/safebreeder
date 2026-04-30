"use client";

import { Card } from "@/components/ui/Card";
import { t } from "@/lib/i18n";

export type TreatmentLogKind = "antiparasitario" | "vacuna" | "ecto";

export interface TreatmentLogEntry {
  lotName: string;
  date: string;
  product: string;
  kind: TreatmentLogKind;
}

interface Props {
  entries: TreatmentLogEntry[];
}

const KIND_TONE: Record<TreatmentLogKind, string> = {
  antiparasitario: "bg-primary-soft text-primary-soft-text",
  vacuna: "bg-sun-soft text-sun-soft-text",
  ecto: "bg-clay-soft text-clay-soft-text",
};

const KIND_LABEL: Record<TreatmentLogKind, string> = {
  antiparasitario: t.dashboard.treatmentsKindAntiparasitario,
  vacuna: t.dashboard.treatmentsKindVacuna,
  ecto: t.dashboard.treatmentsKindEcto,
};

function formatDate(iso: string): string {
  if (!iso) return "—";
  // ISO YYYY-MM-DD → es-AR DD/MM/YYYY
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function TreatmentsLog({ entries }: Props) {
  return (
    <Card>
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <h2 className="font-semibold">{t.dashboard.chartTreatmentsLog}</h2>
        <p className="text-xs text-text-muted">
          {t.dashboard.chartTreatmentsLogSubtitle}
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="p-8 text-center text-text-muted text-sm">
          {t.dashboard.treatmentsLogEmpty}
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto max-h-[420px]">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-text-muted text-xs uppercase tracking-wide sticky top-0 z-10 shadow-[0_1px_0_0_var(--color-border)]">
                <tr>
                  <th className="px-4 py-2.5 text-left w-32">
                    {t.dashboard.treatmentsLogDate}
                  </th>
                  <th className="px-4 py-2.5 text-left">
                    {t.dashboard.treatmentsLogLot}
                  </th>
                  <th className="px-4 py-2.5 text-left">
                    {t.dashboard.treatmentsLogProduct}
                  </th>
                  <th className="px-4 py-2.5 text-left w-40">
                    {t.dashboard.treatmentsLogKind}
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-border hover:bg-surface-2/30"
                  >
                    <td className="px-4 py-2 text-text-muted tabular-nums">
                      {formatDate(e.date)}
                    </td>
                    <td className="px-4 py-2">{e.lotName}</td>
                    <td className="px-4 py-2 font-medium">{e.product}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${KIND_TONE[e.kind]}`}
                      >
                        {KIND_LABEL[e.kind]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-border max-h-[420px] overflow-y-auto">
            {entries.map((e, idx) => (
              <div key={idx} className="p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-text-muted tabular-nums">
                    {formatDate(e.date)}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${KIND_TONE[e.kind]}`}
                  >
                    {KIND_LABEL[e.kind]}
                  </span>
                </div>
                <div className="text-sm font-medium">{e.product}</div>
                <div className="text-xs text-text-muted">{e.lotName}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
