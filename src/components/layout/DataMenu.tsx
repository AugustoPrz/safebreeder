"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export function DataMenu() {
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const exportJson = useStore((s) => s.exportJson);
  const importJson = useStore((s) => s.importJson);

  const doExport = () => {
    const blob = exportJson();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `safebreeder_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFlash(t.export.exportSuccess);
    setTimeout(() => setFlash(null), 2000);
    setOpen(false);
  };

  const doImport = async (file: File) => {
    const text = await file.text();
    const result = importJson(text);
    setFlash(result.ok ? t.export.importSuccess : t.export.importError);
    setTimeout(() => setFlash(null), 2000);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-surface-2 text-text-muted"
        aria-label="Menú de datos"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="w-5 h-5"
        >
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {open ? (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-12 z-40 w-56 bg-surface border border-border rounded-xl shadow-md overflow-hidden">
            <button
              type="button"
              onClick={doExport}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-2"
            >
              {t.export.exportJson}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-2"
            >
              {t.export.importJson}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) doImport(f);
                e.target.value = "";
              }}
            />
          </div>
        </>
      ) : null}
      {flash ? (
        <div className="absolute right-0 top-14 z-40 bg-primary text-white text-xs px-3 py-1.5 rounded-md shadow-md whitespace-nowrap">
          {flash}
        </div>
      ) : null}
    </div>
  );
}
