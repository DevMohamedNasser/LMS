"use client";

import { useEffect, useState } from "react";
import {
  Award,
  BarChart3,
  ClipboardCheck,
  LoaderCircle,
  Trophy,
} from "lucide-react";

import { ExamDialog, useExamAttempt } from "../exam-attempt";
import type { ResultHistoryEntry } from "../extra-types";
import { readResultHistory } from "../student-cache";
import {
  EmptyState,
  NoticeBanner,
  PageTitle,
  formatDate,
  scoreClass,
} from "../student-ui";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof Trophy;
}) {
  return (
    <Card className="border-slate-800 bg-slate-900 text-slate-100">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-base text-slate-300">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-950 text-indigo-300">
          <Icon className="size-6" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResultsClient({ studentId }: { studentId: string }) {
  const attempt = useExamAttempt(studentId);
  const [entries, setEntries] = useState<ResultHistoryEntry[]>([]);
  const [ready, setReady] = useState<boolean>(false);

  // Re-read the history on mount and after every attempt change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(readResultHistory(studentId));
    setReady(true);
  }, [studentId, attempt.version]);

  const average = entries.length
    ? entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length
    : null;
  const best = entries.length
    ? Math.max(...entries.map((entry) => entry.score))
    : null;

  return (
    <>
      <PageTitle
        title="Results"
        description="Your submitted exams. Open one to see your answers and the correct ones."
      />

      {!attempt.activeExam && <NoticeBanner message={attempt.notice} />}

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Exams completed"
          value={String(entries.length)}
          icon={ClipboardCheck}
        />
        <SummaryCard
          title="Average score"
          value={average !== null ? `${Math.round(average)}%` : "—"}
          icon={BarChart3}
        />
        <SummaryCard
          title="Best score"
          value={best !== null ? `${Math.round(best)}%` : "—"}
          icon={Award}
        />
      </section>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="text-xl text-white">History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!ready ? null : entries.length ? (
            entries.map((entry) => {
              const opening = attempt.startingExamId === entry.examId;

              return (
                <div
                  key={entry.examId}
                  className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-100">
                      {entry.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Submitted {formatDate(entry.submittedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className={`border ${scoreClass(entry.score)}`}>
                      {Math.round(entry.score)}%
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => attempt.openExam(entry.examId)}
                      disabled={opening}
                      className="h-10 border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
                    >
                      {opening && (
                        <LoaderCircle className="mr-2 size-4 animate-spin" />
                      )}
                      Review answers
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              icon={Trophy}
              title="No results yet"
              description="Submit an exam and your score will appear here."
            />
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-slate-500">
        Results are saved in this browser for 30 days. Clearing your browser
        data removes this list, but your scores stay on the server.
      </p>

      <ExamDialog attempt={attempt} />
    </>
  );
}
