import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import ChatClient, { ChatPageSkeleton } from "./chat-client";
import { NextOptions } from "@/app/api/auth/[...nextauth]/route";

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageSkeleton />}>
      <ChatPageContent />
    </Suspense>
  );
}

async function ChatPageContent() {
  await connection();

  const session = await getServerSession(NextOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "student") {
    redirect("/admin");
  }

  if (!session.accessToken) {
    redirect("/login");
  }

  return (
    <ChatClient
      accessToken={session.accessToken}
      userId={session.user.id}
      userName={session.user.name || session.user.email || "Student"}
    />
  );
}
