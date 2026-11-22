/* ------------------------------ API raw shapes ------------------------------ */

// الـ API ممكن يرجّع id أو text أو object للإجابة.
export type RawRef =
  | string
  | number
  | { _id?: string; id?: string; text?: string }
  | null
  | undefined;

export type RawOption = {
  _id: string;
  text?: string;
};

export type RawQuestion = {
  _id: string;
  question?: string;
  options?: RawOption[];
  correctAns?: RawRef;
  wrongAns?: RawRef;
};

export type RawWrongAnswer = {
  questionId?: RawRef;
  answer?: RawRef;
};

export type RawExam = {
  _id: string;
  title?: string;
  grade?: string | number | null;
  durationMin?: number;
  questions?: RawQuestion[];
  wrongAns?: unknown;
};

export type RawMaterial = {
  _id: string;
  title?: string;
  content?: string;
  grade?: string | number | null;
};

/* ------------------------------- App models -------------------------------- */

export type ExamOption = {
  id: string;
  text: string;
};

export type ExamQuestion = {
  id: string;
  question: string;
  options: ExamOption[];
  correctAns: string | null;
  wrongAns: string | null;
};

export type ActiveExam = {
  id: string;
  title: string;
  durationMin: number;
  score: number | null;
  questions: ExamQuestion[];
};

export type ExamListItem = {
  id: string;
  title: string;
  grade: string | null;
  durationMin: number | null;
};

export type MaterialListItem = {
  id: string;
  title: string;
  content: string;
  grade: string | null;
};

export type DashboardData = {
  exams: ExamListItem[];
  materials: MaterialListItem[];
};

export type SubmitAnswer = {
  questionId: string;
  answer: string;
};

export type SubmitWrongAnswer = {
  questionId: string;
  answer: string;
};

export type SubmitExamResult = {
  score: number | null;
  review: ActiveExam | null;
  wrongAnswers: SubmitWrongAnswer[] | null;
};

export type StudentMaterial = {
  title: string;
  url: string;
};

/* --------------------------------- Cache ----------------------------------- */

export type AttemptStatus = "in-progress" | "needs-review" | "reviewed";

export type CachedExam = {
  expiresAt: number;
  startedAt: number | null;
  status: AttemptStatus;
  exam: ActiveExam;
  answers: Record<string, string>;
};

export type CachedResult = {
  expiresAt: number;
  examId: string;
  title: string;
  score: number;
};

export type CachedDashboard = {
  expiresAt: number;
  data: DashboardData;
};

export type CachedMaterial = {
  expiresAt: number;
  title: string;
  url: string;
};