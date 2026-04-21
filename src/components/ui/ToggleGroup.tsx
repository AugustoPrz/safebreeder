"use client";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  className?: string;
}

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
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 h-9 rounded-md text-sm font-medium transition-colors ${
              active
                ? "bg-surface text-primary shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
