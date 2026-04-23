import Link from "next/link";
import { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: Props) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="p-6">
        <Link href="/" className="inline-flex items-center">
          <span className="font-black text-lg uppercase tracking-widest text-primary">
            Safebreeder
          </span>
        </Link>
      </header>
      <main className="flex-1 flex items-start sm:items-center justify-center px-4 pb-10">
        <div className="w-full max-w-md">
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
            <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
            {subtitle ? (
              <p className="text-sm text-text-muted mt-1">{subtitle}</p>
            ) : null}
            <div className="mt-6">{children}</div>
          </div>
          {footer ? (
            <div className="text-center text-sm text-text-muted mt-4">
              {footer}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
