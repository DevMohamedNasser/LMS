import { Suspense, type ReactNode } from "react";
import { getServerSession } from "next-auth";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import StudentShell, { StudentShellSkeleton } from "./student-shell";
import { NextOptions } from "@/app/api/auth/[...nextauth]/route";

export type StudentSession = {
  id: string;
  name: string;
  email: string;
};

type FrameProps = {
  render: (student: StudentSession) => ReactNode;
};

export default function StudentFrame({ render }: FrameProps) {
  return (
    <Suspense fallback={<StudentShellSkeleton />}>
      <FrameContent render={render} />
    </Suspense>
  );
}

async function FrameContent({ render }: FrameProps) {
  await connection();

  const session = await getServerSession(NextOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "student") redirect("/admin");

  const student: StudentSession = {
    id: session.user.id,
    name: session.user.name || session.user.email?.split("@")[0] || "Student",
    email: session.user.email || "",
  };

  return (
    <StudentShell studentName={student.name} studentEmail={student.email}>
      {render(student)}
    </StudentShell>
  );
}
