import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: "/" | "/calendar" | "/standings" | "/drivers" | "/circuits" | "/search";
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl glass border border-border p-10 text-center animate-page-in">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px accent-line opacity-60" />
      <div className="pointer-events-none absolute inset-0 checker-flag opacity-[0.04]" />
      {icon && (
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground">
          {icon}
        </div>
      )}
      <h2 className="font-display text-2xl text-foreground">{title}</h2>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-5 py-2.5 text-sm font-semibold uppercase tracking-widest hover:border-accent/50 hover:bg-surface transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
