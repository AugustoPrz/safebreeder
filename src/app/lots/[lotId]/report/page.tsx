"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { useStore } from "@/lib/store";
import { useMonthKey } from "@/hooks/useMonthKey";
import { useLot, useEstablishment } from "@/hooks/useDb";
import {
  averageHpg,
  formatInt,
  formatMonthKey,
  formatNumber,
  maxHpg,
  positiveRate,
  previousMonthKey,
  summarizeWeights,
} from "@/lib/calc";
import { generateLotReport } from "@/lib/pdf";
import { t } from "@/lib/i18n";

export default function ReportPage() {
  const { lotId } = useParams<{ lotId: string }>();
  const [month] = useMonthKey();
  const db = useStore((s) => s.db);
  const lot = useLot(lotId);
  const est = useEstablishment(lot?.establishmentId);
  const hpg = db.hpg[lotId]?.[month];
  const treatment = db.treatments[lotId]?.[month];
  const weights = db.weights[lotId]?.[month];
  const vaccines = db.vaccines[lotId]?.[month];
  const vaccineRows = (vaccines?.rows ?? []).filter(
    (r) => r.date || r.type || r.brand || r.dose,
  );
  const prevKey = previousMonthKey(month);
  const prevWeights = prevKey ? db.weights[lotId]?.[prevKey] : undefined;

  const download = () => {
    const doc = generateLotReport(db, lotId, month);
    const fileName = `safebreeder_${(lot?.name ?? "reporte").replace(/\s+/g, "_")}_${month}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-semibold text-base">{t.report.title}</h2>
            <p className="text-xs text-text-muted">
              {est?.name} · {lot?.name} · {formatMonthKey(month, t.months)}
            </p>
          </div>
          <Button onClick={download}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-4 h-4"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t.report.download}
          </Button>
        </div>
        <CardBody className="space-y-6 text-sm">
          <Section title={t.report.sectionTreatment}>
            {treatment && Object.values(treatment).some(Boolean) ? (
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                <Row label={t.treatment.date} value={treatment.date} />
                <Row label={t.treatment.drug} value={treatment.drug} />
                <Row label={t.treatment.brand} value={treatment.brand} />
                <Row label={t.treatment.route} value={treatment.route} />
                <Row label={t.treatment.dose} value={treatment.dose} />
                <Row label={t.treatment.weight} value={treatment.weight} />
                <Row label={t.treatment.criterion} value={treatment.criterion} />
                <Row label={t.treatment.bcs} value={treatment.bcs} />
                <Row
                  label={t.treatment.ectoparasites}
                  value={t.treatment.ectoLevels[treatment.ectoparasites]}
                />
                <Row label={t.treatment.ectoType} value={treatment.ectoType} />
                <Row
                  label={t.treatment.diarrhea}
                  value={t.treatment.diarrheaLevels[treatment.diarrhea]}
                />
                <Row label={t.common.observations} value={treatment.notes} />
              </dl>
            ) : (
              <EmptyNote />
            )}
          </Section>

          <Section title={t.report.sectionVaccines}>
            {vaccineRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-text-muted">
                    <tr className="border-b border-border">
                      <th className="text-left font-medium py-1.5 pr-3">
                        {t.vaccines.date}
                      </th>
                      <th className="text-left font-medium py-1.5 pr-3">
                        {t.vaccines.type}
                      </th>
                      <th className="text-left font-medium py-1.5 pr-3">
                        {t.vaccines.brand}
                      </th>
                      <th className="text-left font-medium py-1.5">
                        {t.vaccines.dose}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaccineRows.map((r, i) => (
                      <tr
                        key={i}
                        className="border-b border-border/60 last:border-b-0"
                      >
                        <td className="py-1.5 pr-3">{r.date || "—"}</td>
                        <td className="py-1.5 pr-3">
                          {r.type !== "" ? t.vaccines.types[r.type] : "—"}
                        </td>
                        <td className="py-1.5 pr-3">{r.brand || "—"}</td>
                        <td className="py-1.5">{r.dose || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyNote />
            )}
          </Section>

          <Section title={t.report.sectionHpg}>
            {hpg && hpg.rows.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                  <span>
                    {t.hpg.sampleCount}: <b className="text-text">{formatInt(hpg.rows.length)}</b>
                  </span>
                  <span>
                    {t.hpg.average}: <b className="text-text">{formatNumber(averageHpg(hpg.rows), 0)}</b>
                  </span>
                  <span>
                    {t.hpg.max}: <b className="text-text">{formatInt(maxHpg(hpg.rows))}</b>
                  </span>
                  <span>
                    {t.hpg.positives}:{" "}
                    <b className="text-text">
                      {positiveRate(hpg.rows) === null
                        ? "—"
                        : `${formatNumber(positiveRate(hpg.rows), 0)}%`}
                    </b>
                  </span>
                </div>
                {hpg.notes ? (
                  <p className="text-xs text-text-muted mt-3">
                    <b className="text-text">{t.common.observations}:</b>{" "}
                    {hpg.notes}
                  </p>
                ) : null}
              </>
            ) : (
              <EmptyNote />
            )}
          </Section>

          <Section title={t.report.sectionWeights}>
            {weights && weights.rows.length > 0 ? (
              (() => {
                const s = summarizeWeights(
                  weights.rows,
                  prevWeights?.rows ?? [],
                );
                return (
                  <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                    <span>
                      {t.weights.animals}:{" "}
                      <b className="text-text">{formatInt(s.count)}</b>
                    </span>
                    <span>
                      {t.weights.avgWeight}:{" "}
                      <b className="text-text">
                        {formatNumber(s.avgWeight, 1)} kg
                      </b>
                    </span>
                    <span>
                      {t.weights.avgAdg}:{" "}
                      <b className="text-text">
                        {formatNumber(s.avgAdg, 2)} kg/día
                      </b>
                    </span>
                  </div>
                );
              })()
            ) : (
              <EmptyNote />
            )}
          </Section>
        </CardBody>
      </Card>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="font-semibold text-primary text-sm uppercase tracking-wider mb-3 border-b border-border pb-1.5">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-2 border-b border-border/60 py-1.5">
      <dt className="text-text-muted text-xs">{label}</dt>
      <dd className="text-right text-xs">{value}</dd>
    </div>
  );
}

function EmptyNote() {
  return (
    <p className="text-xs italic text-text-muted">{t.report.emptyPeriod}</p>
  );
}
