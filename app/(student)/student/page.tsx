import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { NextOptions } from "@/app/api/auth/[...nextauth]/route";

export default function StudentPage() {
  return (
    <Suspense fallback={<p>Loading your account...</p>}>
      <StudentContent />
    </Suspense>
  );
}

async function StudentContent() {
  await connection();

  const session = await getServerSession(NextOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "student") {
    redirect("/admin");
  }

  return (
    <p>
      Welcome, {session.user.email} {session.user.role}
    </p>
  );
}