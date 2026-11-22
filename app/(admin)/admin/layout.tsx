import { Suspense, type ReactNode } from "react";
import { getServerSession } from "next-auth";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { NextOptions } from "@/app/api/auth/[...nextauth]/route";
import AdminShell, { AdminShellSkeleton } from "./admin-shell";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}

async function AdminLayoutContent({
  children,
}: {
  children: ReactNode;
}) {
  await connection();

  const session = await getServerSession(NextOptions);

  if (!session) redirect("/login");

  if (String(session.user.role).toLowerCase() !== "admin") {
    redirect("/student");
  }

  return (
    <AdminShell
      admin={{
        adminId: session.user.id,
        adminName:
          session.user.name || session.user.email?.split("@")[0] || "Admin",
        adminEmail: session.user.email || "",
      }}
    >
      {children}
    </AdminShell>
  );
}