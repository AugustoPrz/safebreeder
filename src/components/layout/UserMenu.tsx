"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { ProfileRow } from "@/lib/supabase/types";
import type { UserRole } from "@/lib/types";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "veterinario", label: "Veterinario" },
  { value: "productor", label: "Productor" },
  { value: "asesor", label: "Asesor" },
  { value: "administrador", label: "Administrador" },
  { value: "otro", label: "Otro" },
];

export function UserMenu({ compact = false }: { compact?: boolean } = {}) {
  const router = useRouter();
  const { profile, update } = useProfile();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const handleLogout = async () => {
    const sb = supabaseBrowser();
    await sb.auth.signOut();
    setOpen(false);
    router.replace("/login");
    router.refresh();
  };

  const initial = profile?.name?.trim().charAt(0).toUpperCase() || "?";

  return (
    <div ref={rootRef} className={compact ? "relative" : "relative w-full"}>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={profile?.name ?? "Perfil"}
          className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm"
        >
          {initial}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-surface-2 transition-colors text-left"
        >
          <span className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm shrink-0">
            {initial}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-medium text-text truncate">
              {profile?.name || "Mi cuenta"}
            </span>
            <span className="block text-[11px] text-text-muted truncate">
              {profile?.email || ""}
            </span>
          </span>
        </button>
      )}

      {open ? (
        <div
          className={
            compact
              ? "absolute top-full right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-lg p-3 z-50"
              : "absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border rounded-xl shadow-lg p-3 z-50"
          }
        >
          {editing && profile ? (
            <ProfileForm
              initial={profile}
              onSave={async (patch) => {
                await update(patch);
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          ) : profile ? (
            <ProfileView
              profile={profile}
              onEdit={() => setEditing(true)}
              onLogout={handleLogout}
            />
          ) : (
            <div className="text-sm text-text-muted">Cargando perfil…</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ProfileView({
  profile,
  onEdit,
  onLogout,
}: {
  profile: ProfileRow;
  onEdit: () => void;
  onLogout: () => void;
}) {
  const roleLabel = ROLES.find((r) => r.value === profile.role)?.label;
  const planLabel = profile.plan
    ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)
    : null;
  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-semibold text-text">
          {profile.name ?? "Sin nombre"}
        </div>
        <div className="text-xs text-text-muted">{profile.email}</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {roleLabel ? (
            <span className="inline-flex text-[11px] px-2 py-0.5 rounded-full bg-primary-soft text-primary-soft-text font-medium">
              {roleLabel}
            </span>
          ) : null}
          {planLabel ? (
            <span className="inline-flex text-[11px] px-2 py-0.5 rounded-full bg-surface-2 text-text-muted font-medium">
              Plan {planLabel}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 h-9 text-xs font-medium rounded-md bg-surface-2 hover:bg-border"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex-1 h-9 text-xs font-medium rounded-md border border-border text-text-muted hover:text-text hover:bg-surface-2"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function ProfileForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: ProfileRow;
  onSave: (patch: Partial<Omit<ProfileRow, "id">>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [role, setRole] = useState<UserRole | "">(initial.role ?? "");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        role: role || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const input =
    "w-full rounded-md border border-border bg-surface px-2.5 h-9 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none";

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <label className="block">
        <span className="block text-[11px] font-medium text-text-muted mb-1">
          Nombre
        </span>
        <input
          autoFocus
          className={input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          required
        />
      </label>
      <label className="block">
        <span className="block text-[11px] font-medium text-text-muted mb-1">
          Email
        </span>
        <input
          type="email"
          className={`${input} opacity-60 cursor-not-allowed`}
          value={initial.email ?? ""}
          readOnly
        />
      </label>
      <label className="block">
        <span className="block text-[11px] font-medium text-text-muted mb-1">
          Rol (opcional)
        </span>
        <select
          className={input}
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole | "")}
        >
          <option value="">—</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-9 text-xs font-medium rounded-md border border-border text-text-muted hover:text-text"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 h-9 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {submitting ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
