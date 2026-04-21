import { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {icon ? (
        <div className="mb-4 w-14 h-14 rounded-full bg-primary-soft flex items-center justify-center text-primary">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      {description ? (
        <p className="text-sm text-text-muted max-w-md mb-5">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
