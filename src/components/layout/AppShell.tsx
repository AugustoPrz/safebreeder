"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { t } from "@/lib/i18n";
import { useHydrated } from "@/hooks/useHydrated";
import { DataMenu } from "./DataMenu";
import { StoreBootstrap } from "./StoreBootstrap";

const navItems = [
  {
    href: "/establishments",
    label: t.nav.establishments,
    icon: EstablishmentsIcon,
  },
  { href: "/dashboard", label: t.nav.dashboard, icon: DashboardIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydrated();

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

        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 h-11 rounded-lg inline-flex items-center gap-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-soft text-primary-soft-text"
                    : "text-text-muted hover:text-text hover:bg-surface-2"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border flex items-center justify-between">
          <span className="text-[11px] text-text-muted uppercase tracking-wider font-medium">
            Datos
          </span>
          <DataMenu />
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
            <DataMenu />
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 pb-28 lg:pb-10">
          {hydrated ? children : <LoadingState />}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border">
        <div className="grid grid-cols-2 h-16">
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
