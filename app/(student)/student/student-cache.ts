import type {
  ExamStatusInfo,
  ResultHistoryEntry,
  StoredHistory,
} from "./extra-types";
import { CachedExam } from "./types";

// Exams list, materials list and material URLs: 5 minutes.
export const LIST_CACHE_TTL = 5 * 60 * 1000;
// A student's attempt (in-progress / reviewed): must outlive the exam itself.
export const ATTEMPT_CACHE_TTL = 24 * 60 * 60 * 1000;
// Result history kept on this device.
const HISTORY_TTL = 30 * 24 * 60 * 60 * 1000;
// Celebrate when score >= this value (0 = every successful submit).
export const CELEBRATE_MIN_SCORE = 0;

const prefix = (studentId: string) => `educore:v2:${studentId}`;

export const examCacheKey = (studentId: string, examId: string) =>
  `${prefix(studentId)}:exam:${examId}`;
export const resultCacheKey = (studentId: string) =>
  `${prefix(studentId)}:last-result`;
export const dashboardCacheKey = (studentId: string) =>
  `${prefix(studentId)}:dashboard`;
export const materialCacheKey = (studentId: string, materialId: string) =>
  `${prefix(studentId)}:material:${materialId}`;
const historyKey = (studentId: string) => `${prefix(studentId)}:history`;

export function readCache<T extends { expiresAt: number }>(
  key: string,
): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const value = JSON.parse(raw) as T;

    if (!value.expiresAt || value.expiresAt <= Date.now()) {
      localStorage.removeItem(key);
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

export function writeCache(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable: the app still works without cache.
  }
}

export function removeCache(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function keysWithPrefix(keyPrefix: string): string[] {
  const keys: string[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(keyPrefix)) keys.push(key);
    }
  } catch {
    // ignore
  }

  return keys;
}

/* ----------------------------- result history ----------------------------- */

// Merges the saved history with every reviewed attempt still in the cache,
// so results submitted from the dashboard also show up.
export function readResultHistory(studentId: string): ResultHistoryEntry[] {
  const map = new Map<string, ResultHistoryEntry>();

  const stored = readCache<StoredHistory>(historyKey(studentId));
  stored?.entries.forEach((entry) => map.set(entry.examId, entry));

  for (const key of keysWithPrefix(`${prefix(studentId)}:exam:`)) {
    const cached = readCache<CachedExam>(key);

    if (cached && cached.exam.score !== null && !map.has(cached.exam.id)) {
      map.set(cached.exam.id, {
        examId: cached.exam.id,
        title: cached.exam.title,
        score: cached.exam.score,
        submittedAt: cached.expiresAt - ATTEMPT_CACHE_TTL,
      });
    }
  }

  return [...map.values()].sort((a, b) => b.submittedAt - a.submittedAt);
}

export function addResultToHistory(
  studentId: string,
  entry: ResultHistoryEntry,
): void {
  const stored = readCache<StoredHistory>(historyKey(studentId));
  const entries = (stored?.entries ?? []).filter(
    (item) => item.examId !== entry.examId,
  );

  entries.unshift(entry);

  writeCache(historyKey(studentId), {
    expiresAt: Date.now() + HISTORY_TTL,
    entries: entries.slice(0, 100),
  } satisfies StoredHistory);
}

/* ------------------------------ exam statuses ------------------------------ */

export function buildStatusMap(
  studentId: string,
  examIds: string[],
): Record<string, ExamStatusInfo> {
  const history = new Map(
    readResultHistory(studentId).map((entry) => [entry.examId, entry]),
  );

  const result: Record<string, ExamStatusInfo> = {};

  for (const examId of examIds) {
    const done = history.get(examId);

    if (done) {
      result[examId] = { status: "completed", score: done.score };
      continue;
    }

    const cached = readCache<CachedExam>(examCacheKey(studentId, examId));

    result[examId] =
      cached?.status === "in-progress"
        ? { status: "in-progress", score: null }
        : { status: "not-started", score: null };
  }

  return result;
}

// Removes the cached lists and material links only. Exam attempts and the
// result history are kept so a running exam is never lost.
export function clearListCache(studentId: string): void {
  const keys = [
    ...keysWithPrefix(dashboardCacheKey(studentId)),
    ...keysWithPrefix(`${prefix(studentId)}:material:`),
  ];

  keys.forEach(removeCache);
}
