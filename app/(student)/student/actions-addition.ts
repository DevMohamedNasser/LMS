"use server";

import { getServerSession } from "next-auth";

import { NextOptions } from "@/app/api/auth/[...nextauth]/route";
import type { ActionResult, ChangePasswordInput } from "./extra-types";

export async function changeStudentPassword(
  input: ChangePasswordInput,
): Promise<ActionResult<{ message: string }>> {
  const session = await getServerSession(NextOptions);

  if (!session || session.user.role !== "student") {
    return {
      ok: false,
      error: "Please sign in with a student account.",
    };
  }

  if (!session.accessToken) {
    return {
      ok: false,
      error: "Your session does not include an access token.",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    return {
      ok: false,
      error: "NEXT_PUBLIC_BASE_URL is not configured.",
    };
  }

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/+$/, "")}/auth/change-password`,
      {
        method: "PATCH",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      },
    );

    const data: unknown = await response.json().catch(() => ({}));

    const apiMessage =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : undefined;

    if (!response.ok) {
      return {
        ok: false,
        error: apiMessage ?? "Unable to change password.",
      };
    }

    return {
      ok: true,
      data: {
        message: apiMessage ?? "Password changed successfully.",
      },
    };
  } catch {
    return {
      ok: false,
      error: "Unable to reach the server.",
    };
  }
}
