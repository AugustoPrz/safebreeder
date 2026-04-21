import { HTMLAttributes } from "react";
import type { HpgLevel } from "@/lib/calc";

type Variant = "default" | "low" | "moderate" | "high" | "none" | "info";

const classes: Record<Variant, string> = {
  default: "bg-surface-2 text-text",
  low: "bg-primary-soft text-primary-soft-text",
  moderate: "bg-sun-soft text-sun-soft-text",
  high: "bg-clay-soft text-clay-soft-text",
  none: "bg-surface-2 text-text-muted",
  info: "bg-sky-soft text-sky",
};

interface Props extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ variant = "default", className = "", ...rest }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${classes[variant]} ${className}`}
      {...rest}
    />
  );
}

export function hpgVariant(level: HpgLevel): Variant {
  return level;
}
