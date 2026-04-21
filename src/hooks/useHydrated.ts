"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export function useHydrated(): boolean {
  const [local, setLocal] = useState(false);
  const fromStore = useStore((s) => s.hydrated);

  useEffect(() => {
    // The persist middleware may rehydrate synchronously on first render in
    // some versions; we still wait a tick to confirm we're client-side.
    setLocal(true);
  }, []);

  return local && fromStore;
}
