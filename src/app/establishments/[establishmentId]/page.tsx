"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { LotForm } from "@/components/forms/LotForm";
import { LotCountsRow } from "@/components/forms/LotCountsRow";
import { useEstablishment, useLotsByEstablishment } from "@/hooks/useDb";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export default function EstablishmentDetailPage() {
  const params = useParams<{ establishmentId: string }>();
  const establishmentId = params.establishmentId;
  const est = useEstablishment(establishmentId);
  const lots = useLotsByEstablishment(establishmentId);
  const deleteLot = useStore((s) => s.deleteLot);
  const hpgByLot = useStore((s) => s.db.hpg);
  const weightsByLot = useStore((s) => s.db.weights);
  const treatmentsByLot = useStore((s) => s.db.treatments);
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  const latestMonth = (lotId: string): string | null => {
    const keys = new Set<string>();
    for (const k of Object.keys(hpgByLot[lotId] ?? {})) keys.add(k);
    for (const k of Object.keys(weightsByLot[lotId] ?? {})) keys.add(k);
    for (const k of Object.keys(treatmentsByLot[lotId] ?? {})) keys.add(k);
    if (keys.size === 0) return null;
    return Array.from(keys).sort().pop() ?? null;
  };

  if (!est) {
    return (
      <Card>
        <EmptyState
          title="Establecimiento no encontrado"
          action={
            <Button onClick={() => router.push("/establishments")}>
              {t.common.back}
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/establishments"
          className="text-sm text-text-muted hover:text-text inline-flex items-center gap-1.5 mb-3"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t.nav.establishments}
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{est.name}</h1>
            <div className="text-sm text-text-muted mt-1 flex flex-wrap gap-x-4">
              {est.owner ? <span>{est.owner}</span> : null}
              {est.district ? <span>· {est.district}</span> : null}
              {est.province ? <span>· {est.province}</span> : null}
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="w-4 h-4"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="hidden sm:inline">{t.lot.create}</span>
            <span className="sm:hidden">Lote</span>
          </Button>
        </div>
      </div>

      {lots.length === 0 ? (
        <Card>
          <EmptyState
            title={t.lot.empty}
            action={
              <Button onClick={() => setShowCreate(true)}>{t.lot.create}</Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lots.map((lot) => (
            <Card key={lot.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <Link
                      href={(() => {
                        const last = latestMonth(lot.id);
                        return last
                          ? `/lots/${lot.id}/hpg?m=${last}`
                          : `/lots/${lot.id}/hpg`;
                      })()}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {lot.name}
                    </Link>
                    <div className="text-xs text-text-muted mt-0.5">
                      {t.lot.categories[lot.category]}
                      {lot.headCount ? ` · ${lot.headCount} animales` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(t.common.confirmDelete)) deleteLot(lot.id);
                    }}
                    className="text-text-muted hover:text-clay"
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
                </div>
                <LotCountsRow lotId={lot.id} />
                <div className="flex gap-2 mt-3">
                  <Link
                    href={`/lots/${lot.id}/hpg`}
                    className="flex-1 text-center h-10 rounded-lg bg-primary text-white text-sm font-medium inline-flex items-center justify-center hover:bg-primary-hover transition-colors"
                  >
                    {t.lot.openData}
                  </Link>
                  <Link
                    href={`/lots/${lot.id}/report`}
                    aria-label={t.report.download}
                    className="h-10 w-10 rounded-lg bg-surface-2 inline-flex items-center justify-center hover:bg-border shrink-0"
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
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t.lot.create}
      >
        <LotForm
          establishmentId={est.id}
          onDone={() => setShowCreate(false)}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}
