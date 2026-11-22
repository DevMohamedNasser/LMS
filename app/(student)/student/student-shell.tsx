"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type NavItem = { label: string; href: string; icon: LucideIcon };

const navigation: NavItem[] = [
  { label: "Dashboard", href: "/student", icon: LayoutDashboard },
  { label: "Exams", href: "/student/exams", icon: ClipboardList },
  { label: "Results", href: "/student/results", icon: Trophy },
  { label: "Materials", href: "/student/materials", icon: BookOpen },
  { label: "Chats", href: "/student/chat", icon: MessageCircle },
  { label: "Profile", href: "/student/profile", icon: UserRound },
];

const mobileNavigation: NavItem[] = [
  { label: "Home", href: "/student", icon: LayoutDashboard },
  { label: "Exams", href: "/student/exams", icon: ClipboardList },
  { label: "Materials", href: "/student/materials", icon: BookOpen },
  { label: "Chats", href: "/student/chat", icon: MessageCircle },
  { label: "Profile", href: "/student/profile", icon: UserRound },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/student") return pathname === "/student";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StudentShellSkeleton() {
  return (
    <div className="dark min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-900 p-5 md:block">
          <Skeleton className="mb-9 h-10 w-40 bg-slate-800" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full bg-slate-800" />
            ))}
          </div>
        </aside>
        <main className="flex-1 space-y-6 p-8">
          <Skeleton className="h-9 w-60 bg-slate-800" />
          <Skeleton className="h-72 bg-slate-800" />
        </main>
      </div>
    </div>
  );
}

export default function StudentShell({
  studentName,
  studentEmail,
  children,
}: {
  studentName: string;
  studentEmail: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  const initials = studentName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="dark min-h-screen bg-slate-950 font-sans text-base text-slate-100">
      <SidebarProvider>
        <Sidebar
          side="left"
          collapsible="icon"
          className="border-r border-slate-800 bg-slate-900 text-slate-100"
        >
          <SidebarHeader className="bg-slate-900">
            <Link href="/student" className="flex items-center gap-3 px-2 py-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <GraduationCap className="size-5" />
              </div>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="font-semibold text-slate-100">EduCore</p>
                <p className="text-sm text-slate-400">Student Portal</p>
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent className="bg-slate-900">
            <SidebarGroup>
              <SidebarGroupLabel className="text-sm text-slate-400">
                Workspace
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => {
                    const Icon = item.icon;

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          render={<Link href={item.href} />}
                          isActive={isActive(pathname, item.href)}
                          tooltip={item.label}
                          className="h-11 text-base text-slate-300 hover:bg-slate-800 hover:text-white data-[active=true]:bg-indigo-600 data-[active=true]:text-white"
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-800 bg-slate-900">
            <div className="flex items-center gap-3 rounded-lg border border-slate-800 p-3">
              <Avatar className="size-10">
                <AvatarFallback className="bg-indigo-950 text-indigo-200">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="truncate font-medium text-slate-100">
                  {studentName}
                </p>
                <p className="truncate text-sm text-slate-400">
                  {studentEmail || "Student account"}
                </p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="min-w-0 bg-slate-950 text-slate-100">
          <div className="min-h-screen bg-slate-950 text-slate-100">
            <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur md:px-8">
              <SidebarTrigger className="text-slate-200 hover:bg-slate-800 hover:text-white" />
              <div className="flex-1">
                <p className="font-medium text-slate-100">Student Portal</p>
              </div>
              <Badge className="border border-indigo-800 bg-indigo-950 text-sm text-indigo-200">
                Academic Year 2026/2027
              </Badge>
            </header>

            <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 pb-24 md:px-8 md:py-8">
              {children}
            </main>

            <nav className="fixed inset-x-0 bottom-0 z-30 grid h-18 grid-cols-5 border-t border-slate-800 bg-slate-950/95 px-2 backdrop-blur-md md:hidden">
              {mobileNavigation.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    href={item.href}
                    key={item.href}
                    className={`flex flex-col items-center justify-center gap-1 text-sm ${
                      isActive(pathname, item.href)
                        ? "text-indigo-300"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="size-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
