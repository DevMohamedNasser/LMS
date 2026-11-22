import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  KeyRound,
  LogIn,
  MessageCircle,
  PlayCircle,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "EduCore | Learn, practice and grow together",
  description:
    "EduCore is a learning platform for students: watch lessons, follow assignments, chat with your group and take exams.",
};

type Service = {
  title: string;
  description: string;
  points: string[];
  icon: LucideIcon;
  iconClass: string;
};

const services: Service[] = [
  {
    title: "Watch your lessons",
    description:
      "Videos, PDFs and images shared by your teachers, organised for your grade and available any time.",
    points: ["Videos, PDFs and images", "Only what matches your grade", "Open on phone or desktop"],
    icon: PlayCircle,
    iconClass: "bg-sky-950 text-sky-300",
  },
  {
    title: "Follow your assignments",
    description:
      "Keep track of what is due and what is done, so nothing slips through between classes.",
    points: ["Clear list of tasks", "Know what is pending", "Stay ahead of deadlines"],
    icon: ClipboardCheck,
    iconClass: "bg-amber-950 text-amber-300",
  },
  {
    title: "Group chat",
    description:
      "Talk with your classmates and teachers in your group, ask questions and share ideas in one place.",
    points: ["Chat with your own group", "Ask and answer quickly", "Everything in one conversation"],
    icon: MessageCircle,
    iconClass: "bg-violet-950 text-violet-300",
  },
  {
    title: "Exams and results",
    description:
      "Take timed exams online, get your score right after submitting and review every correct and wrong answer.",
    points: ["Timed online exams", "Instant score", "Review correct and wrong answers"],
    icon: ClipboardList,
    iconClass: "bg-emerald-950 text-emerald-300",
  },
];

const steps = [
  {
    title: "Create your account",
    description: "Sign up with your email and choose your grade in a minute.",
    icon: UserPlus,
  },
  {
    title: "Open your portal",
    description: "Find your lessons, assignments, chats and exams waiting for you.",
    icon: GraduationCap,
  },
  {
    title: "Learn and track progress",
    description: "Finish exams, see your scores and review your answers.",
    icon: Trophy,
  },
];

const quickLinks: Array<{
  label: string;
  hint: string;
  href: string;
  icon: LucideIcon;
}> = [
  { label: "Login", hint: "Student or admin", href: "/login", icon: LogIn },
  { label: "Create account", hint: "New to EduCore", href: "/signup", icon: UserPlus },
  { label: "Forgot password", hint: "Reset your access", href: "/forget-password", icon: KeyRound },
  { label: "Student portal", hint: "Go to your dashboard", href: "/student", icon: GraduationCap },
];

const primaryButton =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-base font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

const secondaryButton =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-700 px-6 text-base font-semibold text-slate-100 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="absolute -inset-6 rounded-[2rem] bg-indigo-600/20 blur-3xl" />

      <div className="relative space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
        {/* exam result */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-950 text-indigo-300">
                <ClipboardList className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Math Exam 1
                </p>
                <p className="text-xs text-slate-400">Submitted · 30 min</p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-800 bg-emerald-950 px-3 py-1 text-sm font-semibold text-emerald-300">
              92%
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-400 bg-emerald-600/25 px-3 py-2 text-sm text-emerald-50">
              <CheckCircle2 className="size-4 text-emerald-300" />
              4 — Correct answer
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-400">
              <span className="size-4 rounded-full border border-slate-600" />
              5
            </div>
          </div>
        </div>

        {/* lesson */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-950 text-sky-300">
            <PlayCircle className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-100">
              Unit 1 · Introduction video
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-2/3 rounded-full bg-sky-400" />
            </div>
          </div>
        </div>

        {/* chat */}
        <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Users className="size-4" />
            Grade 1 · Group chat
            <span className="ml-auto flex items-center gap-1 text-emerald-400">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              online
            </span>
          </div>
          <p className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-800 px-3 py-2 text-sm text-slate-200">
            Did anyone finish the assignment?
          </p>
          <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-indigo-600 px-3 py-2 text-sm text-white">
            Yes, I will share my notes!
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-base text-slate-100">
      {/* ------------------------------- header ------------------------------- */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <GraduationCap className="size-5" />
            </span>
            <span className="text-lg font-bold text-white">EduCore</span>
          </Link>

          <nav
            aria-label="Main"
            className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex"
          >
            <a href="#services" className="transition hover:text-white">
              Services
            </a>
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
            <a href="#quick-links" className="transition hover:text-white">
              Quick links
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* -------------------------------- hero -------------------------------- */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(79,70,229,0.28),transparent)]"
            aria-hidden="true"
          />

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 md:py-24 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-800 bg-indigo-950 px-4 py-1.5 text-sm font-medium text-indigo-200">
                <ShieldCheck className="size-4" />
                One place for your whole school day
              </span>

              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
                Learn, practice and grow{" "}
                <span className="text-indigo-400">together.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
                EduCore brings lessons, assignments, group chat and exams into
                one simple portal, so every student always knows what to study
                next and how they are doing.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className={primaryButton}>
                  Create your account
                  <ArrowRight className="size-5" />
                </Link>
                <Link href="/login" className={secondaryButton}>
                  <LogIn className="size-5" />
                  Login
                </Link>
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                {["Free to join", "Works on any device", "Made for your grade"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-400" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <HeroPreview />
          </div>
        </section>

        {/* ------------------------------ services ------------------------------ */}
        <section
          id="services"
          className="scroll-mt-20 border-t border-slate-800 bg-slate-900/40"
        >
          <div className="mx-auto max-w-7xl px-5 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
                What you get
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
                Everything a student needs
              </h2>
              <p className="mt-4 text-lg text-slate-300">
                Four tools that work together, built around your daily study
                routine.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2">
              {services.map((service) => {
                const Icon = service.icon;

                return (
                  <article
                    key={service.title}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-colors hover:border-indigo-700"
                  >
                    <span
                      className={`flex size-12 items-center justify-center rounded-xl ${service.iconClass}`}
                    >
                      <Icon className="size-6" />
                    </span>

                    <h3 className="mt-5 text-xl font-semibold text-white">
                      {service.title}
                    </h3>
                    <p className="mt-2 leading-relaxed text-slate-300">
                      {service.description}
                    </p>

                    <ul className="mt-5 space-y-2 text-sm text-slate-400">
                      {service.points.map((point) => (
                        <li key={point} className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------------------------- how it works ---------------------------- */}
        <section id="how-it-works" className="scroll-mt-20">
          <div className="mx-auto max-w-7xl px-5 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
                Start in three steps
              </h2>
            </div>

            <ol className="mt-14 grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <li
                    key={step.title}
                    className="relative rounded-2xl border border-slate-800 bg-slate-900 p-6"
                  >
                    <span className="absolute right-5 top-4 text-5xl font-bold text-slate-800">
                      {index + 1}
                    </span>
                    <span className="flex size-12 items-center justify-center rounded-xl bg-indigo-950 text-indigo-300">
                      <Icon className="size-6" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 leading-relaxed text-slate-300">
                      {step.description}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* ----------------------------- quick links ---------------------------- */}
        <section
          id="quick-links"
          className="scroll-mt-20 border-t border-slate-800 bg-slate-900/40"
        >
          <div className="mx-auto max-w-7xl px-5 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
                Quick links
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
                Jump straight in
              </h2>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-indigo-700 hover:bg-slate-900/80"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-950 text-indigo-300">
                      <Icon className="size-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-white">
                        {link.label}
                      </span>
                      <span className="block text-sm text-slate-400">
                        {link.hint}
                      </span>
                    </span>
                    <ArrowRight className="size-5 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-indigo-300" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* -------------------------------- cta --------------------------------- */}
        <section>
          <div className="mx-auto max-w-7xl px-5 py-20">
            <div className="flex flex-col items-center gap-6 rounded-3xl border border-indigo-800 bg-gradient-to-br from-indigo-950 to-slate-900 px-6 py-14 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                <BookOpen className="size-7" />
              </span>
              <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-white md:text-4xl">
                Ready to make studying easier?
              </h2>
              <p className="max-w-xl text-lg text-slate-300">
                Join EduCore today and keep your lessons, assignments, chats
                and exams in one place.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className={primaryButton}>
                  Create your account
                  <ArrowRight className="size-5" />
                </Link>
                <Link href="/login" className={secondaryButton}>
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------- footer -------------------------------- */}
      <footer className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-slate-400 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <GraduationCap className="size-4" />
            </span>
            <span className="font-semibold text-slate-200">EduCore</span>
          </div>

          <nav aria-label="Footer" className="flex items-center gap-6">
            <Link href="/login" className="transition hover:text-white">
              Login
            </Link>
            <Link href="/signup" className="transition hover:text-white">
              Sign up
            </Link>
            <Link
              href="/forget-password"
              className="transition hover:text-white"
            >
              Forgot password
            </Link>
          </nav>

          <p>© 2026 EduCore. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
