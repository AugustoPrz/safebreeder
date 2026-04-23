"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { useProfile } from "@/hooks/useProfile";
import type { UserRole } from "@/lib/types";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "productor", label: "Productor" },
  { value: "veterinario", label: "Veterinario" },
  { value: "asesor", label: "Asesor" },
  { value: "administrador", label: "Administrador" },
  { value: "otro", label: "Otro" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, loading, update } = useProfile();
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setRole(profile.role ?? "");
    }
  }, [profile]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setSubmitting(true);
    try {
      await update({
        name: name.trim(),
        role: role || null,
      });
      router.push("/establishments");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthCard title="Cargando…">
        <div className="text-sm text-text-muted">Un segundo.</div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Completá tu perfil"
      subtitle="Con esto terminamos de configurar tu cuenta."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nombre" required>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field label="Rol" hint="Opcional — nos ayuda a adaptar la app.">
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole | "")}
          >
            <option value="">—</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
        {error ? (
          <div className="text-sm text-clay bg-clay/10 border border-clay/20 rounded-md px-3 py-2">
            {error}
          </div>
        ) : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Guardando…" : "Continuar"}
        </Button>
      </form>
    </AuthCard>
  );
}
