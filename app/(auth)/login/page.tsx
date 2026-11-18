"use client";

import { useState } from "react";
import Link from "next/link";
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
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { signIn } from "next-auth/react";

import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof formSchema>;
type UserRole = "admin" | "student";

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function handleLogin(role: UserRole) {
    const isValid = await form.trigger();
    if (!isValid) return;

    setIsSigningIn(true);

    try {
      const { email, password } = form.getValues();

      const result = await signIn("credentials", {
        email,
        password,
        isAdmin: role === "admin" ? "true" : "false",
        redirect: false,
      });

      if (!result?.ok) {
        toast.error(result?.error || "Invalid email or password.");
        return;
      }

      toast.success("Login successful!");
      router.replace(role === "admin" ? "/admin" : "/student");
      router.refresh();
    } catch (error) {
      console.error("Login Error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to connect to the server.",
      );
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-900">
      <header className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5">
        <Link href="/login" className="flex items-center gap-2">
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
            <div className="mb-8 text-center">
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
                Enter your credentials to access your account.
              </p>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleLogin("student");
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
                variant="default"
                size="lg"
                disabled={isSigningIn}
                className="mt-7 h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningIn ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Login as Student
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  disabled={isSigningIn}
                  onClick={() => void handleLogin("admin")}
                  className="text-sm font-semibold text-blue-400 transition hover:text-blue-300 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Login as Admin
                </button>
              </div>
            </form>

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
