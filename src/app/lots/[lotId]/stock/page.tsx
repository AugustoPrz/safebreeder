"use client";

import { useParams } from "next/navigation";
import { StockForm } from "@/components/forms/StockForm";
import { StockSummary } from "@/components/forms/StockSummary";
import { useStore } from "@/lib/store";
import { useLot } from "@/hooks/useDb";
import type { StockAnimal } from "@/lib/types";

export default function StockPage() {
  const { lotId } = useParams<{ lotId: string }>();
  const lot = useLot(lotId);
  const record = useStore((s) => s.db.stock[lotId]);

  // Mirror StockForm's seed logic so the summary reflects what the user sees
  // on first visit, before the seed has been persisted.
  const seedCount =
    !record && lot?.headCount && lot.headCount > 0 ? lot.headCount : 0;
  const rows: StockAnimal[] =
    record?.rows ??
    Array.from({ length: seedCount }, () => ({
      caravana: "",
      origen: "",
      sexo: "" as const,
      peso: "",
      tamano: "" as const,
      raza: "" as const,
      observaciones: "",
    }));

  return (
    <div className="space-y-4">
      <StockSummary rows={rows} />
      <StockForm lotId={lotId} />
    </div>
  );
}
