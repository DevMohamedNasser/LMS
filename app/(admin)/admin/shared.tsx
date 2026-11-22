"use client";

import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const GRADES = Array.from({ length: 12 }, (_, i) => String(i + 1));

export function formatDate(
  value?: string | number | null,
  withTime = false,
): string {
  if (value === null || value === undefined || value === "") return "—";

  // GraphQL returns epoch milliseconds as a string.
  const date =
    typeof value === "number"
      ? new Date(value)
      : /^\d{10,}$/.test(value)
        ? new Date(Number(value))
        : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(
    undefined,
    withTime
      ? { dateStyle: "medium", timeStyle: "short" }
      : { dateStyle: "medium" },
  );
}

export function scoreClass(score: number | null): string {
  if (score === null) return "border-slate-700 bg-slate-800 text-slate-300";
  if (score >= 80) return "border-emerald-800 bg-emerald-950 text-emerald-200";
  if (score >= 50) return "border-amber-800 bg-amber-950 text-amber-200";
  return "border-rose-800 bg-rose-950 text-rose-200";
}

export function PageHeader({
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
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-base text-slate-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
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

export function RefreshButton({
  onClick,
  loading,
  cachedAt,
}: {
  onClick: () => void;
  loading: boolean;
  cachedAt: number | null;
}) {
  return (
    <div className="flex items-center gap-3">
      {cachedAt && !loading && (
        <span className="hidden text-sm text-slate-500 sm:inline">
          Updated{" "}
          {new Date(cachedAt).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        disabled={loading}
        className="h-10 border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
      >
        <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </Button>
    </div>
  );
}

export function GradeSelect({
  value,
  onChange,
  allowAll = false,
  className = "w-40",
}: {
  value: string;
  onChange: (value: string) => void;
  allowAll?: boolean;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next ?? "")}>
      <SelectTrigger
        className={`h-10 border-slate-700 bg-slate-950 text-slate-100 ${className}`}
      >
        <SelectValue placeholder="Grade" />
      </SelectTrigger>
      <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
        {allowAll && <SelectItem value="all">All grades</SelectItem>}
        {GRADES.map((grade) => (
          <SelectItem key={grade} value={grade}>
            Grade {grade}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}