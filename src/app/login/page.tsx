"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

// localStorage key that marks "user chose session-only login"
export const NO_REMEMBER_KEY = "sb_no_remember";
// sessionStorage key that marks the current browser session is alive
const SESSION_ALIVE_KEY = "sb_session_alive";

/** Called by StoreBootstrap on mount to enforce session-only logins. */
export function enforceRememberMe(userId: string): boolean {
  const noRemember = localStorage.getItem(NO_REMEMBER_KEY);
  const sessionAlive = sessionStorage.getItem(SESSION_ALIVE_KEY);
  // If the user chose "no remember" and there's no alive marker → new browser session
  if (noRemember === userId && !sessionAlive) return true; // should sign out
  return false;
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/establishments";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const sb = supabaseBrowser();
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      const userId = data.user?.id ?? "";
      if (remember) {
        localStorage.removeItem(NO_REMEMBER_KEY);
        sessionStorage.removeItem(SESSION_ALIVE_KEY);
      } else {
        localStorage.setItem(NO_REMEMBER_KEY, userId);
        sessionStorage.setItem(SESSION_ALIVE_KEY, userId);
      }
      router.push(next);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Iniciar sesión"
      subtitle="Ingresá con tu email y contraseña."
      footer={
        <>
          ¿Todavía no tenés cuenta?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Crear cuenta
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" required>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </Field>
        <Field label="Contraseña" required>
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
            />
            <span className="text-sm text-text-muted">Recordarme</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-text-muted hover:text-text"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        {error ? (
          <div className="text-sm text-clay bg-clay/10 border border-clay/20 rounded-md px-3 py-2">
            {error}
          </div>
        ) : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Ingresando…" : "Ingresar"}
        </Button>
      </form>
    </AuthCard>
  );
}
