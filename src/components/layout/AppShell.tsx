"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { t } from "@/lib/i18n";
import { useHydrated } from "@/hooks/useHydrated";
import { DataMenu } from "./DataMenu";
import { StoreBootstrap } from "./StoreBootstrap";

const navItems = [
  { href: "/establishments", label: t.nav.establishments, icon: EstablishmentsIcon },
  { href: "/dashboard", label: t.nav.dashboard, icon: DashboardIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydrated();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen flex flex-col">
      <StoreBootstrap />
      {/* Top header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/establishments" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
              S
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold text-base tracking-tight">
                {t.brand}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted hidden sm:block">
                {t.tagline}
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 h-10 rounded-lg inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary-soft text-primary-soft-text"
                      : "text-text-muted hover:text-text hover:bg-surface-2"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <DataMenu />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 pb-28 md:pb-10">
        {hydrated ? children : <LoadingState />}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border">
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
