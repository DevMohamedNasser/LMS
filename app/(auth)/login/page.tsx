"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { signIn, type SignInResponse } from "next-auth/react";

import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { enablePushNotifications } from "@/app/push-notification";

/* ------------------------- Google Identity Services ------------------------ */

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleButtonConfig = {
  type: "icon";
  theme: "outline" | "filled_blue" | "filled_black";
  size: "large" | "medium" | "small";
  shape: "square" | "circle";
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            ux_mode?: "popup" | "redirect";
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: GoogleButtonConfig,
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/* ---------------------------------- form ----------------------------------- */

const formSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof formSchema>;
type UserRole = "admin" | "student";
type Pending = "password" | "google" | null;

const ROLES: Array<{ value: UserRole; label: string }> = [
  { value: "student", label: "Student" },
  { value: "admin", label: "Admin" },
];

export default function Login() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [googleReady, setGoogleReady] = useState(false);

  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  // The Google callback is registered once, so it reads the latest role and
  // handler through refs instead of capturing stale values.
  const roleRef = useRef<UserRole>(role);
  const credentialHandlerRef = useRef<
    (response: GoogleCredentialResponse) => Promise<void>
  >(async () => {});

  const isSigningIn = pending !== null;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Shared by every sign-in method.
  function finishLogin(
    selectedRole: UserRole,
    result: SignInResponse | undefined,
  ) {
    if (!result?.ok) {
      toast.error(result?.error || "Sign in failed. Please try again.");
      return;
    }

    toast.success("Login successful!");

    // Register this device for push notifications. It runs in the background:
    // the browser permission prompt must never block the login.
    void enablePushNotifications();

    router.replace(selectedRole === "admin" ? "/admin" : "/student");
    router.refresh();
  }

  async function handlePasswordLogin() {
    const isValid = await form.trigger();
    if (!isValid) return;

    setPending("password");

    try {
      const { email, password } = form.getValues();

      const result = await signIn("credentials", {
        email,
        password,
        isAdmin: role === "admin" ? "true" : "false",
        redirect: false,
      });

      finishLogin(role, result);
    } catch (error) {
      console.error("Login Error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to connect to the server.",
      );
    } finally {
      setPending(null);
    }
  }

  async function handleGoogleCredential(response: GoogleCredentialResponse) {
    const selectedRole = roleRef.current;

    if (!response.credential) {
      toast.error("Google did not return a sign-in token.");
      return;
    }

    setPending("google");

    try {
      const result = await signIn("google-id-token", {
        idToken: response.credential,
        isAdmin: selectedRole === "admin" ? "true" : "false",
        redirect: false,
      });

      finishLogin(selectedRole, result);
    } catch (error) {
      console.error("Google Login Error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to connect to the server.",
      );
    } finally {
      setPending(null);
    }
  }

  roleRef.current = role;
  credentialHandlerRef.current = handleGoogleCredential;

  // Render the Google icon button once the script is ready.
  useEffect(() => {
    if (!googleReady || !GOOGLE_CLIENT_ID) return;

    const google = window.google;
    const element = googleButtonRef.current;
    if (!google || !element) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => void credentialHandlerRef.current(response),
      ux_mode: "popup",
      auto_select: false,
    });

    element.innerHTML = "";
    google.accounts.id.renderButton(element, {
      type: "icon",
      theme: "filled_black",
      size: "large",
      shape: "circle",
    });
  }, [googleReady]);

  return (
    <main className="flex min-h-screen flex-col bg-slate-900">
      {GOOGLE_CLIENT_ID && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onReady={() => setGoogleReady(true)}
        />
      )}

      <header className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <BookOpen className="size-5" />
          </div>
          <span className="text-lg font-bold text-slate-100">EduCore</span>
        </Link>

        <Link
          href="/signup"
          className="flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
        >
          Create account
          <ArrowRight className="size-4" />
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <section className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-xl sm:p-9">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400">
                <GraduationCap className="size-8" />
              </div>

              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-800/80 bg-emerald-950/60 px-3 py-1 text-xs font-medium text-emerald-400">
                <ShieldCheck className="size-3.5" />
                Welcome Back
              </span>

              <h1 className="mt-3 text-2xl font-bold text-slate-100">
                Sign in to EduCore
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Choose your account type, then sign in.
              </p>
            </div>

            {/* One switch decides the role for email AND Google sign-in. */}
            <div
              role="radiogroup"
              aria-label="Sign in as"
              className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-slate-700 bg-slate-900 p-1"
            >
              {ROLES.map((item) => {
                const selected = role === item.value;
                const Icon = item.value === "admin" ? ShieldCheck : GraduationCap;

                return (
                  <button
                    key={item.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={isSigningIn}
                    onClick={() => setRole(item.value)}
                    className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed ${
                      selected
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handlePasswordLogin();
              }}
            >
              <FieldGroup className="gap-5">
                <Field data-invalid={!!form.formState.errors.email}>
                  <FieldLabel className="text-sm font-semibold text-slate-300">
                    Email Address
                  </FieldLabel>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      {...form.register("email")}
                      type="email"
                      placeholder="example@gmail.com"
                      autoComplete="email"
                      className="h-12 rounded-xl border-slate-700 bg-slate-900 pl-10 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-invalid={!!form.formState.errors.email}
                    />
                  </div>

                  {form.formState.errors.email && (
                    <FieldError errors={[form.formState.errors.email]} />
                  )}
                </Field>

                <Field data-invalid={!!form.formState.errors.password}>
                  <div className="flex items-center justify-between">
                    <FieldLabel className="text-sm font-semibold text-slate-300">
                      Password
                    </FieldLabel>

                    <Link
                      href="/forget-password"
                      className="text-xs font-medium text-blue-400 transition hover:text-blue-300 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      {...form.register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="h-12 rounded-xl border-slate-700 bg-slate-900 pl-10 pr-11 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-invalid={!!form.formState.errors.password}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                  </div>

                  {form.formState.errors.password && (
                    <FieldError errors={[form.formState.errors.password]} />
                  )}
                </Field>
              </FieldGroup>

              <Button
                type="submit"
                size="lg"
                disabled={isSigningIn}
                className="mt-7 h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending === "password" ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in as {role === "admin" ? "Admin" : "Student"}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            {/* ------------------------------ Google ------------------------------ */}
            {GOOGLE_CLIENT_ID && (
              <div className="mt-7">
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-slate-700" />
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    or
                  </span>
                  <span className="h-px flex-1 bg-slate-700" />
                </div>

                <div className="mt-5 flex flex-col items-center gap-3">
                  <div
                    aria-busy={pending === "google"}
                    className={`relative flex size-11 items-center justify-center transition-opacity ${
                      isSigningIn ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    {!googleReady && (
                      <div className="absolute inset-0 animate-pulse rounded-full bg-slate-700" />
                    )}
                    {pending === "google" && (
                      <LoaderCircle className="absolute size-5 animate-spin text-white" />
                    )}
                    <div ref={googleButtonRef} />
                  </div>

                  <p className="text-center text-xs text-slate-400">
                    Continue with Google as{" "}
                    <span className="font-semibold text-slate-200">
                      {role === "admin" ? "Admin" : "Student"}
                    </span>
                    {role === "admin" && (
                      <span className="mt-1 block text-slate-500">
                        Existing admin accounts only
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            <p className="mt-7 text-center text-sm text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-blue-400 transition hover:text-blue-300 hover:underline"
              >
                Create account
              </Link>
            </p>

            <div className="mt-7 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/50 p-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-950/60 text-emerald-400">
                <ShieldCheck className="size-5" />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-300">
                  Secure Authentication
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Your account credentials are protected.
                </p>
              </div>
            </div>
          </section>

          <p className="mt-6 text-center text-xs text-slate-500">
            © 2026 EduCore. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
