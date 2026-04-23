"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { EstablishmentForm } from "@/components/forms/EstablishmentForm";
import { useEstablishments } from "@/hooks/useDb";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { Establishment } from "@/lib/types";

export default function EstablishmentsPage() {
  const establishments = useEstablishments();
  const lots = useStore((s) => s.db.lots);
  const deleteEst = useStore((s) => s.deleteEstablishment);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Establishment | null>(null);

  const lotCount = (eid: string) =>
    lots.filter((l) => l.establishmentId === eid).length;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {t.establishments.title}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {t.establishments.subtitle}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <PlusIcon />
          <span className="hidden sm:inline">{t.establishments.create}</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {establishments.length === 0 ? (
        <Card>
          <EmptyState
            title={t.establishments.empty}
            description="Creá tu primer establecimiento para empezar a cargar datos."
            action={
              <Button onClick={() => setShowCreate(true)}>
                {t.establishments.createFirst}
              </Button>
            }
            icon={<PlusIcon className="w-6 h-6" />}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {establishments.map((est) => {
            const count = lotCount(est.id);
            return (
              <Card key={est.id} className="flex flex-col">
                <CardBody className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link
                      href={`/establishments/${est.id}`}
                      className="font-semibold text-base hover:text-primary transition-colors"
                    >
                      {est.name}
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditing(est)}
                        className="text-text-muted hover:text-text text-sm p-1"
                        aria-label={t.common.edit}
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(t.common.confirmDelete)) deleteEst(est.id);
                        }}
                        className="text-text-muted hover:text-clay text-sm p-1"
                        aria-label={t.common.delete}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                  <dl className="text-xs text-text-muted space-y-0.5">
                    {est.owner ? (
                      <div className="flex gap-1.5">
                        <dt>{t.establishments.owner}:</dt>
                        <dd className="text-text">{est.owner}</dd>
                      </div>
                    ) : null}
                    {est.district ? (
                      <div className="flex gap-1.5">
                        <dt>{t.establishments.district}:</dt>
                        <dd className="text-text">{est.district}</dd>
                      </div>
                    ) : null}
                    {est.province ? (
                      <div className="flex gap-1.5">
                        <dt>{t.establishments.province}:</dt>
                        <dd className="text-text">{est.province}</dd>
                      </div>
                    ) : null}
                  </dl>
                </CardBody>
                <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-surface-2/50 rounded-b-xl">
                  <span className="text-xs font-medium text-primary-soft-text bg-primary-soft rounded-full px-2.5 py-0.5">
                    {t.establishments.lotsCount(count)}
                  </span>
                  <Link
                    href={`/establishments/${est.id}`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Ver lotes →
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t.establishments.create}
      >
        <EstablishmentForm
          onDone={() => setShowCreate(false)}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Editar establecimiento"
      >
        {editing ? (
          <EstablishmentForm
            establishment={editing}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function PencilIcon() {
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
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function PlusIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={className}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
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
  );
}
