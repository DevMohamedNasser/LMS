"use server";

import { getServerSession } from "next-auth";

import { NextOptions } from "@/app/api/auth/[...nextauth]/route";

import type {
  ActiveExam,
  DashboardData,
  ExamListItem,
  MaterialListItem,
  RawExam,
  RawMaterial,
  RawOption,
  RawQuestion,
  RawRef,
  StudentMaterial,
  SubmitAnswer,
  SubmitExamResult,
  SubmitWrongAnswer,
} from "./types";

type ApiEnvelope = {
  message?: string;
  data?: unknown;
};

type ApiRecord = Record<string, unknown>;

// const LIST_CACHE_TTL = 5 * 60 * 1000;

function asRecord(value: unknown): ApiRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as ApiRecord;
}

function apiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not configured.");
  }

  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function apiRequest(
  path: string,
  init: RequestInit = {},
): Promise<ApiEnvelope> {
  const session = await getServerSession(NextOptions);

  if (!session || session.user.role !== "student") {
    throw new Error("Please sign in with a student account.");
  }

  if (!session.accessToken) {
    throw new Error("Your session does not include an access token.");
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const responseData: unknown = await response.json().catch(() => ({}));
  const data = asRecord(responseData);

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : "The request could not be completed.";

    throw new Error(message);
  }

  return (data ?? {}) as ApiEnvelope;
}

function refValue(value: RawRef): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  if (value.text) return String(value.text);

  return null;
}

function parseWrongAnswers(value: unknown): SubmitWrongAnswer[] | null {
  if (!Array.isArray(value)) return null;

  const list: SubmitWrongAnswer[] = [];

  for (const rawItem of value) {
    const item = asRecord(rawItem);
    if (!item) continue;

    const questionId = refValue(item.questionId as RawRef);
    const answer = refValue(item.answer as RawRef);

    if (questionId && answer) {
      list.push({ questionId, answer });
    }
  }

  return list;
}

function normalizeExamResponse(
  response: ApiEnvelope,
  fallbackId: string,
): ActiveExam {
  const data = asRecord(response.data) ?? {};
  const examRecord = asRecord(data.exam) ?? data;
  const exam = examRecord as unknown as RawExam;

  const rawQuestions = Array.isArray(exam.questions)
    ? exam.questions
    : Array.isArray(data.questions)
      ? (data.questions as RawQuestion[])
      : [];

  const resultRecord = asRecord(data.result);

  // بعض الـ responses ترجع wrongAns على مستوى الامتحان كله.
  const examLevelWrong = parseWrongAnswers(
    data.wrongAns ?? resultRecord?.wrongAns ?? exam.wrongAns,
  );

  const rawScore = data.score ?? resultRecord?.score;

  return {
    id: String(exam._id ?? fallbackId),
    title: String(exam.title ?? "Exam"),
    durationMin: typeof exam.durationMin === "number" ? exam.durationMin : 0,
    score: typeof rawScore === "number" ? rawScore : null,

    questions: rawQuestions.map((rawQuestion) => {
      const question = rawQuestion as RawQuestion;

      const options = Array.isArray(question.options)
        ? question.options.map((rawOption: RawOption) => ({
            id: String(rawOption._id),
            text: String(rawOption.text ?? ""),
          }))
        : [];

      // يحوّل id أو نص الاختيار إلى option id.
      const toOptionId = (value: RawRef): string | null => {
        const raw = refValue(value);
        if (!raw) return null;

        const matchingOption = options.find(
          (option) => option.id === raw || option.text === raw,
        );

        return matchingOption ? matchingOption.id : raw;
      };

      const questionId = String(question._id);

      const examLevelAnswer = examLevelWrong?.find(
        (item) => item.questionId === questionId,
      )?.answer;

      return {
        id: questionId,
        question: String(question.question ?? ""),
        options,
        correctAns: toOptionId(question.correctAns),
        wrongAns: toOptionId(question.wrongAns) ?? toOptionId(examLevelAnswer),
      };
    }),
  };
}

export async function loadStudentDashboardData(): Promise<DashboardData> {
  const [examResponse, materialResponse] = await Promise.all([
    apiRequest("exam/list-exams"),
    apiRequest("material/list-all"),
  ]);

  const examData = asRecord(examResponse.data) ?? {};
  const rawExams = examData.examsTitles ?? examData.exams;
  const rawMaterials = materialResponse.data;

  const exams: ExamListItem[] = Array.isArray(rawExams)
    ? (rawExams as RawExam[]).map((exam) => ({
        id: String(exam._id),
        title: String(exam.title ?? "Untitled exam"),
        grade: exam.grade ? String(exam.grade) : null,
        durationMin:
          typeof exam.durationMin === "number" ? exam.durationMin : null,
      }))
    : [];

  const materials: MaterialListItem[] = Array.isArray(rawMaterials)
    ? (rawMaterials as RawMaterial[]).map((material) => ({
        id: String(material._id),
        title: String(material.title ?? "Untitled material"),
        content: String(material.content ?? ""),
        grade:
          material.grade === null || material.grade === undefined
            ? null
            : String(material.grade),
      }))
    : [];

  return { exams, materials };
}

export async function startStudentExam(examId: string): Promise<ActiveExam> {
  const response = await apiRequest(`exam/${encodeURIComponent(examId)}`);

  return normalizeExamResponse(response, examId);
}

export async function submitStudentExam(
  examId: string,
  answers: SubmitAnswer[],
): Promise<SubmitExamResult> {
  const submitResponse = await apiRequest(
    `exam/submit/${encodeURIComponent(examId)}`,
    {
      method: "POST",
      body: JSON.stringify({ answers }),
    },
  );

  const responseData = asRecord(submitResponse.data) ?? {};
  const submittedResult = asRecord(responseData.result) ?? responseData;

  let review: ActiveExam | null = null;

  try {
    // بعد التسليم، هذا الطلب يرجع تفاصيل المراجعة حسب الـ API.
    const reviewResponse = await apiRequest(
      `exam/${encodeURIComponent(examId)}`,
    );

    review = normalizeExamResponse(reviewResponse, examId);
  } catch {
    // التسليم نفسه نجح؛ نستخدم بيانات submit إن تعذر تحميل المراجعة.
  }

  const scoreValue = submittedResult.score ?? review?.score;
  const parsedScore = Number(scoreValue);

  const wrongAnswers = parseWrongAnswers(
    submittedResult.wrongAns ?? responseData.wrongAns,
  );

  return {
    score:
      scoreValue !== null &&
      scoreValue !== undefined &&
      Number.isFinite(parsedScore)
        ? parsedScore
        : null,
    review,
    wrongAnswers,
  };
}

export async function getStudentMaterialUrl(
  materialId: string,
): Promise<StudentMaterial> {
  const response = await apiRequest(
    `material/${encodeURIComponent(materialId)}`,
  );

  const data = asRecord(response.data) ?? {};
  const materialItems = data.material;
  const firstItem = Array.isArray(materialItems) ? materialItems[0] : null;

  const firstItemRecord = asRecord(firstItem);
  const url = typeof firstItem === "string" ? firstItem : firstItemRecord?.url;

  if (typeof url !== "string" || !url) {
    throw new Error("This material does not have a viewable URL.");
  }

  return {
    title: String(data.title ?? "Study material"),
    url,
  };
}
