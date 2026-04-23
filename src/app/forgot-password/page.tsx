"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/reset-password`
            : undefined,
      });
      if (error) {
        setError(error.message);
        return;
      }
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthCard
        title="Revisá tu email"
        subtitle={`Te enviamos un link a ${email} para restablecer tu contraseña.`}
      >
        <Link
          href="/login"
          className="text-sm text-primary font-medium hover:underline"
        >
          Volver a iniciar sesión →
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Recuperar contraseña"
      subtitle="Te mandamos un link por email para crear una nueva."
      footer={
        <Link href="/login" className="text-primary font-medium hover:underline">
          Volver
        </Link>
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
        {error ? (
          <div className="text-sm text-clay bg-clay/10 border border-clay/20 rounded-md px-3 py-2">
            {error}
          </div>
        ) : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Enviando…" : "Enviar link"}
        </Button>
      </form>
    </AuthCard>
  );
}
