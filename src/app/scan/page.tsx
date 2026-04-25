"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useProfile } from "@/hooks/useProfile";

interface Scan {
  id: string;
  tagId: string;
  scannedAt: number;
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

export default function ScanPage() {
  const { profile, loading } = useProfile();
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState("");
  const [scans, setScans] = useState<Scan[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-focus the input whenever we activate scan mode or just captured a scan.
  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active, scans.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted text-sm">
        Cargando…
      </div>
    );
  }

  if (profile?.plan !== "admin") {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted text-sm">
        Acceso restringido.
      </div>
    );
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const value = pending.trim();
    if (!value) return;
    const isDup = scans.some((s) => s.tagId === value);
    setScans((prev) => [
      {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : String(Date.now()),
        tagId: value,
        scannedAt: Date.now(),
      },
      ...prev,
    ]);
    setPending("");
    beep(isDup ? 440 : 880, isDup ? 140 : 70);
  };

  const clearScans = () => {
    if (scans.length > 0 && !confirm(`¿Borrar ${scans.length} caravanas?`)) return;
    setScans([]);
  };

  const exportCsv = () => {
    const lines = ["caravana,timestamp"];
    for (const s of [...scans].reverse()) {
      lines.push(`${s.tagId},${new Date(s.scannedAt).toISOString()}`);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `safebreeder-scans-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const dupCount = scans.length - new Set(scans.map((s) => s.tagId)).size;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black uppercase tracking-wide">
            Test de escaneo RFID
          </h1>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-700">
            Admin
          </span>
        </div>
        <p className="text-sm text-text-muted mt-0.5">
          Pareá tu bastón por Bluetooth en modo &quot;HID Keyboard&quot; y probá
          el flujo de carga continua.
        </p>
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
                  {active ? "Modo escáner activo" : "Modo escáner desactivado"}
                </div>
                <div className="text-xs text-text-muted">
                  {active
                    ? "Esperando próximo escaneo del bastón…"
                    : "Activá el modo y escaneá un chip."}
                </div>
              </div>
            </div>
            <Button
              variant={active ? "danger" : "primary"}
              onClick={() => setActive((a) => !a)}
            >
              {active ? "Detener" : "Activar modo escáner"}
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
                ? "Escaneá una caravana con el bastón…"
                : "Activá el modo escáner para empezar"
            }
            className="text-base"
          />

          <p className="text-[11px] text-text-muted">
            Tip: en mobile, el teclado on-screen no aparece — el bastón actúa
            como teclado Bluetooth. Si no escanea, asegurate de que esté
            pareado y en modo HID.
          </p>
        </CardBody>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Escaneados" value={scans.length} />
        <StatCard label="Únicos" value={new Set(scans.map((s) => s.tagId)).size} />
        <StatCard
          label="Duplicados"
          value={dupCount}
          tone={dupCount > 0 ? "warn" : "default"}
        />
      </div>

      {/* Scan list */}
      <Card>
        <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Caravanas leídas</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={exportCsv}
              disabled={scans.length === 0}
            >
              Exportar CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearScans}
              disabled={scans.length === 0}
            >
              Limpiar
            </Button>
          </div>
        </div>
        {scans.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-text-muted">
            Todavía no escaneaste nada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-surface-2/60">
                  <th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wide w-12">
                    #
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Caravana
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
                        seenBefore ? "bg-amber-50/60" : ""
                      }`}
                    >
                      <td className="px-4 py-2.5 text-sm tabular-nums text-text-muted">
                        {scans.length - i}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-mono">
                        {s.tagId}
                        {seenBefore ? (
                          <span className="ml-2 text-[10px] uppercase font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            duplicado
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

      {/* Help */}
      <details className="text-sm">
        <summary className="cursor-pointer text-text-muted hover:text-text font-medium">
          ¿Cómo configurar el bastón?
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
              Volvé acá, presioná <em>Activar modo escáner</em> y apuntá al
              chip.
            </li>
            <li>
              El bastón &quot;tipea&quot; el número y manda Enter. La caravana
              aparece arriba y suena un beep.
            </li>
          </ol>
          <p className="pt-1">
            Compatibles: Allflex SRS2, Tru-Test XRP2, Datamars APR350/250,
            Tipsa, y la mayoría de bastones ISO 11784/11785 vendidos hoy en
            Argentina.
          </p>
        </div>
      </details>
    </div>
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
          tone === "warn" && value > 0 ? "text-amber-700" : "text-text"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
