import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { NextOptions } from "@/app/api/auth/[...nextauth]/route";

export default function AdminPage() {
  return (
    <Suspense fallback={<p>Loading your account...</p>}>
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  await connection();

  const session = await getServerSession(NextOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/student");
  }

  return (
    <p>
      Welcome, {session.user.email} {session.user.role}
    </p>
  );
}