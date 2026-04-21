import { HTMLAttributes } from "react";

export function Card({
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-surface border border-border rounded-xl shadow-[0_1px_2px_rgba(31,37,24,0.05)] ${className}`}
      {...rest}
    />
  );
}

export function CardHeader({
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-5 py-4 border-b border-border ${className}`}
      {...rest}
    />
  );
}

export function CardBody({
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-5 ${className}`} {...rest} />;
}

export function CardFooter({
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-5 py-4 border-t border-border ${className}`}
      {...rest}
    />
  );
}
