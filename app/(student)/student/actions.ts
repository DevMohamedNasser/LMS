import { getServerSession } from "next-auth";
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
  RawWrongAnswer,
  StudentMaterial,
  SubmitAnswer,
  SubmitExamResult,
  SubmitWrongAnswer,
} from "./types";
import type { ActionResult, ChangePasswordInput } from "./extra-types";
import { NextOptions } from "@/app/api/auth/[...nextauth]/route";

// شكل الـ response العام من الـ backend
type ApiEnvelope = {
  message?: string;
  data?: any;
};

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

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const data: ApiEnvelope = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "The request could not be completed.");
  }

  return data;
}

// string / number / { _id | id | text } -> string | null
function refValue(value: RawRef): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  if (value.text) return String(value.text);
  return null;
}

// [{ questionId, answer }] -> typed list, or null when the API sent no list
function parseWrongAnswers(value: unknown): SubmitWrongAnswer[] | null {
  if (!Array.isArray(value)) return null;

  const list: SubmitWrongAnswer[] = [];

  for (const item of value as RawWrongAnswer[]) {
    const questionId = refValue(item?.questionId);
    const answer = refValue(item?.answer);
    if (questionId && answer) list.push({ questionId, answer });
  }

  return list;
}

function normalizeExamResponse(
  response: ApiEnvelope,
  fallbackId: string,
): ActiveExam {
  const data = response?.data ?? {};
  const exam: RawExam = data.exam ?? data;
  const questions: RawQuestion[] = exam.questions ?? data.questions ?? [];

  // Some responses send the student's wrong answers once, at exam level:
  //   wrongAns: [{ questionId, answer }]
  const examLevelWrong = parseWrongAnswers(
    data.wrongAns ?? data.result?.wrongAns ?? exam.wrongAns,
  );

  return {
    id: String(exam._id ?? fallbackId),
    title: String(exam.title ?? "Exam"),
    durationMin: typeof exam.durationMin === "number" ? exam.durationMin : 0,
    score: typeof data.score === "number" ? data.score : null,
    questions: Array.isArray(questions)
      ? questions.map((question) => {
          const options = Array.isArray(question.options)
            ? question.options.map((option: RawOption) => ({
                id: String(option._id),
                text: String(option.text ?? ""),
              }))
            : [];

          // أي قيمة راجعة من الـ API (id أو text) تتحول لـ option id
          const toOptionId = (value: RawRef): string | null => {
            const raw = refValue(value);
            if (!raw) return null;
            const match = options.find(
              (option) => option.id === raw || option.text === raw,
            );
            return match ? match.id : raw;
          };

          const questionId = String(question._id);
          const examLevelAnswer = examLevelWrong?.find(
            (item) => item.questionId === questionId,
          )?.answer;

          return {
            id: questionId,
            question: String(question.question ?? ""),
            correctAns: toOptionId(question.correctAns),
            wrongAns:
              toOptionId(question.wrongAns) ??
              toOptionId(examLevelAnswer ?? null),
            options,
          };
        })
      : [],
  };
}

export async function loadStudentDashboardData(): Promise<DashboardData> {
  const [examResponse, materialResponse] = await Promise.all([
    apiRequest("exam/list-exams"),
    apiRequest("material/list-all"),
  ]);

  const rawExams: RawExam[] =
    examResponse?.data?.examsTitles ?? examResponse?.data?.exams ?? [];
  const rawMaterials: RawMaterial[] = materialResponse?.data ?? [];

  const exams: ExamListItem[] = Array.isArray(rawExams)
    ? rawExams.map((exam) => ({
        id: String(exam._id),
        title: String(exam.title ?? "Untitled exam"),
        grade: exam.grade ? String(exam.grade) : null,
        durationMin:
          typeof exam.durationMin === "number" ? exam.durationMin : null,
      }))
    : [];

  const materials: MaterialListItem[] = Array.isArray(rawMaterials)
    ? rawMaterials.map((material) => ({
        id: String(material._id),
        title: String(material.title ?? "Untitled material"),
        content: String(material.content ?? ""),
        grade: material.grade ? String(material.grade) : null,
      }))
    : [];

  return { exams, materials };
}

// أول GET  -> يبدأ الامتحان (أسئلة فقط)
// تاني GET -> يرجّع الدرجة + اختيارات الطالب + الإجابات الصح
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

  const submittedResult =
    submitResponse?.data?.result ?? submitResponse?.data ?? {};

  let review: ActiveExam | null = null;

  try {
    review = normalizeExamResponse(
      await apiRequest(`exam/${encodeURIComponent(examId)}`),
      examId,
    );
  } catch {
    // التسليم نجح، والـ client هيعيد جلب المراجعة عند الفتح الجاي
  }

  const scoreValue = submittedResult.score ?? review?.score;
  const score = Number(scoreValue);

  return {
    score:
      scoreValue !== null && scoreValue !== undefined && Number.isFinite(score)
        ? score
        : null,
    review,
    wrongAnswers: parseWrongAnswers(submittedResult.wrongAns),
  };
}

export async function getStudentMaterialUrl(
  materialId: string,
): Promise<StudentMaterial> {
  const response = await apiRequest(
    `material/${encodeURIComponent(materialId)}`,
  );

  const items = response?.data?.material;
  const firstItem = Array.isArray(items) ? items[0] : null;
  const url: unknown =
    typeof firstItem === "string" ? firstItem : firstItem?.url;

  if (typeof url !== "string" || !url) {
    throw new Error("This material does not have a viewable URL.");
  }

  return {
    title: String(response?.data?.title ?? "Study material"),
    url,
  };
}

export async function changeStudentPassword(
  input: ChangePasswordInput,
): Promise<ActionResult<null>> {
  try {
    await apiRequest("auth/reset-password", {
      method: "PATCH",
      body: JSON.stringify(input),
    });

    return { ok: true, data: null };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to update the password.",
    };
  }
}
