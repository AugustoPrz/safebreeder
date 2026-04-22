"use client";

export type ToggleTone = "muted" | "primary" | "sun" | "clay";

interface Option<T extends string> {
  value: T;
  label: string;
  tone?: ToggleTone;
}

interface Props<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  className?: string;
}

const ACTIVE_TONE: Record<ToggleTone, string> = {
  muted: "bg-surface text-text-muted shadow-sm",
  primary: "bg-surface text-primary shadow-sm",
  sun: "bg-surface text-sun-soft-text shadow-sm",
  clay: "bg-surface text-clay shadow-sm",
};

export function ToggleGroup<T extends string>({
  value,
  options,
  onChange,
  className = "",
}: Props<T>) {
  return (
    <div
      className={`inline-flex rounded-lg bg-surface-2 p-1 gap-1 ${className}`}
      role="group"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const activeClasses = ACTIVE_TONE[opt.tone ?? "primary"];
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 h-9 rounded-md text-sm font-medium transition-colors ${
              active ? activeClasses : "text-text-muted hover:text-text"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
