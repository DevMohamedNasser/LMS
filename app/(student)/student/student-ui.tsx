import type { ReactNode } from "react";
import { AlertTriangle, type LucideIcon } from "lucide-react";

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function scoreClass(score: number | null): string {
  if (score === null) return "border-slate-700 bg-slate-800 text-slate-300";
  if (score >= 80) return "border-emerald-800 bg-emerald-950 text-emerald-200";
  if (score >= 50) return "border-amber-800 bg-amber-950 text-amber-200";
  return "border-rose-800 bg-rose-950 text-rose-200";
}

export function PageTitle({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-base text-slate-400">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-rose-800 bg-rose-950/50 p-4 text-base text-rose-200"
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function NoticeBanner({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="rounded-xl border border-indigo-800 bg-indigo-950/50 p-4 text-base text-indigo-100"
    >
      {message}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 px-5 py-12 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
        <Icon className="size-6" />
      </div>
      <p className="font-semibold text-slate-100">{title}</p>
      <p className="mt-2 text-base text-slate-400">{description}</p>
    </div>
  );
}
