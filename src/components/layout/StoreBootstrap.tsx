"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { readLegacyDb } from "@/lib/migrate";
import { buildDemoDb } from "@/lib/demo";
import { useHydrated } from "@/hooks/useHydrated";

export function StoreBootstrap() {
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;
    const state = useStore.getState();
    if (state.migrationSource) return;
    const isEmpty =
      state.db.establishments.length === 0 && state.db.lots.length === 0;
    if (!isEmpty) {
      useStore.setState({ migrationSource: "empty" });
      return;
    }
    const legacy = readLegacyDb();
    if (legacy) {
      useStore.setState({ db: legacy, migrationSource: "legacy" });
    } else {
      useStore.setState({ db: buildDemoDb(), migrationSource: "demo" });
    }
  }, [hydrated]);

  return null;
}
