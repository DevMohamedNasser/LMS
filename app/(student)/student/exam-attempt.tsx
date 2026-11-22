"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  XCircle,
} from "lucide-react";


import {
  ATTEMPT_CACHE_TTL,
  CELEBRATE_MIN_SCORE,
  addResultToHistory,
  examCacheKey,
  readCache,
  removeCache,
  resultCacheKey,
  writeCache,
} from "./student-cache";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ActiveExam, AttemptStatus, CachedExam, CachedResult, ExamQuestion, SubmitWrongAnswer } from "./types";
import { submitStudentExam } from "./actions";
import { startStudentExam } from "./action";

type CacheMeta = {
  status: AttemptStatus;
  startedAt: number | null;
  expiresAt: number;
};

type Outcome = "correct" | "wrong" | "unknown";

type OptionState =
  | "correct-chosen"
  | "correct-missed"
  | "wrong-chosen"
  | "selected"
  | "neutral";

/* --------------------------------- helpers -------------------------------- */

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

// Student's choice per question for a reviewed exam:
//   wrongAns   -> the student chose a wrong option
//   local      -> what the student selected in this session
//   correctAns -> no wrongAns means the student answered correctly
function buildReviewAnswers(
  exam: ActiveExam,
  local: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const question of exam.questions) {
    const value =
      question.wrongAns ?? local[question.id] ?? question.correctAns;
    if (value) result[question.id] = value;
  }

  return result;
}

// Fills in whatever the review GET did not give us, using the answers the
// student actually submitted and the `wrongAns` list from the submit response:
//   - a question that is NOT in wrongAns was answered correctly, so the
//     student's choice is the correct option;
//   - a question that IS in wrongAns keeps the wrong option the student chose.
function mergeOutcome(
  exam: ActiveExam,
  local: Record<string, string>,
  wrongAnswers: SubmitWrongAnswer[] | null,
): ActiveExam {
  return {
    ...exam,
    questions: exam.questions.map((question) => {
      const chosen = local[question.id] ?? null;
      const wrong = wrongAnswers?.find(
        (item) => item.questionId === question.id,
      );

      return {
        ...question,
        wrongAns: question.wrongAns ?? wrong?.answer ?? null,
        correctAns:
          question.correctAns ??
          (wrongAnswers && chosen && !wrong ? chosen : null),
      };
    }),
  };
}

function getOutcome(question: ExamQuestion, selected: string): Outcome {
  if (!selected) return "unknown";
  if (question.wrongAns && question.wrongAns === selected) return "wrong";
  if (question.correctAns) {
    return question.correctAns === selected ? "correct" : "wrong";
  }
  return "unknown";
}

function getOptionState(
  question: ExamQuestion,
  optionId: string,
  selected: string,
  isReview: boolean,
): OptionState {
  const isChosen = selected === optionId;

  if (!isReview) return isChosen ? "selected" : "neutral";

  if (question.correctAns === optionId) {
    return isChosen ? "correct-chosen" : "correct-missed";
  }

  if (isChosen && getOutcome(question, selected) === "wrong") {
    return "wrong-chosen";
  }

  return "neutral";
}

// Strong shade = the student's own pick, soft shade = the answer they missed.
const OPTION_STYLES: Record<OptionState, string> = {
  "correct-chosen":
    "border-emerald-400 bg-emerald-600/30 text-emerald-50 ring-1 ring-emerald-400/60",
  "correct-missed":
    "border-emerald-700 bg-emerald-950/70 text-emerald-200",
  "wrong-chosen":
    "border-rose-400 bg-rose-600/30 text-rose-50 ring-1 ring-rose-400/60",
  selected: "border-indigo-500 bg-indigo-950/50 text-slate-100",
  neutral: "border-slate-800 text-slate-300",
};

const CARD_STYLES: Record<Outcome, string> = {
  correct: "border-emerald-800/70",
  wrong: "border-rose-800/70",
  unknown: "border-slate-800",
};

/* --------------------------------- hook ---------------------------------- */

export function useExamAttempt(studentId: string) {
  const [activeExam, setActiveExam] = useState<ActiveExam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [startingExamId, setStartingExamId] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>("");
  const [celebrating, setCelebrating] = useState<boolean>(false);
  const [cacheMeta, setCacheMeta] = useState<CacheMeta | null>(null);
  // Bumps whenever an attempt changes, so lists can recompute their statuses.
  const [version, setVersion] = useState<number>(0);

  // Every timer lives in a ref so it can always be cleared.
  const timerRef = useRef<number | null>(null);
  const deadlineRef = useRef<number>(0);
  const celebrateRef = useRef<number | null>(null);
  const hideRef = useRef<number | null>(null);

  const stopTimer = useCallback((): void => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearCelebrationTimers = useCallback((): void => {
    if (celebrateRef.current !== null) {
      window.clearTimeout(celebrateRef.current);
      celebrateRef.current = null;
    }
    if (hideRef.current !== null) {
      window.clearTimeout(hideRef.current);
      hideRef.current = null;
    }
  }, []);

  // The countdown is computed from a fixed deadline, so it stays correct even
  // if the tab is throttled or the dialog is closed and reopened.
  const startTimer = useCallback(
    (deadline: number): void => {
      stopTimer();
      deadlineRef.current = deadline;

      const tick = () => {
        const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        setRemainingSeconds(left);
        if (left <= 0) stopTimer();
      };

      tick();
      if (deadline > Date.now()) {
        timerRef.current = window.setInterval(tick, 1000);
      }
    },
    [stopTimer],
  );

  const showCelebration = useCallback((): void => {
    clearCelebrationTimers();
    setCelebrating(false);

    celebrateRef.current = window.setTimeout(() => {
      setCelebrating(true);
      hideRef.current = window.setTimeout(() => setCelebrating(false), 6000);
    }, 0);
  }, [clearCelebrationTimers]);

  // Nothing keeps running after the page / component goes away.
  useEffect(() => {
    return () => {
      stopTimer();
      clearCelebrationTimers();
    };
  }, [stopTimer, clearCelebrationTimers]);

  function persistExam(
    exam: ActiveExam,
    examAnswers: Record<string, string>,
    status: AttemptStatus,
    startedAt: number | null,
    expiresAt: number,
  ): void {
    writeCache(examCacheKey(studentId, exam.id), {
      expiresAt,
      startedAt,
      status,
      exam,
      answers: examAnswers,
    } satisfies CachedExam);

    setCacheMeta({ status, startedAt, expiresAt });
    setVersion((current) => current + 1);
  }

  // Saves the score so the dashboard, /student/exams and /student/results
  // all show it.
  function rememberResult(exam: ActiveExam, score: number, expiresAt: number) {
    writeCache(resultCacheKey(studentId), {
      expiresAt,
      examId: exam.id,
      title: exam.title,
      score,
    } satisfies CachedResult);

    addResultToHistory(studentId, {
      examId: exam.id,
      title: exam.title,
      score,
      submittedAt: Date.now(),
    });
  }

  async function openExam(examId: string): Promise<void> {
    setStartingExamId(examId);
    setNotice("");

    // A valid in-progress / reviewed attempt is restored from the cache.
    // We must NOT refetch: the first GET starts the exam, the second returns
    // the review, so a refetch of an unfinished exam would break it.
    const cached = readCache<CachedExam>(examCacheKey(studentId, examId));

    if (
      cached &&
      (cached.status === "reviewed" || cached.status === "in-progress")
    ) {
      setActiveExam(cached.exam);
      setAnswers(cached.answers ?? {});
      setCacheMeta({
        status: cached.status,
        startedAt: cached.startedAt,
        expiresAt: cached.expiresAt,
      });

      if (cached.status === "in-progress" && cached.startedAt) {
        startTimer(cached.startedAt + cached.exam.durationMin * 60 * 1000);
      } else {
        stopTimer();
        setRemainingSeconds(0);
      }

      setStartingExamId("");
      return;
    }

    try {
      // Old / expired / needs-review cache is removed, then rebuilt below.
      removeCache(examCacheKey(studentId, examId));

      // First time: starts the exam. Already submitted: returns the review.
      const exam = await startStudentExam(examId);
      const now = Date.now();
      const expiresAt = now + ATTEMPT_CACHE_TTL;
      const isReviewed = exam.score !== null;
      const status: AttemptStatus = isReviewed ? "reviewed" : "in-progress";
      const restoredAnswers = isReviewed ? buildReviewAnswers(exam, {}) : {};

      setActiveExam(exam);
      setAnswers(restoredAnswers);

      if (isReviewed) {
        stopTimer();
        setRemainingSeconds(0);
      } else {
        startTimer(now + exam.durationMin * 60 * 1000);
      }

      persistExam(
        exam,
        restoredAnswers,
        status,
        isReviewed ? null : now,
        expiresAt,
      );

      if (exam.score !== null) rememberResult(exam, exam.score, expiresAt);
    } catch (openError) {
      setNotice(
        openError instanceof Error
          ? openError.message
          : "Unable to open this exam.",
      );
    } finally {
      setStartingExamId("");
    }
  }

  function selectAnswer(questionId: string, answerId: string): void {
    if (!activeExam || activeExam.score !== null) return; // review = read-only

    const nextAnswers = { ...answers, [questionId]: answerId };
    setAnswers(nextAnswers);

    if (cacheMeta) {
      persistExam(
        activeExam,
        nextAnswers,
        cacheMeta.status,
        cacheMeta.startedAt,
        cacheMeta.expiresAt,
      );
    }
  }

  async function submit(): Promise<void> {
    if (!activeExam) return;

    if (activeExam.questions.some((question) => !answers[question.id])) {
      setNotice("Please answer every question before submitting.");
      return;
    }

    setSubmitting(true);
    setNotice("");

    // Stop the countdown and any pending confetti timers right away.
    stopTimer();
    clearCelebrationTimers();
    setCelebrating(false);

    try {
      const result = await submitStudentExam(
        activeExam.id,
        activeExam.questions.map((question) => ({
          questionId: question.id,
          answer: answers[question.id],
        })),
      );

      if (result.score === null) {
        throw new Error("The server did not return an exam score.");
      }

      const reviewedExam: ActiveExam = {
        ...mergeOutcome(
          result.review ?? activeExam,
          answers,
          result.wrongAnswers,
        ),
        score: result.score,
      };

      const reviewAnswers = buildReviewAnswers(reviewedExam, answers);
      const expiresAt = Date.now() + ATTEMPT_CACHE_TTL;

      setActiveExam(reviewedExam);
      setAnswers(reviewAnswers);
      setRemainingSeconds(0);

      persistExam(
        reviewedExam,
        reviewAnswers,
        result.review ? "reviewed" : "needs-review",
        null,
        expiresAt,
      );

      rememberResult(reviewedExam, result.score, expiresAt);
      setNotice(`Exam submitted. Your score is ${result.score}%.`);

      if (result.score >= CELEBRATE_MIN_SCORE) showCelebration();
    } catch (submitError) {
      // The attempt is still open: let the countdown continue.
      if (deadlineRef.current > Date.now()) startTimer(deadlineRef.current);

      setNotice(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit your exam.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function close(): void {
    if (submitting) return;

    stopTimer();
    setActiveExam(null);
    setAnswers({});
    setCacheMeta(null);
  }

  return {
    activeExam,
    answers,
    remainingSeconds,
    startingExamId,
    submitting,
    notice,
    celebrating,
    version,
    openExam,
    selectAnswer,
    submit,
    close,
  };
}

export type ExamAttempt = ReturnType<typeof useExamAttempt>;

/* ------------------------------ celebration ------------------------------- */

const CONFETTI_COLORS = [
  "#818cf8",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#38bdf8",
  "#c084fc",
];

function Celebration() {
  return (
    <div className="pointer-events-none fixed inset-0 z-100 overflow-hidden">
      <style>{`
        @keyframes educore-confetti-fall {
          0% {
            transform: translate3d(0, -10vh, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--drift), 110vh, 0) rotate(720deg);
            opacity: 0.85;
          }
        }
      `}</style>

      {Array.from({ length: 90 }).map((_, index) => {
        const style = {
          left: `${(index * 37) % 100}%`,
          backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
          animation: `educore-confetti-fall ${
            2.5 + (index % 4) * 0.45
          }s ease-in ${(index % 12) * 0.12}s forwards`,
          "--drift": `${((index * 29) % 220) - 110}px`,
        } as CSSProperties;

        return (
          <span
            key={index}
            className="absolute -top-5 h-3 w-2 rounded-sm"
            style={style}
          />
        );
      })}
    </div>
  );
}

/* --------------------------------- dialog --------------------------------- */

export function ExamDialog({ attempt }: { attempt: ExamAttempt }) {
  const {
    activeExam,
    answers,
    remainingSeconds,
    submitting,
    notice,
    celebrating,
    selectAnswer,
    submit,
    close,
  } = attempt;

  const isReview = activeExam?.score !== null && activeExam !== null;

  const outcomes = activeExam
    ? activeExam.questions.map((question) =>
        getOutcome(question, answers[question.id] ?? ""),
      )
    : [];
  const correctCount = outcomes.filter((item) => item === "correct").length;
  const wrongCount = outcomes.filter((item) => item === "wrong").length;

  return (
    <>
      <Dialog
        open={Boolean(activeExam)}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-900 text-slate-100 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              {activeExam?.title ?? "Exam"}
            </DialogTitle>
          </DialogHeader>

          {activeExam && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
                <p className="text-base text-slate-300">
                  {activeExam.questions.length} questions
                </p>

                {activeExam.score === null ? (
                  <Badge className="border border-amber-800 bg-amber-950 text-base text-amber-200">
                    <Clock3 className="mr-2 size-4" />
                    {formatTime(remainingSeconds)} remaining
                  </Badge>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border border-emerald-700 bg-emerald-950 text-base text-emerald-200">
                      {correctCount} correct
                    </Badge>
                    <Badge className="border border-rose-700 bg-rose-950 text-base text-rose-200">
                      {wrongCount} wrong
                    </Badge>
                    <Badge className="border border-indigo-700 bg-indigo-950 text-base text-indigo-100">
                      Score: {activeExam.score}%
                    </Badge>
                  </div>
                )}
              </div>

              {isReview && (
                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="size-3 rounded border border-emerald-400 bg-emerald-600/40" />
                    Correct answer
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="size-3 rounded border border-rose-400 bg-rose-600/40" />
                    Your wrong answer
                  </span>
                </div>
              )}

              {notice && (
                <p
                  role="status"
                  className="rounded-lg border border-indigo-800 bg-indigo-950/50 p-3 text-base text-indigo-100"
                >
                  {notice}
                </p>
              )}

              {activeExam.questions.map((question, index) => {
                const selectedAnswer = answers[question.id] ?? "";
                const outcome: Outcome = isReview
                  ? getOutcome(question, selectedAnswer)
                  : "unknown";

                return (
                  <Card
                    key={question.id}
                    className={`bg-slate-950 text-slate-100 ${
                      isReview ? CARD_STYLES[outcome] : "border-slate-800"
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-base leading-7 text-white">
                          {index + 1}. {question.question}
                        </CardTitle>
                        {outcome === "correct" && (
                          <Badge className="shrink-0 border border-emerald-700 bg-emerald-950 text-emerald-200">
                            Correct
                          </Badge>
                        )}
                        {outcome === "wrong" && (
                          <Badge className="shrink-0 border border-rose-700 bg-rose-950 text-rose-200">
                            Wrong
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={selectedAnswer}
                        onValueChange={(value: string) =>
                          selectAnswer(question.id, value)
                        }
                        disabled={isReview}
                        className="space-y-3"
                      >
                        {question.options.map((option) => {
                          const optionId = `${question.id}-${option.id}`;
                          const state = getOptionState(
                            question,
                            option.id,
                            selectedAnswer,
                            isReview,
                          );

                          return (
                            <div
                              key={option.id}
                              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${OPTION_STYLES[state]}`}
                            >
                              <RadioGroupItem
                                id={optionId}
                                value={option.id}
                                className="border-slate-500 text-indigo-400"
                              />
                              <Label
                                htmlFor={optionId}
                                className="flex-1 cursor-pointer text-base font-normal"
                              >
                                {option.text}
                              </Label>

                              {state === "correct-chosen" && (
                                <span className="flex items-center gap-1 text-sm font-semibold text-emerald-200">
                                  <CheckCircle2 className="size-5 text-emerald-300" />
                                  Your answer · Correct
                                </span>
                              )}

                              {state === "correct-missed" && (
                                <span className="flex items-center gap-1 text-sm font-semibold text-emerald-300">
                                  <CheckCircle2 className="size-5 text-emerald-400" />
                                  Correct answer
                                </span>
                              )}

                              {state === "wrong-chosen" && (
                                <span className="flex items-center gap-1 text-sm font-semibold text-rose-200">
                                  <XCircle className="size-5 text-rose-300" />
                                  Your answer · Wrong
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </CardContent>
                  </Card>
                );
              })}

              {activeExam.questions.length === 0 && (
                <p className="rounded-lg border border-slate-800 p-4 text-base text-slate-300">
                  This exam did not return any questions.
                </p>
              )}

              {activeExam.score === null && (
                <Button
                  onClick={submit}
                  disabled={
                    submitting ||
                    activeExam.questions.length === 0 ||
                    remainingSeconds <= 0
                  }
                  className="h-12 w-full bg-indigo-600 text-base text-white hover:bg-indigo-500"
                >
                  {submitting ? (
                    <LoaderCircle className="mr-2 size-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 size-5" />
                  )}
                  {remainingSeconds <= 0 ? "Time expired" : "Submit Exam"}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {celebrating && <Celebration />}
    </>
  );
}
