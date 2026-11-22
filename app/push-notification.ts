"use client";

import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseOptions,
} from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { enableNotifications } from "./notification-actions";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();

// A real VAPID public key is ~87 base64url characters and starts with "B".
// "G-XXXXXXXXXX" is the Analytics measurementId, not a VAPID key.
const VAPID_PATTERN = /^[A-Za-z0-9_-]{80,100}$/;

export type PushStatus =
  | "enabled"
  | "unsupported"
  | "not-configured"
  | "permission-denied"
  | "error";

const log = (message: string, ...details: unknown[]) =>
  console.info(`[push] ${message}`, ...details);

// The service worker cannot read process.env, so the config travels in the
// query string of its URL (see public/firebase-messaging-sw.js).
function serviceWorkerUrl(): string {
  const params = new URLSearchParams();

  Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (typeof value === "string") params.set(key, value);
  });

  return `/firebase-messaging-sw.js?${params.toString()}`;
}

function checkConfig(): boolean {
  const missing = Object.entries({
    NEXT_PUBLIC_FIREBASE_API_KEY: firebaseConfig.apiKey,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
    NEXT_PUBLIC_FIREBASE_APP_ID: firebaseConfig.appId,
    NEXT_PUBLIC_FIREBASE_VAPID_KEY: vapidKey,
  })
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    console.error(`[push] Missing env variables: ${missing.join(", ")}`);
    return false;
  }

  if (!vapidKey || !VAPID_PATTERN.test(vapidKey)) {
    console.error(
      "[push] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not a VAPID key. Use the " +
        "key pair from Firebase Console > Project settings > Cloud Messaging " +
        "> Web Push certificates (starts with 'B', ~87 characters), not the " +
        "measurementId ('G-...').",
    );
    return false;
  }

  return true;
}

async function getFcmToken(): Promise<string | PushStatus> {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !(await isSupported())
  ) {
    return "unsupported";
  }

  if (!checkConfig()) return "not-configured";

  log("Registering the service worker…");

  await navigator.serviceWorker.register(serviceWorkerUrl(), {
    scope: "/",
  });

  const registration = await navigator.serviceWorker.ready;

  if (!registration.active) {
    throw new Error("Firebase Service Worker is not active.");
  }

  log("Service Worker is active.");

  const app =
    getApps().find((item) => item.name === "[DEFAULT]") ??
    initializeApp(firebaseConfig);

  log("Requesting the FCM token…");

  const token = await getToken(getMessaging(app), {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  return token || "error";
}

// Call it right after a successful login. It never throws: if the browser
// does not support push, or the user says "Block", login is not affected.
export async function enablePushNotifications(): Promise<PushStatus> {
  try {
    const tokenOrStatus = await getFcmToken();

    if (
      tokenOrStatus === "unsupported" ||
      tokenOrStatus === "not-configured" ||
      tokenOrStatus === "permission-denied" ||
      tokenOrStatus === "error"
    ) {
      return tokenOrStatus;
    }

    log(`Token received (${tokenOrStatus.length} chars), saving it…`);
    const result = await enableNotifications(tokenOrStatus);

    if (!result.ok) {
      console.error("[push] Backend rejected the token:", result.error);
      return "error";
    }

    log("Notifications enabled.");
    return "enabled";
  } catch (error) {
    console.error("[push] Could not enable notifications:", {
    error,
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : "Unknown",
    stack: error instanceof Error ? error.stack : undefined,
  });

  return "error";
  }
}
