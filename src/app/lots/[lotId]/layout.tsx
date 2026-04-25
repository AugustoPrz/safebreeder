"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { MonthPicker, type MonthData } from "@/components/MonthPicker";
import { useLot, useEstablishment, useLotCounts } from "@/hooks/useDb";
import { useStore } from "@/lib/store";
import { useMonthKey } from "@/hooks/useMonthKey";
import { useHydrated } from "@/hooks/useHydrated";
import { t } from "@/lib/i18n";

const tabs = [
  { segment: "hpg", label: t.hpg.title },
  { segment: "treatment", label: t.treatment.title },
  { segment: "weights", label: t.weights.title },
  { segment: "vaccines", label: t.vaccines.title },
];

export default function LotLayout({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const { lotId } = useParams<{ lotId: string }>();
  const pathname = usePathname();
  const lot = useLot(lotId);
  const est = useEstablishment(lot?.establishmentId);
  const counts = useLotCounts(lotId);
  const hpgMonths = useStore((s) => s.db.hpg[lotId]);
  const treatmentMonths = useStore((s) => s.db.treatments[lotId]);
  const weightMonths = useStore((s) => s.db.weights[lotId]);
  const vaccineMonths = useStore((s) => s.db.vaccines[lotId]);
  const [month, setMonth] = useMonthKey();

  const dataByMonth: Record<string, MonthData> = {};
  const seed = (key: string) => {
    if (!dataByMonth[key]) {
      dataByMonth[key] = { hpg: false, treatment: false, weights: false, vaccines: false };
    }
    return dataByMonth[key];
  };
  for (const key of Object.keys(hpgMonths ?? {})) seed(key).hpg = true;
  for (const key of Object.keys(treatmentMonths ?? {})) seed(key).treatment = true;
  for (const key of Object.keys(weightMonths ?? {})) seed(key).weights = true;
  for (const key of Object.keys(vaccineMonths ?? {})) seed(key).vaccines = true;

  const tabCounts: Record<string, number> = {
    hpg: counts.hpgMonths,
    treatment: counts.treatments,
    weights: counts.weightMonths,
    vaccines: counts.vaccineMonths,
  };

  if (!hydrated) {
    return <div className="py-10 text-center text-text-muted">{t.common.loading}</div>;
  }

  if (!lot) {
    return (
      <Card>
        <EmptyState
          title="Lote no encontrado"
          action={
            <Link href="/establishments">
              <Button>{t.common.back}</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const activeSegment = tabs.find((x) => pathname.endsWith(`/${x.segment}`));

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-text-muted mb-3 flex flex-wrap items-center gap-1.5">
        <Link href="/establishments" className="hover:text-text">
          {t.nav.establishments}
        </Link>
        <span>›</span>
        {est ? (
          <Link
            href={`/establishments/${est.id}`}
            className="hover:text-text"
          >
            {est.name}
          </Link>
        ) : null}
        <span>›</span>
        <span className="text-text">{lot.name}</span>
      </nav>

      {/* Title + actions */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{lot.name}</h1>
          <div className="text-sm text-text-muted mt-1">
            {t.lot.categories[lot.category]}
            {lot.headCount ? ` · ${lot.headCount} animales` : ""}
          </div>
        </div>
        <div className="flex items-end gap-2 w-full sm:w-auto">
          <MonthPicker
            value={month}
            onChange={setMonth}
            dataByMonth={dataByMonth}
          />
          <Link
            href={`/lots/${lotId}/report?m=${month}`}
            aria-label={t.report.download}
            className="h-11 w-11 mt-auto rounded-lg bg-surface-2 inline-flex items-center justify-center hover:bg-border shrink-0"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-5">
        <div className="flex gap-1 flex-wrap">
          {tabs.map((tab) => {
            const href = `/lots/${lotId}/${tab.segment}?m=${month}`;
            const active = activeSegment?.segment === tab.segment;
            const count = tabCounts[tab.segment] ?? 0;
            return (
              <Link
                key={tab.segment}
                href={href}
                className={`px-4 h-11 inline-flex items-center gap-1.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                {tab.label}
                {count > 0 ? (
                  <span
                    className={`text-xs px-1.5 min-w-[1.25rem] h-5 inline-flex items-center justify-center rounded-full tabular-nums ${
                      active
                        ? "bg-primary-soft text-primary-soft-text"
                        : "bg-surface-2 text-text-muted"
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      {children}
    </div>
  );
}
