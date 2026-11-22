export type ResultHistoryEntry = {
  examId: string;
  title: string;
  score: number;
  submittedAt: number; // epoch ms
};

export type StoredHistory = {
  expiresAt: number;
  entries: ResultHistoryEntry[];
};

export type ExamListStatus = "not-started" | "in-progress" | "completed";

export type ExamStatusInfo = {
  status: ExamListStatus;
  score: number | null;
};

export type ChangePasswordInput = {
  email: string;
  password: string;
  newPassword: string;
  confirmPassword: string;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
