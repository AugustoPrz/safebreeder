"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import type { Lot, Establishment } from "@/lib/types";

export function useEstablishments(): Establishment[] {
  return useStore((s) => s.db.establishments);
}

export function useEstablishment(id: string | undefined): Establishment | undefined {
  return useStore((s) =>
    id ? s.db.establishments.find((e) => e.id === id) : undefined,
  );
}

export function useLots(): Lot[] {
  return useStore((s) => s.db.lots);
}

export function useLot(id: string | undefined): Lot | undefined {
  return useStore((s) => (id ? s.db.lots.find((l) => l.id === id) : undefined));
}

export function useLotsByEstablishment(establishmentId: string | undefined): Lot[] {
  const lots = useStore((s) => s.db.lots);
  return useMemo(
    () =>
      establishmentId
        ? lots.filter((l) => l.establishmentId === establishmentId)
        : [],
    [lots, establishmentId],
  );
}

export function useLotCounts(lotId: string) {
  const hpg = useStore((s) => s.db.hpg[lotId]);
  const treatments = useStore((s) => s.db.treatments[lotId]);
  const weights = useStore((s) => s.db.weights[lotId]);
  const vaccines = useStore((s) => s.db.vaccines[lotId]);
  return {
    hpgMonths: hpg ? Object.keys(hpg).length : 0,
    treatments: treatments ? Object.keys(treatments).length : 0,
    weightMonths: weights ? Object.keys(weights).length : 0,
    vaccineMonths: vaccines ? Object.keys(vaccines).length : 0,
  };
}
