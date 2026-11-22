"use client";

import { useMemo, useState } from "react";
import {
  ClipboardList,
  LoaderCircle,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Trophy,
} from "lucide-react";

import type { ExamListStatus, ExamStatusInfo } from "../extra-types";
import {
  EmptyState,
  ErrorBanner,
  NoticeBanner,
  PageTitle,
  scoreClass,
} from "../student-ui";
import { useDashboardData } from "../use-dashboard";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { buildStatusMap } from "../student-cache";
import { ExamDialog, useExamAttempt } from "../exam-attempt";

const NOT_STARTED: ExamStatusInfo = { status: "not-started", score: null };

const ACTION_LABEL: Record<ExamListStatus, string> = {
  "not-started": "Start exam",
  "in-progress": "Resume",
  completed: "Review",
};

export default function ExamsClient({ studentId }: { studentId: string }) {
  const { data, loading, error, refresh } = useDashboardData(studentId);
  const attempt = useExamAttempt(studentId);
  const [search, setSearch] = useState<string>("");

  const exams = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = data?.exams ?? [];

    return term
      ? list.filter((exam) => exam.title.toLowerCase().includes(term))
      : list;
  }, [data, search]);

  // Re-read the statuses whenever the list loads or an attempt changes.
  const statuses = useMemo(
    () =>
      buildStatusMap(
        studentId,
        (data?.exams ?? []).map((exam) => exam.id),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [studentId, data, attempt.version],
  );

  return (
    <>
      <PageTitle
        title="Exams"
        description="Start a new exam, resume one in progress, or review a finished one."
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
      {!attempt.activeExam && <NoticeBanner message={attempt.notice} />}

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="space-y-4 p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search exams"
              className="border-slate-700 bg-slate-950 pl-9 text-slate-100"
            />
          </div>

          {loading && !data ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full bg-slate-800" />
              ))}
            </div>
          ) : exams.length ? (
            <div className="space-y-3">
              {exams.map((exam) => {
                const info = statuses[exam.id] ?? NOT_STARTED;
                const opening = attempt.startingExamId === exam.id;

                return (
                  <div
                    key={exam.id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-950 text-indigo-300">
                        <ClipboardList className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-100">
                          {exam.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {exam.grade ? `Grade ${exam.grade}` : "Your grade"}
                          {exam.durationMin
                            ? ` · ${exam.durationMin} minutes`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {info.status === "completed" && (
                        <Badge className={`border ${scoreClass(info.score)}`}>
                          <Trophy className="mr-1 size-3.5" />
                          {info.score}%
                        </Badge>
                      )}
                      {info.status === "in-progress" && (
                        <Badge className="border border-amber-800 bg-amber-950 text-amber-200">
                          In progress
                        </Badge>
                      )}
                      {info.status === "not-started" && (
                        <Badge className="border border-slate-700 bg-slate-800 text-slate-300">
                          Not started
                        </Badge>
                      )}

                      <Button
                        type="button"
                        onClick={() => attempt.openExam(exam.id)}
                        disabled={opening}
                        className="h-11 bg-indigo-600 px-5 text-base text-white hover:bg-indigo-500"
                      >
                        {opening ? (
                          <LoaderCircle className="mr-2 size-5 animate-spin" />
                        ) : info.status === "completed" ? (
                          <RotateCcw className="mr-2 size-5" />
                        ) : (
                          <Play className="mr-2 size-5" />
                        )}
                        {ACTION_LABEL[info.status]}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="No exams available"
              description="New exams for your grade will appear here."
            />
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-slate-500">
        The timer starts the moment you open an exam for the first time.
      </p>

      <ExamDialog attempt={attempt} />
    </>
  );
}
