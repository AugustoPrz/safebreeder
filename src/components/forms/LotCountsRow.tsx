"use client";

import { useLotCounts } from "@/hooks/useDb";
import { t } from "@/lib/i18n";

export function LotCountsRow({ lotId }: { lotId: string }) {
  const counts = useLotCounts(lotId);
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
      <span>{t.lot.hpgMonths(counts.hpgMonths)}</span>
      <span>·</span>
      <span>{t.lot.weightMonths(counts.weightMonths)}</span>
      <span>·</span>
      <span>{t.lot.treatments(counts.treatments)}</span>
    </div>
  );
}
