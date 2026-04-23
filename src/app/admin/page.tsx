"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { fetchAdminStats, type AdminStats, type AdminUserRow } from "@/lib/supabase/admin";
import { t } from "@/lib/i18n";

const PLAN_STYLES: Record<string, string> = {
  trial: "bg-surface-2 text-text-muted",
  basic: "bg-blue-100 text-blue-700",
  pro: "bg-primary-soft text-primary-soft-text",
  admin: "bg-amber-100 text-amber-700",
};

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial",
  basic: "Basic",
  pro: "Pro",
  admin: "Admin",
};

const ROLE_LABELS: Record<string, string> = {
  veterinario: "Veterinario",
  productor: "Productor",
  asesor: "Asesor",
  administrador: "Administrador",
  otro: "Otro",
};

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-1">
      <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
        {label}
      </span>
      <span className="text-3xl font-black text-text tabular-nums">{value}</span>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${PLAN_STYLES[plan] ?? "bg-surface-2 text-text-muted"}`}
    >
      {PLAN_LABELS[plan] ?? plan}
    </span>
  );
}

function UserRow({ user, index }: { user: AdminUserRow; index: number }) {
  const date = new Date(user.created_at).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <tr className={index % 2 === 0 ? "bg-surface" : "bg-surface-2/40"}>
      <td className="px-4 py-3 text-sm font-medium text-text whitespace-nowrap">
        {user.name ?? <span className="text-text-muted italic">Sin nombre</span>}
      </td>
      <td className="px-4 py-3 text-sm text-text-muted whitespace-nowrap">
        {user.email ?? "—"}
      </td>
      <td className="px-4 py-3">
        <PlanBadge plan={user.plan} />
      </td>
      <td className="px-4 py-3 text-sm text-text-muted">
        {user.role ? (ROLE_LABELS[user.role] ?? user.role) : <span className="italic">—</span>}
      </td>
      <td className="px-4 py-3 text-sm text-right tabular-nums text-text">
        {user.est_count}
      </td>
      <td className="px-4 py-3 text-sm text-right tabular-nums text-text">
        {user.lot_count}
      </td>
      <td className="px-4 py-3 text-sm text-text-muted whitespace-nowrap">
        {date}
      </td>
    </tr>
  );
}

export default function AdminPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (profileLoading) return;
    if (profile?.plan !== "admin") {
      setLoading(false);
      return;
    }
    fetchAdminStats()
      .then(setStats)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [profile, profileLoading]);

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted text-sm">
        {t.common.loading}
      </div>
    );
  }

  if (profile?.plan !== "admin") {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted text-sm">
        Acceso restringido.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-clay/10 border border-clay/20 text-clay text-sm px-4 py-3">
        Error al cargar datos: {error}
      </div>
    );
  }

  const users = stats?.users ?? [];
  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-text uppercase tracking-wide">
          Panel de administración
        </h1>
        <p className="text-sm text-text-muted mt-0.5">
          Vista global del sistema
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Usuarios" value={stats?.totals.users ?? 0} />
        <KpiCard label="Establecimientos" value={stats?.totals.establishments ?? 0} />
        <KpiCard label="Lotes" value={stats?.totals.lots ?? 0} />
      </div>

      {/* Users table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-text">Usuarios</h2>
          <input
            type="search"
            placeholder="Buscar por nombre o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm bg-surface-2 border border-border rounded-lg px-3 h-8 w-60 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-text-muted"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-surface-2/60">
                <th className="px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide">
                  Nombre
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide">
                  Email
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide">
                  Plan
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide">
                  Rol
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide text-right">
                  Establec.
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide text-right">
                  Lotes
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide">
                  Registro
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-text-muted"
                  >
                    {search ? "Sin resultados." : "No hay usuarios registrados."}
                  </td>
                </tr>
              ) : (
                filtered.map((user, i) => (
                  <UserRow key={user.id} user={user} index={i} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
