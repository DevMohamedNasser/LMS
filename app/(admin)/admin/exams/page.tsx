"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Eye,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";

import { useAdmin } from "../admin-context";
import {
  EmptyState,
  ErrorBanner,
  GradeSelect,
  NoticeBanner,
  PageHeader,
  RefreshButton,
  formatDate,
} from "../shared";
import type { AdminExam, AnswerLetter, NewExamInput } from "../types";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createExam, listExams } from "@/app/api/actions";
import { invalidateCache, useCachedData } from "../cache";

const LETTERS: AnswerLetter[] = ["a", "b", "c", "d"];

type QuestionDraft = { question: string; options: string[]; correct: number };

const emptyQuestion = (): QuestionDraft => ({
  question: "",
  options: ["", ""],
  correct: 0,
});

function validate(
  title: string,
  grade: string,
  duration: string,
  questions: QuestionDraft[],
): string | null {
  if (!title.trim()) return "Exam title is required.";
  if (!grade) return "Choose a grade.";

  const minutes = Number(duration);
  if (!Number.isFinite(minutes) || minutes < 1) {
    return "Duration must be at least 1 minute.";
  }

  if (questions.length === 0) return "Add at least one question.";

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.question.trim()) return `Question ${i + 1} has no text.`;
    if (q.options.some((option) => !option.trim())) {
      return `Question ${i + 1} has an empty option. Fill it or remove it.`;
    }
  }

  return null;
}

export default function AdminExamsPage() {
  const { adminId } = useAdmin();
  const { data, loading, error, cachedAt, refresh } = useCachedData(
    "exams",
    listExams,
  );

  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [notice, setNotice] = useState<string>("");
  const [viewing, setViewing] = useState<AdminExam | null>(null);

  const [creating, setCreating] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [duration, setDuration] = useState<string>("30");
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    emptyQuestion(),
  ]);

  const exams = useMemo(
    () =>
      (data ?? []).filter(
        (exam) => gradeFilter === "all" || exam.grade === gradeFilter,
      ),
    [data, gradeFilter],
  );

  function resetForm() {
    setTitle("");
    setGrade("");
    setDuration("30");
    setQuestions([emptyQuestion()]);
    setFormError("");
  }

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuestions((current) =>
      current.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    );
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuestions((current) =>
      current.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              options: q.options.map((o, j) => (j === oIndex ? value : o)),
            }
          : q,
      ),
    );
  }

  function addOption(qIndex: number) {
    setQuestions((current) =>
      current.map((q, i) =>
        i === qIndex && q.options.length < 4
          ? { ...q, options: [...q.options, ""] }
          : q,
      ),
    );
  }

  function removeOption(qIndex: number, oIndex: number) {
    setQuestions((current) =>
      current.map((q, i) => {
        if (i !== qIndex || q.options.length <= 2) return q;

        const options = q.options.filter((_, j) => j !== oIndex);
        const correct =
          q.correct === oIndex
            ? 0
            : q.correct > oIndex
              ? q.correct - 1
              : q.correct;

        return { ...q, options, correct };
      }),
    );
  }

  async function handleCreate() {
    const problem = validate(title, grade, duration, questions);

    if (problem) {
      setFormError(problem);
      return;
    }

    const payload: NewExamInput = {
      title: title.trim(),
      grade: Number(grade),
      duration: Number(duration),
      questions: questions.map((q) => ({
        question: q.question.trim(),
        options: q.options.map((option) => option.trim()),
        correctAns: LETTERS[q.correct],
      })),
    };

    setSaving(true);
    setFormError("");

    try {
      await createExam(payload);
      invalidateCache(adminId, "exams", "overview");
      setCreating(false);
      resetForm();
      setNotice(`Exam "${payload.title}" created.`);
      await refresh();
    } catch (createError) {
      setFormError(
        createError instanceof Error
          ? createError.message
          : "Unable to create the exam.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Exams"
        description="Create exams and review their questions and answers."
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
                setCreating(true);
              }}
              className="h-10 bg-indigo-600 text-white hover:bg-indigo-500"
            >
              <Plus className="mr-2 size-4" />
              New exam
            </Button>
          </>
        }
      />

      <NoticeBanner message={notice} />
      <ErrorBanner message={error} />

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="p-4">
          {loading && !data ? (
            <Skeleton className="h-64 w-full bg-slate-800" />
          ) : exams.length ? (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Title</TableHead>
                  <TableHead className="text-slate-400">Grade</TableHead>
                  <TableHead className="text-slate-400">Questions</TableHead>
                  <TableHead className="text-slate-400">Duration</TableHead>
                  <TableHead className="text-slate-400">Created</TableHead>
                  <TableHead className="text-right text-slate-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow
                    key={exam.id}
                    className="border-slate-800 hover:bg-slate-800/40"
                  >
                    <TableCell className="font-medium text-slate-100">
                      {exam.title}
                    </TableCell>
                    <TableCell>
                      <Badge className="border border-indigo-800 bg-indigo-950 text-indigo-200">
                        {exam.grade ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {exam.questions.length}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {exam.durationMin} min
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {formatDate(exam.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setViewing(exam)}
                        className="h-9 border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
                      >
                        <Eye className="mr-2 size-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="No exams found"
              description="Create an exam or change the grade filter."
            />
          )}
        </CardContent>
      </Card>

      {/* ------------------------------ View dialog ------------------------------ */}
      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-900 text-slate-100 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {viewing?.title}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {viewing?.questions.length} questions · {viewing?.durationMin}{" "}
              minutes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {viewing?.questions.map((question, index) => (
              <div
                key={question.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <p className="font-medium text-white">
                  {index + 1}. {question.question}
                </p>
                <div className="mt-3 space-y-2">
                  {question.options.map((option) => {
                    const correct = option.id === question.correctAns;

                    return (
                      <div
                        key={option.id}
                        className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                          correct
                            ? "border-emerald-500 bg-emerald-950/60 text-emerald-100"
                            : "border-slate-800 text-slate-300"
                        }`}
                      >
                        <span>{option.text}</span>
                        {correct && (
                          <span className="flex items-center gap-1 text-sm font-semibold text-emerald-300">
                            <CheckCircle2 className="size-4" />
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ----------------------------- Create dialog ----------------------------- */}
      <Dialog
        open={creating}
        onOpenChange={(open) => {
          if (!open && !saving) setCreating(false);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-900 text-slate-100 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">New exam</DialogTitle>
            <DialogDescription className="text-slate-400">
              Each question needs 2 to 4 options and one correct answer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-3">
                <Label htmlFor="exam-title">Title</Label>
                <Input
                  id="exam-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Math Exam 1"
                  className="border-slate-700 bg-slate-950 text-slate-100"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Grade</Label>
                <GradeSelect value={grade} onChange={setGrade} className="w-full" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exam-duration">Duration (minutes)</Label>
                <Input
                  id="exam-duration"
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  className="border-slate-700 bg-slate-950 text-slate-100"
                />
              </div>
            </div>

            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor={`q-${qIndex}`}>Question {qIndex + 1}</Label>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setQuestions((current) =>
                          current.filter((_, i) => i !== qIndex),
                        )
                      }
                      className="h-8 px-2 text-rose-300 hover:bg-rose-950 hover:text-rose-200"
                    >
                      <Trash2 className="mr-1 size-4" />
                      Remove
                    </Button>
                  )}
                </div>

                <Input
                  id={`q-${qIndex}`}
                  value={q.question}
                  onChange={(event) =>
                    updateQuestion(qIndex, { question: event.target.value })
                  }
                  placeholder="2 + 2 = ?"
                  className="border-slate-700 bg-slate-900 text-slate-100"
                />

                <div className="space-y-2">
                  {q.options.map((option, oIndex) => {
                    const isCorrect = q.correct === oIndex;

                    return (
                      <div key={oIndex} className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={() =>
                            updateQuestion(qIndex, { correct: oIndex })
                          }
                          aria-label={`Mark option ${LETTERS[oIndex]} as correct`}
                          aria-pressed={isCorrect}
                          className={`size-10 shrink-0 border font-semibold uppercase ${
                            isCorrect
                              ? "border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-500"
                              : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          {LETTERS[oIndex]}
                        </Button>
                        <Input
                          value={option}
                          onChange={(event) =>
                            updateOption(qIndex, oIndex, event.target.value)
                          }
                          placeholder={`Option ${LETTERS[oIndex].toUpperCase()}`}
                          className="border-slate-700 bg-slate-900 text-slate-100"
                        />
                        {q.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeOption(qIndex, oIndex)}
                            aria-label="Remove option"
                            className="size-10 shrink-0 text-slate-400 hover:bg-slate-800"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    Green letter = correct answer
                  </p>
                  {q.options.length < 4 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addOption(qIndex)}
                      className="h-9 border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
                    >
                      <Plus className="mr-1 size-4" />
                      Add option
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setQuestions((current) => [...current, emptyQuestion()])
              }
              className="h-10 w-full border-dashed border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800"
            >
              <Plus className="mr-2 size-4" />
              Add question
            </Button>

            <ErrorBanner message={formError} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setCreating(false)}
              className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="bg-indigo-600 text-white hover:bg-indigo-500"
            >
              {saving && <LoaderCircle className="mr-2 size-4 animate-spin" />}
              Create exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
