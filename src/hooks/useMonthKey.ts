"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { monthKey } from "@/lib/calc";

export function useMonthKey(): [string, (k: string) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const now = new Date();
  const fromUrl = searchParams.get("m");
  const current = fromUrl && /^\d{4}-\d{2}$/.test(fromUrl)
    ? fromUrl
    : monthKey(now.getFullYear(), now.getMonth());

  const setKey = useCallback(
    (k: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("m", k);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, pathname],
  );

  return [current, setKey];
}
