"use client";

import { ScanFlow } from "@/components/scan/ScanFlow";
import { useHydrated } from "@/hooks/useHydrated";
import { t } from "@/lib/i18n";

export default function ScanPage() {
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted text-sm">
        {t.common.loading}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">{t.scan.title}</h1>
        <p className="text-sm text-text-muted mt-0.5">{t.scan.subtitle}</p>
      </div>
      <ScanFlow />
    </div>
  );
}
