"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Mail,
  RotateCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";

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
  otp: z
    .string()
    .trim()
    .length(6, "Verification code must be 6 digits.")
    .regex(/^\d{6}$/, "Verification code must contain only digits."),
});

type ConfirmEmailFormValues = z.infer<typeof formSchema>;

export default function ConfirmEmail() {
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);

  const form = useForm<ConfirmEmailFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      otp: "",
    },
  });

  async function onSubmit(payload: ConfirmEmailFormValues) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      if (!baseUrl) {
        toast.error("API base URL is not configured.");
        return;
      }

      const res = await fetch(`${baseUrl}auth/confirm-email`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.message || "Unable to confirm your email.");
        return;
      }

      toast.success(data.message || "Email confirmed successfully.");
      router.push("/login");
    } catch (error) {
      console.error("Confirm Email Error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to connect to the server.",
      );
    }
  }

  async function resendOtp() {
    const emailIsValid = await form.trigger("email");

    if (!emailIsValid) {
      toast.error("Enter a valid email address first.");
      return;
    }


    setIsResending(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}auth/resend-otp`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.getValues("email"),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.message || "Unable to resend the verification code.");
        return;
      }

      toast.success(data.message || "A new verification code was sent.");
    } catch (error) {
      console.error("Resend OTP Error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to connect to the server.",
      );
    } finally {
      setIsResending(false);
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
          href="/login"
          className="flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back to Login
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <section className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-xl sm:p-9">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400">
                <GraduationCap className="size-8" />
              </div>

              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-800/80 bg-blue-950/60 px-3 py-1 text-xs font-medium text-blue-400">
                Email Verification
              </span>

              <h1 className="mt-3 text-2xl font-bold text-slate-100">
                Confirm Your Email
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Enter your registered email address and the 6-digit code we sent
                you.
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)}>
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

                <Field data-invalid={!!form.formState.errors.otp}>
                  <FieldLabel className="text-sm font-semibold text-slate-300">
                    Verification Code
                  </FieldLabel>

                  <Input
                    {...form.register("otp")}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="Enter your 6-digit code"
                    className="h-12 rounded-xl border-slate-700 bg-slate-900 text-center text-lg tracking-[0.4em] text-slate-100 placeholder:text-sm placeholder:tracking-normal placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-invalid={!!form.formState.errors.otp}
                  />

                  {form.formState.errors.otp && (
                    <FieldError errors={[form.formState.errors.otp]} />
                  )}
                </Field>
              </FieldGroup>

              <Button
                type="submit"
                variant="default"
                size="lg"
                disabled={form.formState.isSubmitting}
                className="mt-7 h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Confirming...
                  </>
                ) : (
                  <>
                    Confirm Email
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            <Button
              type="button"
              variant="ghost"
              disabled={isResending}
              onClick={resendOtp}
              className="mt-3 w-full text-sm font-semibold text-blue-400 hover:bg-slate-700 hover:text-blue-300 disabled:opacity-60"
            >
              <RotateCw
                className={`size-4 ${isResending ? "animate-spin" : ""}`}
              />
              {isResending ? "Sending code..." : "Resend OTP"}
            </Button>

            <p className="mt-7 text-center text-sm text-slate-400">
              Already confirmed?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-400 transition hover:text-blue-300 hover:underline"
              >
                Sign in
              </Link>
            </p>

            <div className="mt-7 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/50 p-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-950/60 text-emerald-400">
                <ShieldCheck className="size-5" />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-300">
                  Secure Email Verification
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Your code verifies ownership of your email address.
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
