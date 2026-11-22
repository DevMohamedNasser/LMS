"use server";

import { getSessionAuthHeader } from "./api-auth";


type NotificationResult = { ok: true } | { ok: false; error: string };

type EnableNotificationsResponse = {
  message?: string;
};

// POST /auth/enable-notifications  { deviceToken }
// Works for students and admins: the header prefix (USER / ADMIN) comes from
// the role stored in the session at login.
export async function enableNotifications(
  deviceToken: string,
): Promise<NotificationResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!baseUrl) {
      return { ok: false, error: "API base URL is not configured." };
    }

    if (!deviceToken) {
      return { ok: false, error: "Missing device token." };
    }

    const authorization = await getSessionAuthHeader();

    const response = await fetch(
      new URL(
        "auth/enable-notifications",
        baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
      ),
      {
        method: "POST",
        cache: "no-store",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceToken }),
      },
    );

    if (!response.ok) {
      const data = (await response
        .json()
        .catch(() => ({}))) as EnableNotificationsResponse;

      return {
        ok: false,
        error: data.message || "Unable to enable notifications.",
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to enable notifications.",
    };
  }
}
