"use client";

import { t } from "@/lib/i18n";
import { useProfile } from "@/hooks/useProfile";

interface Plan {
  id: "trial" | "basic" | "pro";
  name: string;
  price: string;
  priceSuffix?: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "trial",
    name: "Trial",
    price: "Gratis",
    description: "Probá la app durante 14 días sin cargo.",
    features: [
      "1 establecimiento",
      "Hasta 3 lotes",
      "Carga de HPG y pesadas",
      "Exportar PDF básico",
    ],
    cta: "Empezar prueba",
  },
  {
    id: "basic",
    name: "Basic",
    price: "USD 19",
    priceSuffix: "/mes",
    description: "Para productores que gestionan uno o dos campos.",
    features: [
      "Hasta 3 establecimientos",
      "Lotes ilimitados",
      "HPG, pesadas y tratamientos",
      "Estadísticas y gráficos",
      "Export PDF completo",
    ],
    cta: "Suscribirme",
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "USD 49",
    priceSuffix: "/mes",
    description:
      "Para veterinarios y asesores que manejan múltiples establecimientos.",
    features: [
      "Establecimientos ilimitados",
      "Multiusuario con roles",
      "Histórico completo",
      "Reportes personalizados",
      "Soporte prioritario",
    ],
    cta: "Contactar ventas",
  },
];

export default function PlansPage() {
  const { profile } = useProfile();
  const currentPlan = profile?.plan ?? null;
  return (
    <div>
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold">{t.nav.plans}</h1>
        <p className="text-sm text-text-muted mt-1">
          Elegí el plan que mejor se adapta a tu operación.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
          <div
            key={plan.id}
            className={`relative rounded-2xl border p-6 flex flex-col ${
              isCurrent
                ? "border-primary bg-primary-soft/40 shadow-sm"
                : plan.highlight
                  ? "border-primary bg-primary-soft/20"
                  : "border-border bg-surface"
            }`}
          >
            {isCurrent ? (
              <span className="absolute -top-3 left-6 text-[10px] font-semibold uppercase tracking-wider bg-primary text-white px-2.5 py-1 rounded-full">
                Tu plan
              </span>
            ) : plan.highlight ? (
              <span className="absolute -top-3 left-6 text-[10px] font-semibold uppercase tracking-wider bg-primary text-white px-2.5 py-1 rounded-full">
                Recomendado
              </span>
            ) : null}
            <div className="mb-4">
              <h2 className="text-lg font-bold">{plan.name}</h2>
              <p className="text-xs text-text-muted mt-1">
                {plan.description}
              </p>
            </div>
            <div className="mb-5">
              <span className="text-3xl font-bold tabular-nums">
                {plan.price}
              </span>
              {plan.priceSuffix ? (
                <span className="text-sm text-text-muted ml-1">
                  {plan.priceSuffix}
                </span>
              ) : null}
            </div>
            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="text-sm text-text flex items-start gap-2"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 mt-0.5 shrink-0 text-primary"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled
              className={`h-11 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
                isCurrent || plan.highlight
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-text border border-border"
              }`}
            >
              {isCurrent ? "Plan activo" : plan.cta}
            </button>
          </div>
          );
        })}
      </div>

      <p className="text-xs text-text-muted text-center mt-6">
        Los planes todavía no están activos — los precios son indicativos.
      </p>
    </div>
  );
}
