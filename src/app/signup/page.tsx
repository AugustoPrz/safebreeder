"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

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
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/onboarding`
              : undefined,
        },
      });
      if (error) {
        setError(error.message);
        return;
      }
      if (!data.session) {
        setNeedsConfirmation(true);
        return;
      }
      router.push("/onboarding");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  if (needsConfirmation) {
    return (
      <AuthCard
        title="Revisá tu email"
        subtitle={`Te enviamos un link de confirmación a ${email}. Abrilo para activar tu cuenta.`}
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
      title="Crear cuenta"
      subtitle="Empezá gratis en 14 días, sin tarjeta."
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Iniciar sesión
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
        <Field label="Contraseña" required hint="Mínimo 8 caracteres.">
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
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
          {submitting ? "Creando…" : "Crear cuenta"}
        </Button>
      </form>
    </AuthCard>
  );
}
