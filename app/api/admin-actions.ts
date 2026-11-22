"use server";

import { getServerSession } from "next-auth";
import type {
  ActionResult,
  AdminExam,
  AdminMaterial,
  ExamResultRow,
  MaterialUrl,
  NewExamInput,
  NewMaterialInput,
  Overview,
  ResetPasswordInput,
  Student,
  StudentDetail,
  StudentsPage,
} from "../(admin)/admin/types";
import { NextOptions } from "./auth/[...nextauth]/route";

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL;

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL;

const AUTH_PREFIX = process.env.ADMIN_AUTH_PREFIX || "ADMIN";

function apiUrl(path: string): string {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not configured.");
  }

  return `${API_BASE.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function getGraphqlUrl(): string {
  if (!GRAPHQL_ENDPOINT) {
    throw new Error("GRAPHQL_URL is not configured.");
  }

  return GRAPHQL_ENDPOINT;
}

/* --------------------------------- helpers --------------------------------- */

async function requireAdminToken(): Promise<string> {
  const session = await getServerSession(NextOptions);

  if (!session || String(session.user.role).toLowerCase() !== "admin") {
    throw new Error("Please sign in with an admin account.");
  }

  if (!session.accessToken) {
    throw new Error("Your session does not include an access token.");
  }

  return session.accessToken;
}

type Envelope = {
  message?: string;
  data?: any;
  [key: string]: any;
};

async function rest(path: string, init: RequestInit = {}): Promise<Envelope> {
  const token = await requireAdminToken();

  const response = await fetch(apiUrl(path), {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `${AUTH_PREFIX} ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  const data: Envelope = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "The request could not be completed.");
  }

  return data;
}

async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const token = await requireAdminToken();

  const response = await fetch(getGraphqlUrl(), {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${AUTH_PREFIX} ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json.errors?.length) {
    throw new Error(
      json.errors?.[0]?.message ||
        json.message ||
        "The GraphQL request failed.",
    );
  }

  return json.data as T;
}

const str = (value: unknown): string | null =>
  value === null || value === undefined || value === "" ? null : String(value);

function mapExam(raw: Record<string, any>): AdminExam {
  return {
    id: String(raw._id),
    title: String(raw.title ?? "Untitled exam"),
    grade: str(raw.grade),
    durationMin: typeof raw.durationMin === "number" ? raw.durationMin : 0,
    createdAt: str(raw.createdAt),
    questions: Array.isArray(raw.questions)
      ? raw.questions.map((question: Record<string, any>) => ({
          id: String(question._id),
          question: String(question.question ?? ""),
          correctAns: str(
            typeof question.correctAns === "object"
              ? question.correctAns?._id
              : question.correctAns,
          ),
          options: Array.isArray(question.options)
            ? question.options.map((option: Record<string, any>) => ({
                id: String(option._id),
                text: String(option.text ?? ""),
              }))
            : [],
        }))
      : [],
  };
}

function mapMaterial(raw: Record<string, any>): AdminMaterial {
  return {
    id: String(raw._id),
    title: String(raw.title ?? "Untitled material"),
    content: String(raw.content ?? ""),
    grade: str(raw.grade),
  };
}

function mapStudent(raw: Record<string, any>): Student {
  return {
    id: String(raw.id),
    firstName: String(raw.firstName ?? ""),
    lastName: String(raw.lastName ?? ""),
    fullName: String(
      raw.fullName ?? `${raw.firstName ?? ""} ${raw.lastName ?? ""}`.trim(),
    ),
    email: String(raw.email ?? ""),
    phone: str(raw.phone),
    address: str(raw.address),
    grade: str(raw.grade),
    role: String(raw.role ?? "USER"),
    createdAt: str(raw.createdAt),
  };
}

function mapResult(raw: Record<string, any>): ExamResultRow {
  return {
    id: String(raw.id),
    grade: str(raw.grade),
    startedAt: str(raw.startedAt),
    score: typeof raw.score === "number" ? raw.score : null,
    wrongCount: Array.isArray(raw.wrongAns) ? raw.wrongAns.length : 0,
    student: raw.student
      ? {
          id: String(raw.student.id),
          fullName: String(raw.student.fullName ?? ""),
          email: String(raw.student.email ?? ""),
        }
      : null,
    exam: raw.exam
      ? {
          id: String(raw.exam.id),
          title: String(raw.exam.title ?? ""),
          durationMin:
            typeof raw.exam.durationMin === "number"
              ? raw.exam.durationMin
              : null,
        }
      : null,
  };
}

/* --------------------------------- GraphQL --------------------------------- */

const USERS_QUERY = /* GraphQL */ `
  query Users($grade: Int, $page: Int, $limit: Int) {
    users(grade: $grade, page: $page, limit: $limit) {
      id
      firstName
      lastName
      fullName
      email
      phone
      address
      grade
      role
      createdAt
    }
  }
`;

const RESULTS_QUERY = /* GraphQL */ `
  query ExamResults($grade: Int, $page: Int, $limit: Int) {
    examResults(grade: $grade, page: $page, limit: $limit) {
      id
      grade
      startedAt
      score
      student {
        id
        fullName
        email
      }
      exam {
        id
        title
        durationMin
      }
      wrongAns {
        questionId
        answer
      }
    }
  }
`;

async function fetchUsers(page: number, limit: number, grade?: number) {
  const data = await gql<{ users: Record<string, any>[] }>(USERS_QUERY, {
    page,
    limit,
    ...(grade ? { grade } : {}),
  });

  return (data.users ?? []).map(mapStudent);
}

async function fetchResults(page: number, limit: number, grade?: number) {
  const data = await gql<{ examResults: Record<string, any>[] }>(
    RESULTS_QUERY,
    {
      page,
      limit,
      ...(grade ? { grade } : {}),
    },
  );

  return (data.examResults ?? []).map(mapResult);
}

/* ---------------------------------- exams ---------------------------------- */

export async function listExams(): Promise<AdminExam[]> {
  const response = await rest("exam/list-exams");
  const raw = response.data?.exams ?? [];

  return Array.isArray(raw) ? raw.map(mapExam) : [];
}

export async function createExam(input: NewExamInput): Promise<void> {
  await rest("exam/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* -------------------------------- materials -------------------------------- */

export async function listMaterials(): Promise<AdminMaterial[]> {
  const response = await rest("material/list-all");
  const raw = response.data ?? [];

  return Array.isArray(raw) ? raw.map(mapMaterial) : [];
}

// Creates the material record and returns its pre-signed S3 PUT URL.
// The browser uploads the file directly to S3.
export async function createMaterial(
  input: NewMaterialInput,
): Promise<ActionResult<{ uploadUrl: string }>> {
  try {
    const response = await rest("material", {
      method: "POST",
      body: JSON.stringify(input),
    });

    if (typeof response.data !== "string" || !response.data) {
      return {
        ok: false,
        error: "The server did not return an upload URL.",
      };
    }

    return {
      ok: true,
      data: { uploadUrl: response.data },
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to create the material.",
    };
  }
}

export async function deleteMaterial(materialId: string): Promise<void> {
  await rest(`material/${encodeURIComponent(materialId)}`, {
    method: "DELETE",
  });
}

export async function getMaterialUrl(materialId: string): Promise<MaterialUrl> {
  const response = await rest(`material/${encodeURIComponent(materialId)}`);

  const items = response.data?.material;
  const first = Array.isArray(items) ? items[0] : null;
  const url: unknown = typeof first === "string" ? first : first?.url;

  if (typeof url !== "string" || !url) {
    throw new Error("This material does not have a viewable URL.");
  }

  return {
    title: String(response.data?.title ?? "Material"),
    url,
  };
}

/* --------------------------------- students -------------------------------- */

export async function listStudents(
  page: number,
  limit: number,
  grade?: number,
): Promise<StudentsPage> {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const students = await fetchUsers(page, safeLimit, grade);

  return {
    students,
    page,
    limit: safeLimit,
    hasMore: students.length === safeLimit,
  };
}

// The GraphQL schema has no "user by id" or "results by student" query,
// so page through the lists and filter on the server.
export async function getStudentDetail(
  studentId: string,
): Promise<StudentDetail> {
  const MAX_PAGES = 10;
  const LIMIT = 50;

  let student: Student | null = null;

  for (let page = 1; page <= MAX_PAGES && !student; page += 1) {
    const users = await fetchUsers(page, LIMIT);
    student = users.find((user) => user.id === studentId) ?? null;

    if (users.length < LIMIT) break;
  }

  if (!student) {
    throw new Error("Student not found.");
  }

  const results: ExamResultRow[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const rows = await fetchResults(page, LIMIT);
    results.push(...rows.filter((row) => row.student?.id === studentId));

    if (rows.length < LIMIT) break;
  }

  return { student, results };
}

export async function changeUserRole(
  userId: string,
  role: "USER" | "ADMIN",
): Promise<void> {
  await rest(`auth/role/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function resetUserPassword(
  input: ResetPasswordInput,
): Promise<void> {
  await rest("auth/reset-password", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/* -------------------------------- overview --------------------------------- */

export async function getOverview(): Promise<Overview> {
  const [exams, materials, users, results] = await Promise.all([
    listExams(),
    listMaterials(),
    fetchUsers(1, 50),
    fetchResults(1, 50),
  ]);

  const scored = results.filter((row) => row.score !== null);
  const averageScore = scored.length
    ? scored.reduce((sum, row) => sum + (row.score ?? 0), 0) / scored.length
    : null;

  return {
    examCount: exams.length,
    materialCount: materials.length,
    studentCount: users.filter((user) => user.role !== "ADMIN").length,
    studentCountCapped: users.length === 50,
    averageScore,
    recentExams: exams.slice(0, 5),
    recentMaterials: materials.slice(0, 5),
    recentResults: results.slice(0, 6),
  };
}
