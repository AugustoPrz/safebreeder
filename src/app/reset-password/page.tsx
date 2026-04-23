"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSubmitting(true);
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/establishments");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Nueva contraseña"
      subtitle="Elegí una contraseña segura para tu cuenta."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nueva contraseña" required>
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoFocus
          />
        </Field>
        <Field label="Confirmar contraseña" required>
          <Input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
        </Field>
        {error ? (
          <div className="text-sm text-clay bg-clay/10 border border-clay/20 rounded-md px-3 py-2">
            {error}
          </div>
        ) : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </AuthCard>
  );
}
