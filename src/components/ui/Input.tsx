"use client";

import {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
  ReactNode,
} from "react";

const baseField =
  "w-full rounded-lg border border-border bg-surface px-3 h-11 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none transition-colors disabled:opacity-60";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...rest }, ref) {
  return <input ref={ref} className={`${baseField} ${className}`} {...rest} />;
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className = "", children, ...rest }, ref) {
  return (
    <select ref={ref} className={`${baseField} ${className}`} {...rest}>
      {children}
    </select>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={`${baseField} h-auto py-2.5 min-h-[80px] resize-y ${className}`}
      {...rest}
    />
  );
});

interface FieldProps {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
}

export function Field({ label, children, hint, required }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-muted">
        {label}
        {required ? <span className="text-clay ml-0.5">*</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs text-text-muted">{hint}</span> : null}
    </label>
  );
}
