export type Role = "USER" | "ADMIN";

export type ExamOption = { id: string; text: string };

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type AdminQuestion = {
  id: string;
  question: string;
  options: ExamOption[];
  correctAns: string | null; // option id
};

export type AdminExam = {
  id: string;
  title: string;
  grade: string | null;
  durationMin: number;
  questions: AdminQuestion[];
  createdAt: string | null;
};

export type AdminMaterial = {
  id: string;
  title: string;
  content: string;
  grade: string | null;
};

export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
  grade: string | null;
  role: string; // "USER" | "ADMIN"
  createdAt: string | null; // epoch ms as string (GraphQL) or ISO
};

export type StudentsPage = {
  students: Student[];
  page: number;
  limit: number;
  hasMore: boolean;
};

export type ExamResultRow = {
  id: string;
  grade: string | null;
  startedAt: string | null;
  score: number | null;
  wrongCount: number;
  student: { id: string; fullName: string; email: string } | null;
  exam: { id: string; title: string; durationMin: number | null } | null;
};

export type Overview = {
  examCount: number;
  materialCount: number;
  studentCount: number;
  studentCountCapped: boolean; // true when the 50-user page limit was hit
  averageScore: number | null;
  recentExams: AdminExam[];
  recentMaterials: AdminMaterial[];
  recentResults: ExamResultRow[];
};

export type StudentDetail = {
  student: Student;
  results: ExamResultRow[];
};

/* ------------------------------ mutation inputs ----------------------------- */

export type AnswerLetter = "a" | "b" | "c" | "d";

export type NewExamInput = {
  title: string;
  grade: number;
  duration: number;
  questions: Array<{
    question: string;
    options: string[];
    correctAns: AnswerLetter;
  }>;
};

export type NewMaterialInput = {
  title: string;
  content: string;
  grade: number;
};

export type ResetPasswordInput = {
  email: string;
  password: string;
  newPassword: string;
  confirmPassword: string;
};

export type MaterialUrl = { title: string; url: string };