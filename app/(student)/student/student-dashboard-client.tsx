"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  LoaderCircle,
  MessageCircle,
  Play,
  RotateCcw,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { ExamDialog, useExamAttempt } from "./exam-attempt";
import type {
  ExamListStatus,
  ExamStatusInfo,
  ResultHistoryEntry,
} from "./extra-types";
import { buildStatusMap, readResultHistory } from "./student-cache";
import {
  EmptyState,
  ErrorBanner,
  NoticeBanner,
  scoreClass,
} from "./student-ui";
import { useDashboardData } from "./use-dashboard";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const NOT_STARTED: ExamStatusInfo = { status: "not-started", score: null };

const ACTION_LABEL: Record<ExamListStatus, string> = {
  "not-started": "Open Exam",
  "in-progress": "Resume",
  completed: "Review",
};

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="h-full border-slate-800 bg-slate-900 text-slate-100 transition-colors hover:border-indigo-700">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-base text-slate-300">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          <p className="mt-1 truncate text-sm text-slate-400">{detail}</p>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-950 text-indigo-300">
          <Icon className="size-6" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentDashboardClient({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const { data, loading, error } = useDashboardData(studentId);
  const attempt = useExamAttempt(studentId);

  const [history, setHistory] = useState<ResultHistoryEntry[]>([]);

  // Re-read the saved scores on mount and after every attempt change
  // (opening, answering, submitting), so the new score shows up instantly.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHistory(readResultHistory(studentId));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [studentId, attempt.version]);

  const statuses = useMemo(
    () =>
      buildStatusMap(
        studentId,
        (data?.exams ?? []).map((exam) => exam.id),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [studentId, data, attempt.version],
  );

  const latest = history[0] ?? null;
  const examCount = data?.exams.length ?? 0;
  const materialCount = data?.materials.length ?? 0;

  return (
    <>
      <section className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:flex-row md:items-center">
        <div>
          <Badge className="mb-4 border border-indigo-800 bg-indigo-950 text-sm text-indigo-200">
            Student Portal
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Welcome back, {studentName}
          </h1>
          <p className="mt-2 text-base text-slate-300">
            Your exams, learning materials, results, and chats in one place.
          </p>
        </div>
        <Link
          href="/student/exams"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 font-medium text-white hover:bg-indigo-500"
        >
          <ClipboardList className="size-5" />
          Browse Exams
        </Link>
      </section>

      {!attempt.activeExam && <NoticeBanner message={attempt.notice} />}
      <ErrorBanner message={error} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Available Exams"
          value={loading && !data ? "…" : String(examCount)}
          detail="Exams for your grade"
          icon={ClipboardList}
        />

        <Link href="/student/materials" className="block">
          <MetricCard
            title="Study Materials"
            value={loading && !data ? "…" : String(materialCount)}
            detail="Files available to you"
            icon={BookOpen}
          />
        </Link>

        <Link href="/student/results" className="block">
          <MetricCard
            title="Latest Result"
            value={latest ? `${Math.round(latest.score)}%` : "—"}
            detail={latest ? latest.title : "No submitted exam yet"}
            icon={Trophy}
          />
        </Link>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900 text-slate-100 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-white">
                Available Exams
              </CardTitle>
              <CardDescription className="mt-2 text-base text-slate-400">
                Open an exam to start, resume, or review your attempt.
              </CardDescription>
            </div>
            <CalendarDays className="size-6 text-indigo-300" />
          </CardHeader>

          <CardContent className="space-y-3">
            {loading && !data ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full bg-slate-800" />
              ))
            ) : data?.exams.length ? (
              data.exams.map((exam) => {
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
                          {info.score !== null ? Math.round(info.score) : 0}%
                        </Badge>
                      )}
                      {info.status === "in-progress" && (
                        <Badge className="border border-amber-800 bg-amber-950 text-amber-200">
                          In progress
                        </Badge>
                      )}

                      <Button
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
              })
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="No exams available"
                description="New exams for your grade will appear here."
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle className="text-xl text-white">Study Chats</CardTitle>
            <CardDescription className="mt-2 text-base text-slate-400">
              Continue to your student conversations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-11">
                  <AvatarFallback className="bg-indigo-950 text-indigo-200">
                    <MessageCircle className="size-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-slate-100">Your chat groups</p>
                  <p className="mt-1 text-sm text-slate-400">
                    View available conversations and messages.
                  </p>
                </div>
              </div>
              <Link
                href="/student/chat"
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-700 text-base font-medium text-slate-100 hover:bg-slate-800"
              >
                Open Chats
                <ArrowRight className="size-5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900 text-slate-100 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-white">
                Learning Materials
              </CardTitle>
              <CardDescription className="mt-2 text-base text-slate-400">
                Open PDFs, videos, and other study files.
              </CardDescription>
            </div>
            <Link
              href="/student/materials"
              className="text-indigo-300 hover:text-indigo-200"
              aria-label="View all materials"
            >
              <ChevronRight className="size-5" />
            </Link>
          </CardHeader>

          <CardContent className="space-y-3">
            {loading && !data ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full bg-slate-800" />
              ))
            ) : data?.materials.length ? (
              data.materials.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href="/student/materials"
                  className="flex w-full items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-indigo-700 hover:bg-slate-900"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-950 text-sky-300">
                    <FileText className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-100">
                      {item.title}
                    </span>
                    <span className="mt-1 block truncate text-sm text-slate-400">
                      {item.content || "Study resource"}
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-slate-400" />
                </Link>
              ))
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No materials available"
                description="Learning materials for your grade will appear here."
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle className="text-xl text-white">Exam Tips</CardTitle>
            <CardDescription className="mt-2 text-base text-slate-400">
              Before you begin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-base leading-relaxed text-slate-300">
              Your exam timer starts when you open the exam. Answer all
              questions and submit before time runs out.
            </div>
          </CardContent>
        </Card>
      </section>

      <ExamDialog attempt={attempt} />
    </>
  );
}
