"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useStore } from "@/lib/store";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { fetchAllForUser } from "@/lib/supabase/data";

/**
 * Hydrates the local zustand cache from Supabase once a session exists,
 * and tracks auth state changes (sign-out clears the store + redirects home).
 */
export function StoreBootstrap() {
  const router = useRouter();

  useEffect(() => {
    const sb = supabaseBrowser();
    let cancelled = false;

    const hydrate = async (userId: string | null) => {
      if (!userId) {
        useStore.getState().resetStore();
        return;
      }
      useStore.getState().setUserId(userId);
      try {
        const db = await fetchAllForUser(userId);
        if (cancelled) return;
        useStore.setState({ db, hydrated: true });
      } catch (e) {
        console.error("[session-hydrate]", e);
        useStore.setState({ hydrated: true });
      }
    };

    (async () => {
      const { data } = await sb.auth.getUser();
      void hydrate(data.user?.id ?? null);
    })();

    const { data: sub } = sb.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_OUT") {
        useStore.getState().resetStore();
        router.replace("/");
        return;
      }
      void hydrate(session?.user?.id ?? null);
    },
    );

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
