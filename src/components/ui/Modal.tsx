"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { t } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-surface w-full sm:max-w-lg sm:w-[90vw] rounded-t-2xl sm:rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] border border-border max-h-[95vh] flex flex-col">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text text-xl leading-none"
            aria-label={t.common.close}
          >
            ×
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer ? (
          <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
