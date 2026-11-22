"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  Eye,
  FileText,
  LoaderCircle,
  Trash2,
  Upload,
} from "lucide-react";

import {
  createMaterial,
  deleteMaterial,
  getMaterialUrl,
  listMaterials,
} from "@/app/api/admin-actions";
import { useAdmin } from "../admin-context";
import {
  invalidateCache,
  readCache,
  useCachedData,
  writeCache,
} from "../cache";
import {
  EmptyState,
  ErrorBanner,
  GradeSelect,
  NoticeBanner,
  PageHeader,
  RefreshButton,
} from "../shared";
import type { AdminMaterial, MaterialUrl } from "../types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

// Pre-signed GET URLs live for 5 minutes on the backend, so the cached URL
// must expire sooner than that (the lists themselves stay cached for 1 hour).
const URL_CACHE_TTL = 4 * 60 * 1000;

type UploadStage = "idle" | "creating" | "uploading";

function getFileKind(title: string, url: string): "video" | "image" | "pdf" {
  const value = `${title} ${url}`.toLowerCase().split("?")[0];

  if (/\.(mp4|webm|mov|m4v)$/.test(value)) return "video";
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(value)) return "image";
  return "pdf";
}

function Preview({ title, url }: MaterialUrl) {
  const kind = getFileKind(title, url);

  if (kind === "video") {
    return (
      <video
        controls
        src={url}
        className="max-h-[70vh] w-full rounded-lg bg-black"
      />
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

export default function AdminMaterialsPage() {
  const { adminId } = useAdmin();
  const { data, loading, error, cachedAt, refresh } = useCachedData(
    "materials",
    listMaterials,
  );

  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [notice, setNotice] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");

  // upload form
  const [uploadOpen, setUploadOpen] = useState<boolean>(false);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [formError, setFormError] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  // preview / delete
  const [preview, setPreview] = useState<MaterialUrl | null>(null);
  const [openingId, setOpeningId] = useState<string>("");
  const [toDelete, setToDelete] = useState<AdminMaterial | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const materials = useMemo(
    () =>
      (data ?? []).filter(
        (item) => gradeFilter === "all" || item.grade === gradeFilter,
      ),
    [data, gradeFilter],
  );

  const uploading = stage !== "idle";

  function resetForm() {
    setTitle("");
    setContent("");
    setGrade("");
    setFile(null);
    setFormError("");
    setStage("idle");
  }

  async function handleUpload() {
    if (!title.trim()) return setFormError("Title is required.");
    if (!grade) return setFormError("Choose a grade.");
    if (!file) return setFormError("Choose a file to upload.");
const duplicate = (data ?? []).some(
  (item) => item.title.trim().toLowerCase() === title.trim().toLowerCase(),
);

if (duplicate) {
  return setFormError(
    "A material with this title already exists. Choose a different title.",
  );
}
    setFormError("");

    try {
      // 1) create the record and get the pre-signed PUT url (valid 2 minutes)
      setStage("creating");
const created = await createMaterial({
  title: title.trim(),
  content: content.trim(),
  grade: Number(grade),
});

if (!created.ok) throw new Error(created.error);

const { uploadUrl } = created.data;

      // 2) PUT the raw file straight to S3 (no FormData, no POST)
      setStage("uploading");
      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!response.ok) {
        throw new Error(
          `Upload to storage failed (${response.status}). Check the S3 CORS settings and try again.`,
        );
      }

      invalidateCache(adminId, "materials", "overview");
      setUploadOpen(false);
      resetForm();
      setNotice("Material uploaded.");
      await refresh();
    } catch (uploadError) {
      setFormError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload the material.",
      );
      setStage("idle");
    }
  }

  async function handleOpen(item: AdminMaterial) {
    setActionError("");

    const key = `educore:admin:v1:${adminId}:material-url:${item.id}`;
    const cached = readCache<MaterialUrl>(key);

    if (cached) {
      setPreview(cached.data);
      return;
    }

    setOpeningId(item.id);

    try {
      const result = await getMaterialUrl(item.id);
      writeCache(key, result, URL_CACHE_TTL);
      setPreview(result);
    } catch (openError) {
      setActionError(
        openError instanceof Error
          ? openError.message
          : "Unable to open this material.",
      );
    } finally {
      setOpeningId("");
    }
  }

  async function handleDelete() {
    if (!toDelete) return;

    setDeleting(true);
    setActionError("");

    try {
      await deleteMaterial(toDelete.id);
      invalidateCache(adminId, "materials", "overview");
      setNotice(`"${toDelete.title}" deleted.`);
      setToDelete(null);
      await refresh();
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete this material.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Materials"
        description="Upload study files and manage what students can open."
        actions={
          <>
            <GradeSelect
              allowAll
              value={gradeFilter}
              onChange={setGradeFilter}
            />
            <RefreshButton
              onClick={refresh}
              loading={loading}
              cachedAt={cachedAt}
            />
            <Button
              type="button"
              onClick={() => {
                resetForm();
                setUploadOpen(true);
              }}
              className="h-10 bg-indigo-600 text-white hover:bg-indigo-500"
            >
              <Upload className="mr-2 size-4" />
              Upload file
            </Button>
          </>
        }
      />

      <NoticeBanner message={notice} />
      <ErrorBanner message={error || actionError} />

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="space-y-3 p-4">
          {loading && !data ? (
            <Skeleton className="h-64 w-full bg-slate-800" />
          ) : materials.length ? (
            materials.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-950 text-sky-300">
                  <FileText className="size-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-100">
                    {item.title}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-400">
                    {item.content || "No description"}
                  </p>
                </div>

                <Badge className="w-fit border border-indigo-800 bg-indigo-950 text-indigo-200">
                  {item.grade ? `Grade ${item.grade}` : "All grades"}
                </Badge>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpen(item)}
                    disabled={openingId === item.id}
                    className="h-9 border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
                  >
                    {openingId === item.id ? (
                      <LoaderCircle className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Eye className="mr-2 size-4" />
                    )}
                    Open
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setToDelete(item)}
                    className="h-9 border-rose-900 bg-transparent text-rose-300 hover:bg-rose-950"
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No materials found"
              description="Upload a file or change the grade filter."
            />
          )}
        </CardContent>
      </Card>

      {/* ------------------------------ Upload dialog ------------------------------ */}
      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          if (!open && !uploading) setUploadOpen(false);
        }}
      >
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              Upload material
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Pick the file first. The upload link is only valid for 2 minutes,
              so the file is sent right after you press Upload.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material-title">Title</Label>
              <Input
                id="material-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="border-slate-700 bg-slate-950 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material-content">Description</Label>
              <Textarea
                id="material-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={3}
                className="border-slate-700 bg-slate-950 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label>Grade</Label>
              <GradeSelect value={grade} onChange={setGrade} className="w-full" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material-file">File</Label>
              <Input
                id="material-file"
                type="file"
                accept="application/pdf,video/*,image/*"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="border-slate-700 bg-slate-950 text-slate-100"
              />
            </div>

            <ErrorBanner message={formError} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => setUploadOpen(false)}
              className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="bg-indigo-600 text-white hover:bg-indigo-500"
            >
              {uploading && (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              )}
              {stage === "creating"
                ? "Preparing…"
                : stage === "uploading"
                  ? "Uploading…"
                  : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------ Preview dialog ----------------------------- */}
      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-hidden border-slate-800 bg-slate-900 text-slate-100 sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {preview?.title}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {preview && (
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200"
                >
                  Open in a new tab
                  <ExternalLink className="size-4" />
                </a>
              )}
            </DialogDescription>
          </DialogHeader>
          {preview && <Preview title={preview.title} url={preview.url} />}
        </DialogContent>
      </Dialog>

      {/* ------------------------------ Delete dialog ------------------------------ */}
      <Dialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => {
          if (!open && !deleting) setToDelete(null);
        }}
      >
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              Delete this material?
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              &quot;{toDelete?.title}&quot; will be removed from storage and the
              database. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setToDelete(null)}
              className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-rose-600 text-white hover:bg-rose-500"
            >
              {deleting && <LoaderCircle className="mr-2 size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
