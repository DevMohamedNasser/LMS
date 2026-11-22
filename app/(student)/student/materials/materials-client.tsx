"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  FileText,
  LoaderCircle,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  LIST_CACHE_TTL,
  materialCacheKey,
  readCache,
  writeCache,
} from "../student-cache";
import {
  EmptyState,
  ErrorBanner,
  NoticeBanner,
  PageTitle,
} from "../student-ui";
import { useDashboardData } from "../use-dashboard";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CachedMaterial, StudentMaterial } from "../types";
import { getStudentMaterialUrl } from "../actions";

type FileKind = "video" | "image" | "pdf";

function getFileKind(title: string, url: string): FileKind {
  const value = `${title} ${url}`.toLowerCase().split("?")[0];

  if (/\.(mp4|webm|mov|m4v)$/.test(value)) return "video";
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(value)) return "image";
  return "pdf";
}

function MaterialPreview({ title, url }: StudentMaterial) {
  const kind = getFileKind(title, url);

  if (kind === "video") {
    return (
      <video
        controls
        src={url}
        className="max-h-[70vh] w-full rounded-lg bg-black"
      >
        Your browser does not support embedded video.
      </video>
    );
  }

  if (kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={title}
        className="max-h-[70vh] w-full rounded-lg object-contain"
      />
    );
  }

  return (
    <iframe
      src={url}
      title={title}
      className="h-[70vh] w-full rounded-lg border border-slate-800 bg-white"
    />
  );
}

function saveMaterialCache(key: string, material: StudentMaterial): void {
  const cached: CachedMaterial = {
    expiresAt: Date.now() + LIST_CACHE_TTL,
    title: material.title,
    url: material.url,
  };

  writeCache(key, cached);
}

export default function MaterialsClient({ studentId }: { studentId: string }) {
  const { data, loading, error, refresh } = useDashboardData(studentId);

  const [search, setSearch] = useState<string>("");
  const [material, setMaterial] = useState<StudentMaterial | null>(null);
  const [loadingId, setLoadingId] = useState<string>("");
  const [notice, setNotice] = useState<string>("");

  const materials = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = data?.materials ?? [];

    return term
      ? list.filter(
          (item) =>
            item.title.toLowerCase().includes(term) ||
            item.content.toLowerCase().includes(term),
        )
      : list;
  }, [data, search]);

  async function handleOpen(materialId: string): Promise<void> {
    setNotice("");

    const key = materialCacheKey(studentId, materialId);
    const cached = readCache<CachedMaterial>(key);

    if (cached) {
      setMaterial({ title: cached.title, url: cached.url });
      return;
    }

    setLoadingId(materialId);

    try {
      const result = await getStudentMaterialUrl(materialId);

      saveMaterialCache(key, result);

      setMaterial(result);
    } catch (openError) {
      setNotice(
        openError instanceof Error
          ? openError.message
          : "Unable to open this material.",
      );
    } finally {
      setLoadingId("");
    }
  }

  return (
    <>
      <PageTitle
        title="Materials"
        description="PDFs, videos and images shared for your grade."
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={refresh}
            disabled={loading}
            className="h-10 border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
          >
            <RefreshCw
              className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      <ErrorBanner message={error} />
      <NoticeBanner message={notice} />

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="space-y-4 p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search materials"
              className="border-slate-700 bg-slate-950 pl-9 text-slate-100"
            />
          </div>

          {loading && !data ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full bg-slate-800" />
              ))}
            </div>
          ) : materials.length ? (
            <div className="space-y-3">
              {materials.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleOpen(item.id)}
                  disabled={loadingId === item.id}
                  className="flex w-full items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-left transition hover:border-indigo-700 hover:bg-slate-900 disabled:opacity-60"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-950 text-sky-300">
                    {loadingId === item.id ? (
                      <LoaderCircle className="size-5 animate-spin" />
                    ) : (
                      <FileText className="size-5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-100">
                      {item.title}
                    </span>
                    <span className="mt-1 block truncate text-sm text-slate-400">
                      {item.content || "Study resource"}
                    </span>
                  </span>
                  {item.grade && (
                    <Badge className="hidden border border-indigo-800 bg-indigo-950 text-indigo-200 sm:inline-flex">
                      Grade {item.grade}
                    </Badge>
                  )}
                  <ChevronRight className="size-5 shrink-0 text-slate-400" />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No materials found"
              description="Learning materials for your grade will appear here."
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(material)}
        onOpenChange={(open) => {
          if (!open) setMaterial(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-hidden border-slate-800 bg-slate-900 text-slate-100 sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {material?.title ?? "Study material"}
            </DialogTitle>
            {material && (
              <a
                href={material.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-1 text-sm text-indigo-300 hover:text-indigo-200"
              >
                Open in a new tab
                <ExternalLink className="size-4" />
              </a>
            )}
          </DialogHeader>
          {material && (
            <MaterialPreview title={material.title} url={material.url} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
