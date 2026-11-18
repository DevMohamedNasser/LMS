"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const grades = [
  { value: 1, label: "1st Primary" },
  { value: 2, label: "2nd Primary" },
  { value: 3, label: "3rd Primary" },
  { value: 4, label: "4th Primary" },
  { value: 5, label: "5th Primary" },
  { value: 6, label: "6th Primary" },
  { value: 7, label: "1st Prep" },
  // { value: 8, label: "2nd Prep" },
];

const formSchema = z
  .object({
    username: z
      .string()
      .min(2, "Name must be at least 2 characters.")
      .max(50, { error: "username must be at most 50 chars long" }),
    email: z.email("Enter a valid email address."),
    phone: z
      .string()
      .regex(/^01[0125][0-9]{8}$/, "Enter a valid Egyptian phone number."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(6, "Please confirm your password."),
    grade: z.number().int().min(1, "Please select your grade.").max(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof formSchema>;

const imageUrl =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAK9aqGHOKkKZDOqB55kAZsev2Eyk0GTlJ0p1HDGgGMA&s=10";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  const score = checks.filter(Boolean).length;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5">
        {checks.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full ${
              index < score ? "bg-emerald-500" : "bg-slate-700"
            }`}
          />
        ))}
      </div>
      {password && (
        <p className="text-xs text-slate-400">
          Password strength:{" "}
          <span className="font-medium text-emerald-400">{labels[score]}</span>
        </p>
      )}
    </div>
  );
}

export default function Signup() {
  const Router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      grade: 0,
    },
  });

  const password = form.watch("password");

  async function onSubmit(payload: SignupFormValues) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}auth/signup`,
        {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Signup failed");
        return;
      }

      toast.success(data.message);
      Router.push("/confirm-email");
    } catch (error) {
      console.error("Signup Error:", error);

      toast.error(
        (error as Error).message || "Unable to connect to the server",
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Top App Bar */}
      <header className="mx-auto flex h-14 max-w-7xl items-center justify-between bg-slate-900/90 px-5 backdrop-blur">
        <Link href="/login" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <BookOpen className="size-5" />
          </div>
          <span className="text-lg font-bold text-slate-100">EduCore</span>
        </Link>

        <Link
          href="/login"
          className="flex size-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 transition hover:bg-slate-800"
          aria-label="Back to login"
        >
          <ArrowLeft className="size-4" />
        </Link>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-5 py-6">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
          {/* Form Section */}
          <section className="order-1 p-6 sm:p-8 lg:order-1">
            <div className="mb-6 space-y-3">
              <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-emerald-800/80 bg-emerald-950/60 px-2.5 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                Academic Year 2026/2027
              </span>

              <h1 className="text-2xl font-bold leading-tight text-slate-100">
                Create your EduCore Account
              </h1>

              <p className="text-xs leading-relaxed text-slate-400 md:text-sm">
                Join EduCore and start your learning journey today.
              </p>
            </div>

            {/* Google Signup */}
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl border-slate-700 bg-slate-800 text-sm font-medium text-slate-200 hover:bg-slate-700"
              onClick={() => toast.info("Google sign-up is not connected yet.")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                width="24"
                height="24"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.43 13.72 17.74 9.5 24 9.5Z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.28 5.65c4.25-3.92 6.7-9.7 6.7-17.3Z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.58A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.78-4.58l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.88.93 7.55 2.56 10.78l7.97-6.2Z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.28-5.65c-2.02 1.35-4.6 2.15-8.62 2.15-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.2C6.51 42.62 14.62 48 24 48Z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-700" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Or sign up with email
              </span>
              <div className="h-px flex-1 bg-slate-700" />
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup className="gap-4">
                {/* Username */}
                <Controller
                  name="username"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="text-xs font-semibold text-slate-300">
                        Full Name
                      </FieldLabel>
                      <div className="relative">
                        <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          {...field}
                          placeholder="Mohamed Nasser"
                          autoComplete="name"
                          className="h-11 rounded-xl border-slate-700 bg-slate-900 pl-10 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                          aria-invalid={fieldState.invalid}
                        />
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Email */}
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="text-xs font-semibold text-slate-300">
                        Email Address
                      </FieldLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="example@gmail.com"
                          autoComplete="email"
                          className="h-11 rounded-xl border-slate-700 bg-slate-900 pl-10 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                          aria-invalid={fieldState.invalid}
                        />
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Phone */}
                <Controller
                  name="phone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="text-xs font-semibold text-slate-300">
                        Phone Number
                      </FieldLabel>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          {...field}
                          type="tel"
                          placeholder="01012345678"
                          autoComplete="tel"
                          className="h-11 rounded-xl border-slate-700 bg-slate-900 pl-10 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                          aria-invalid={fieldState.invalid}
                        />
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Grade */}
                <Controller
                  name="grade"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="text-xs font-semibold text-slate-300">
                        Academic Grade
                      </FieldLabel>

                      <div className="grid grid-cols-4 gap-2">
                        {grades.map((grade) => (
                          <button
                            key={grade.value}
                            type="button"
                            onClick={() => field.onChange(grade.value)}
                            className={`h-9 rounded-lg text-xs font-medium transition ${
                              field.value === grade.value
                                ? "bg-blue-600 font-semibold text-white shadow-sm"
                                : "border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {grade.label}
                          </button>
                        ))}
                      </div>

                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Password */}
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="text-xs font-semibold text-slate-300">
                        Password
                      </FieldLabel>
                      <div className="relative">
                        <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          autoComplete="new-password"
                          className="h-11 rounded-xl border-slate-700 bg-slate-900 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                          aria-invalid={fieldState.invalid}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <PasswordStrength password={password} />

                {/* Confirm Password */}
                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="text-xs font-semibold text-slate-300">
                        Confirm Password
                      </FieldLabel>
                      <div className="relative">
                        <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          className="h-11 rounded-xl border-slate-700 bg-slate-900 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                          aria-invalid={fieldState.invalid}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              <p className="mt-5 text-[11px] leading-normal text-slate-400">
                By creating an account, you agree to our{" "}
                <Link
                  href="/terms"
                  className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </p>

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="mt-5 h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Create Account
                <ArrowRight className="size-4" />
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-400 hover:text-blue-300 hover:underline"
              >
                Sign in
              </Link>
            </p>
            <p className="mt-3 text-center text-sm text-slate-400">
              Need to verify your email?{" "}
              <Link
                href="/confirm-email"
                className="font-semibold text-blue-400 transition hover:text-blue-300 hover:underline"
              >
                Confirm your email
              </Link>
            </p>

            {/* Security Badge */}
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/80 p-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-950/60 text-emerald-400">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-300">
                  Your information is secure
                </p>
                <p className="text-[11px] text-slate-400">
                  Your personal data is protected.
                </p>
              </div>
            </div>
          </section>

          {/* Image Section */}
          <section className="relative hidden min-h-48 overflow-hidden bg-slate-900 lg:order-2 lg:block lg:min-h-full">
            <Image
              src={imageUrl}
              alt="Students learning together"
              fill
              priority
              sizes="(min-width: 1024px) 48vw, 0px"
              className="object-fill"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-900/20 to-slate-900/10" />

            <div className="relative flex h-full min-h-48 flex-col justify-between p-6 text-white sm:p-8 lg:min-h-212.5">
              <div className="hidden items-center gap-2 lg:flex">
                <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <GraduationCap className="size-5" />
                </div>
                <span className="text-lg font-bold">EduCore</span>
              </div>

              <div className="mt-auto max-w-sm">
                <span className="mb-3 inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                  Learn Without Limits
                </span>
                <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
                  Your Future Starts With Learning.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/80">
                  Discover new knowledge, improve your skills, and achieve your
                  academic goals with EduCore.
                </p>
              </div>
            </div>
          </section>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          © 2026 EduCore. All rights reserved.
        </p>
      </div>
    </main>
  );
}
