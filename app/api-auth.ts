// Server-only helper. Do NOT import it from a "use client" file.
// It is a plain module (no "use server"), so it can export anything.
import { getServerSession } from "next-auth";
import { NextOptions } from "@/app/api/auth/[...nextauth]/route";

export type ApiRole = "admin" | "student";

// The role saved in the session comes from the login button
// ("Login as Student" -> "student", "Login as Admin" -> "admin").
// The backend expects:  Authorization: USER <accessToken>
//                  or:  Authorization: ADMIN <accessToken>
const PREFIX: Record<ApiRole, string> = {
  student: "USER",
  admin: "ADMIN",
};

// Header for the signed-in user, whatever their role is.
export async function getSessionAuthHeader(): Promise<string> {
  const session = await getServerSession(NextOptions);

  if (!session) {
    throw new Error("Please sign in first.");
  }

  if (!session.accessToken) {
    throw new Error("Your session does not include an access token.");
  }

  return `${PREFIX[session.user.role]} ${session.accessToken}`;
}

// Header for an endpoint that only one role may call.
export async function getAuthHeader(expected: ApiRole): Promise<string> {
  const session = await getServerSession(NextOptions);

  if (!session) {
    throw new Error("Please sign in first.");
  }

  if (session.user.role !== expected) {
    throw new Error(
      expected === "admin"
        ? "Please sign in with an admin account."
        : "Please sign in with a student account.",
    );
  }

  if (!session.accessToken) {
    throw new Error("Your session does not include an access token.");
  }

  return `${PREFIX[expected]} ${session.accessToken}`;
}
