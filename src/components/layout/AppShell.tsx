"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { t } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/hooks/useHydrated";
import { useProfile } from "@/hooks/useProfile";
import { StoreBootstrap } from "./StoreBootstrap";
import { UserMenu } from "./UserMenu";

const BARE_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

const navItems = [
  {
    href: "/establishments",
    label: t.nav.establishments,
    icon: EstablishmentsIcon,
  },
  { href: "/dashboard", label: t.nav.dashboard, icon: DashboardIcon },
  { href: "/plans", label: t.nav.plans, icon: PlansIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const establishments = useStore((s) => s.db.establishments);
  const { profile } = useProfile();
  const isAdmin = profile?.plan === "admin";

  if (BARE_ROUTES.includes(pathname)) {
    return (
      <>
        <StoreBootstrap />
        {children}
      </>
    );
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen flex">
      <StoreBootstrap />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 w-60 border-r border-border bg-surface z-30">
        <div className="px-5 py-5 border-b border-border">
          <Link href="/establishments" className="flex items-center">
            <div className="font-black text-lg uppercase tracking-widest text-primary">
              {t.brand}
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const isEstablishments = item.href === "/establishments";
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`px-3 h-11 rounded-lg inline-flex items-center gap-3 text-sm font-medium transition-colors w-full ${
                    active
                      ? "bg-primary-soft text-primary-soft-text"
                      : "text-text-muted hover:text-text hover:bg-surface-2"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </Link>
                {isEstablishments && hydrated && establishments.length > 0 ? (
                  <ul className="mt-1 ml-5 pl-3 border-l border-border flex flex-col gap-0.5">
                    {establishments.map((est) => {
                      const href = `/establishments/${est.id}`;
                      const activeEst = pathname.startsWith(href);
                      return (
                        <li key={est.id}>
                          <Link
                            href={href}
                            className={`px-2.5 h-8 rounded-md flex items-center text-xs font-medium truncate transition-colors ${
                              activeEst
                                ? "text-primary bg-primary-soft"
                                : "text-text-muted hover:text-text hover:bg-surface-2"
                            }`}
                            title={est.name}
                          >
                            {est.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className={`mt-2 px-3 h-11 rounded-lg inline-flex items-center gap-3 text-sm font-medium transition-colors w-full ${
                isActive("/admin")
                  ? "bg-amber-100 text-amber-800"
                  : "text-text-muted hover:text-text hover:bg-surface-2"
              }`}
            >
              <AdminIcon className="w-5 h-5 shrink-0" />
              {t.nav.admin}
            </Link>
          )}
        </nav>

        <div className="p-2 border-t border-border">
          <UserMenu />
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col lg:ml-60">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-border">
          <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <Link href="/establishments" className="flex items-center">
              <div className="font-black text-base uppercase tracking-widest text-primary">
                {t.brand}
              </div>
            </Link>
            <UserMenu compact />
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 pb-28 lg:pb-10">
          {hydrated ? children : <LoadingState />}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border">
        <div className="grid grid-cols-3 h-16">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 text-xs font-medium ${
                  active ? "text-primary" : "text-text-muted"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20 text-text-muted text-sm">
      {t.common.loading}
    </div>
  );
}

function EstablishmentsIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 21V9l9-6 9 6v12" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function DashboardIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function PlansIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
      <circle cx="7" cy="7" r="1.5" />
    </svg>
  );
}

function AdminIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2 3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
