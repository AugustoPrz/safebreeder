"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import type { UserProfile, UserRole } from "@/lib/types";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "veterinario", label: "Veterinario" },
  { value: "productor", label: "Productor" },
  { value: "asesor", label: "Asesor" },
  { value: "administrador", label: "Administrador" },
  { value: "otro", label: "Otro" },
];

export function UserMenu({ compact = false }: { compact?: boolean } = {}) {
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const logout = useStore((s) => s.logout);

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

  useEffect(() => {
    if (!profile && open) setEditing(true);
  }, [profile, open]);

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
              {profile?.name || "Iniciar sesión"}
            </span>
            <span className="block text-[11px] text-text-muted truncate">
              {profile?.email || "Configurar perfil"}
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
          {editing || !profile ? (
            <ProfileForm
              initial={profile}
              onSave={(p) => {
                setProfile(p);
                setEditing(false);
              }}
              onCancel={() => {
                if (profile) setEditing(false);
                else setOpen(false);
              }}
            />
          ) : (
            <ProfileView
              profile={profile}
              onEdit={() => setEditing(true)}
              onLogout={() => {
                logout();
                setOpen(false);
              }}
            />
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
  profile: UserProfile;
  onEdit: () => void;
  onLogout: () => void;
}) {
  const roleLabel = ROLES.find((r) => r.value === profile.role)?.label;
  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-semibold text-text">{profile.name}</div>
        <div className="text-xs text-text-muted">{profile.email}</div>
        {roleLabel ? (
          <div className="mt-1.5 inline-flex text-[11px] px-2 py-0.5 rounded-full bg-primary-soft text-primary-soft-text font-medium">
            {roleLabel}
          </div>
        ) : null}
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
  initial: UserProfile | null;
  onSave: (p: UserProfile) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [role, setRole] = useState<UserRole | "">(initial?.role ?? "");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSave({
      name: name.trim(),
      email: email.trim(),
      role: role || undefined,
    });
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
          className={input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          required
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
          className="flex-1 h-9 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary-hover"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}
