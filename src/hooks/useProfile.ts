"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { ProfileRow } from "@/lib/supabase/types";

interface UseProfileResult {
  profile: ProfileRow | null;
  loading: boolean;
  error: string | null;
  update: (patch: Partial<Omit<ProfileRow, "id">>) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const { data: sess } = await sb.auth.getUser();
    if (!sess.user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("id", sess.user.id)
      .maybeSingle();
    if (error) setError(error.message);
    setProfile(data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const sb = supabaseBrowser();
    const { data: sub } = sb.auth.onAuthStateChange(() => {
      void load();
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [load]);

  const update = useCallback(
    async (patch: Partial<Omit<ProfileRow, "id">>) => {
      const sb = supabaseBrowser();
      const { data: sess } = await sb.auth.getUser();
      if (!sess.user) throw new Error("No session");
      const { data, error } = await sb
        .from("profiles")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", sess.user.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
    },
    [],
  );

  return { profile, loading, error, update, refresh: load };
}
