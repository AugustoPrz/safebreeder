"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { EstablishmentForm } from "@/components/forms/EstablishmentForm";
import { LotForm } from "@/components/forms/LotForm";
import { useEstablishments, useLotsByEstablishment } from "@/hooks/useDb";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { StockAnimal } from "@/lib/types";

interface Scan {
  id: string;
  tagId: string;
  scannedAt: number;
}

type Step = "est" | "newEst" | "lote" | "newLote" | "scan" | "confirm" | "done";

const emptyAnimal: StockAnimal = {
  caravana: "",
  origen: "",
  sexo: "",
  peso: "",
  tamano: "",
  raza: "",
  observaciones: "",
};

/** A stock row that carries no data and isn't flagged — a bare placeholder. */
function isMeaningfulRow(r: StockAnimal): boolean {
  return (
    r.caravana.trim() !== "" ||
    r.origen.trim() !== "" ||
    r.sexo !== "" ||
    r.peso.trim() !== "" ||
    r.tamano !== "" ||
    r.raza !== "" ||
    r.observaciones.trim() !== "" ||
    !!r.muerto ||
    !!r.vendido
  );
}

// Quick beep via Web Audio so the user gets feedback on scan, even when on
// silent or with the device flipped over in their pocket.
let audioCtx: AudioContext | null = null;
function beep(freq = 880, ms = 70) {
  if (typeof window === "undefined") return;
  try {
    audioCtx ??= new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + ms / 1000 + 0.02);
  } catch {
    /* ignore */
  }
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2);
}

interface Props {
  /** Called after navigating to the lot's Stock, so a host modal can close. */
  onClose?: () => void;
  /** When rendered inside the Modal, the sticky footer goes edge-to-edge. */
  inModal?: boolean;
}

export function ScanFlow({ onClose, inModal = false }: Props) {
  const router = useRouter();
  const establishments = useEstablishments();
  const setStock = useStore((s) => s.setStock);
  const stockByLot = useStore((s) => s.db.stock);

  const [step, setStep] = useState<Step>("est");
  const [estId, setEstId] = useState("");
  const [lotId, setLotId] = useState("");
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState("");
  const [scans, setScans] = useState<Scan[]>([]);
  const [addedCount, setAddedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const lots = useLotsByEstablishment(estId);
  const est = establishments.find((e) => e.id === estId);
  const lot = lots.find((l) => l.id === lotId);

  // Re-focus the input whenever we enter scan mode or just captured a scan.
  useEffect(() => {
    if (step === "scan" && active) inputRef.current?.focus();
  }, [step, active, scans.length]);

  // ── derived: dedup against the chosen lot's existing stock ───────────────
  const uniqueScanned = Array.from(
    new Set(scans.map((s) => s.tagId.trim()).filter(Boolean)),
  );
  const existingRows = lotId ? stockByLot[lotId]?.rows ?? [] : [];
  const existingTags = new Set(
    existingRows.map((r) => r.caravana.trim()).filter(Boolean),
  );
  const nuevas = uniqueScanned.filter((tag) => !existingTags.has(tag));
  const yaExisten = uniqueScanned.filter((tag) => existingTags.has(tag));

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const value = pending.trim();
    if (!value) return;
    const isDup = scans.some((s) => s.tagId === value);
    setScans((prev) => [
      { id: newId(), tagId: value, scannedAt: Date.now() },
      ...prev,
    ]);
    setPending("");
    beep(isDup ? 440 : 880, isDup ? 140 : 70);
  };

  const clearScans = () => {
    if (scans.length > 0 && !confirm(t.scan.confirmClear(scans.length))) return;
    setScans([]);
  };

  const confirmLoad = () => {
    if (!lotId || nuevas.length === 0) return;
    const newAnimals: StockAnimal[] = nuevas.map((caravana) => ({
      ...emptyAnimal,
      caravana,
    }));
    const existingClean = existingRows.filter(isMeaningfulRow);
    setStock(lotId, { rows: [...existingClean, ...newAnimals] });
    setAddedCount(newAnimals.length);
    setStep("done");
  };

  const resetAll = () => {
    setScans([]);
    setActive(false);
    setPending("");
    setEstId("");
    setLotId("");
    setStep("est");
  };

  const goToStock = () => {
    router.push(`/lots/${lotId}/stock`);
    onClose?.();
  };

  const dupCount = scans.length - new Set(scans.map((s) => s.tagId)).size;

  // ── render ────────────────────────────────────────────────────────────────
  if (step === "newEst") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep("est")}
            className="text-text-muted hover:text-text inline-flex items-center gap-1 text-sm"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {t.scan.stepEstablishmentTitle}
          </button>
        </div>
        <h2 className="font-semibold">{t.scan.newEstablishmentTitle}</h2>
        <EstablishmentForm
          onCancel={() => setStep("est")}
          onDone={(created) => {
            if (created) {
              setEstId(created.id);
              setLotId("");
              setStep("lote");
            } else {
              setStep("est");
            }
          }}
        />
      </div>
    );
  }

  if (step === "est") {
    return (
      <div className="space-y-3">
        <h2 className="font-semibold">{t.scan.stepEstablishmentTitle}</h2>
        {establishments.length === 0 ? (
          <p className="text-sm text-text-muted">{t.scan.noEstablishments}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {establishments.map((e) => {
              const place = [e.district, e.province].filter(Boolean).join(", ");
              return (
                <PickCard
                  key={e.id}
                  title={e.name}
                  subtitle={place || undefined}
                  onClick={() => {
                    setEstId(e.id);
                    setLotId("");
                    setStep("lote");
                  }}
                />
              );
            })}
          </div>
        )}
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => setStep("newEst")}
        >
          + {t.scan.newEstablishment}
        </Button>
      </div>
    );
  }

  if (step === "lote") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep("est")}
            className="text-text-muted hover:text-text inline-flex items-center gap-1 text-sm"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {est?.name}
          </button>
        </div>
        <h2 className="font-semibold">{t.scan.stepLotTitle}</h2>
        {lots.length === 0 ? (
          <p className="text-sm text-text-muted">{t.scan.noLots}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {lots.map((l) => {
              const meta = [
                t.lot.categories[l.category],
                l.headCount ? t.scan.lotAnimals(l.headCount) : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <PickCard
                  key={l.id}
                  title={l.name}
                  subtitle={meta || undefined}
                  onClick={() => {
                    setLotId(l.id);
                    setStep("scan");
                  }}
                />
              );
            })}
          </div>
        )}
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => setStep("newLote")}
        >
          + {t.scan.newLot}
        </Button>
      </div>
    );
  }

  if (step === "newLote") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep("lote")}
            className="text-text-muted hover:text-text inline-flex items-center gap-1 text-sm"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {est?.name}
          </button>
        </div>
        <h2 className="font-semibold">{t.scan.newLotTitle}</h2>
        <LotForm
          establishmentId={estId}
          onCancel={() => setStep("lote")}
          onDone={(created) => {
            if (created) {
              setLotId(created.id);
              setStep("scan");
            } else {
              setStep("lote");
            }
          }}
        />
      </div>
    );
  }

  if (step === "scan") {
    return (
      <div className="space-y-5">
        {/* Breadcrumb of selected place */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm">
            <span className="text-text-muted">{est?.name}</span>
            <span className="text-text-muted mx-1.5">›</span>
            <span className="font-semibold">{lot?.name}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setStep("est")}>
            {t.scan.change}
          </Button>
        </div>

        {/* Scanner control */}
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span
                  className={`relative inline-flex h-3 w-3 rounded-full ${
                    active ? "bg-primary" : "bg-text-muted/30"
                  }`}
                >
                  {active ? (
                    <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" />
                  ) : null}
                </span>
                <div>
                  <div className="text-sm font-semibold">
                    {active ? t.scan.scannerActive : t.scan.scannerInactive}
                  </div>
                  <div className="text-xs text-text-muted">
                    {active
                      ? t.scan.scannerActiveHint
                      : t.scan.scannerInactiveHint}
                  </div>
                </div>
              </div>
              <Button
                variant={active ? "danger" : "primary"}
                onClick={() => setActive((a) => !a)}
              >
                {active ? t.scan.stop : t.scan.activate}
              </Button>
            </div>

            <Input
              ref={inputRef}
              value={pending}
              onChange={(e) => setPending(e.target.value)}
              onKeyDown={handleKey}
              inputMode={active ? "none" : "text"}
              disabled={!active}
              placeholder={
                active
                  ? t.scan.inputPlaceholderActive
                  : t.scan.inputPlaceholderInactive
              }
              className="text-base"
            />

            <p className="text-[11px] text-text-muted">{t.scan.mobileTip}</p>
          </CardBody>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label={t.scan.statScanned} value={scans.length} />
          <StatCard
            label={t.scan.statUnique}
            value={new Set(scans.map((s) => s.tagId)).size}
          />
          <StatCard
            label={t.scan.statDuplicates}
            value={dupCount}
            tone={dupCount > 0 ? "warn" : "default"}
          />
        </div>

        {/* Scan list */}
        <Card>
          <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">{t.scan.readTags}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearScans}
              disabled={scans.length === 0}
            >
              {t.scan.clear}
            </Button>
          </div>
          {scans.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-text-muted">
              {t.scan.emptyList}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[40vh]">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-surface-2 z-10">
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wide w-12">
                      #
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wide">
                      {t.stock.caravana}
                    </th>
                    <th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wide">
                      Hora
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((s, i) => {
                    const seenBefore =
                      scans.findIndex((x) => x.tagId === s.tagId) !== i;
                    return (
                      <tr
                        key={s.id}
                        className={`border-b border-border last:border-b-0 ${
                          seenBefore ? "bg-sun-soft/40" : ""
                        }`}
                      >
                        <td className="px-4 py-2.5 text-sm tabular-nums text-text-muted">
                          {scans.length - i}
                        </td>
                        <td className="px-4 py-2.5 text-sm font-mono">
                          {s.tagId}
                          {seenBefore ? (
                            <span className="ml-2 text-[10px] uppercase font-semibold text-sun-soft-text bg-sun-soft px-1.5 py-0.5 rounded">
                              {t.scan.duplicate}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-text-muted tabular-nums">
                          {new Date(s.scannedAt).toLocaleTimeString("es-AR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <ScannerHelp />

        {/* Sticky full-width action bar pinned to the bottom of the modal */}
        <div
          className={`sticky bottom-0 z-10 -mb-5 py-3 bg-surface border-t border-border ${
            inModal ? "-mx-5 px-5" : ""
          }`}
        >
          <Button
            className="w-full"
            size="lg"
            onClick={() => setStep("confirm")}
            disabled={scans.length === 0}
          >
            {t.scan.finalize}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">{t.scan.confirmTitle}</h2>
          <p className="text-xs text-text-muted">
            {est?.name} › {lot?.name}
          </p>
        </div>

        {nuevas.length === 0 ? (
          <p className="text-sm text-text-muted">{t.scan.nothingNew}</p>
        ) : (
          <p className="text-sm">
            {t.scan.confirmSummary(nuevas.length, lot?.name ?? "", est?.name ?? "")}
          </p>
        )}
        {yaExisten.length > 0 ? (
          <p className="text-xs text-text-muted">
            {t.scan.alreadyExist(yaExisten.length)}
          </p>
        ) : null}

        {nuevas.length > 0 ? (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-text-muted font-medium mb-1.5">
              {t.scan.newTags}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {nuevas.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-xs px-2 py-1 rounded bg-primary-soft text-primary-soft-text"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {yaExisten.length > 0 ? (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-text-muted font-medium mb-1.5">
              {t.scan.skippedTags}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {yaExisten.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-xs px-2 py-1 rounded bg-surface-2 text-text-muted line-through"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => setStep("scan")}>
            {t.scan.backToScan}
          </Button>
          <Button onClick={confirmLoad} disabled={nuevas.length === 0}>
            {t.scan.confirmLoad}
          </Button>
        </div>
      </div>
    );
  }

  // step === "done"
  return (
    <div className="py-6 flex flex-col items-center text-center gap-4">
      <div className="h-14 w-14 rounded-full bg-primary-soft text-primary-soft-text inline-flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-7 h-7"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <div>
        <div className="font-semibold">{t.scan.doneTitle(addedCount)}</div>
        <div className="text-sm text-text-muted mt-0.5">
          {est?.name} › {lot?.name}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        <Button variant="secondary" onClick={resetAll}>
          {t.scan.scanAnother}
        </Button>
        <Button onClick={goToStock}>{t.scan.viewStock}</Button>
      </div>
    </div>
  );
}

function PickCard({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3 hover:border-primary hover:bg-surface-2/40 transition-colors"
    >
      <span className="min-w-0">
        <span className="block font-medium truncate">{title}</span>
        {subtitle ? (
          <span className="block text-xs text-text-muted truncate">
            {subtitle}
          </span>
        ) : null}
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
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

function ScannerHelp() {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-text-muted hover:text-text font-medium">
        {t.scan.helpSummary}
      </summary>
      <div className="mt-3 px-4 py-3 bg-surface-2 rounded-lg space-y-2 text-text-muted">
        <ol className="list-decimal list-inside space-y-1.5">
          <li>
            En el bastón, activá el modo{" "}
            <strong className="text-text">HID Keyboard</strong> /{" "}
            <strong className="text-text">Bluetooth Keyboard</strong>.
          </li>
          <li>
            En tu teléfono o laptop, andá a Ajustes → Bluetooth y pareá el
            bastón. Aparece como un teclado.
          </li>
          <li>
            Volvé acá, presioná <em>Activar modo escáner</em> y apuntá al chip.
          </li>
          <li>
            El bastón &quot;tipea&quot; el número y manda Enter. La caravana
            aparece arriba y suena un beep.
          </li>
        </ol>
        <p className="pt-1">
          Compatibles: Allflex SRS2, Tru-Test XRP2, Datamars APR350/250, Tipsa,
          y la mayoría de bastones ISO 11784/11785 vendidos hoy en Argentina.
        </p>
      </div>
    </details>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warn";
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
        {label}
      </div>
      <div
        className={`text-2xl font-black tabular-nums mt-0.5 ${
          tone === "warn" && value > 0 ? "text-sun-soft-text" : "text-text"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
