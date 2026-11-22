"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BookOpen,
  MessageCircle,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import { AdminProvider, type AdminInfo } from "./admin-context";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const navigation: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Exams", href: "/admin/exams", icon: ClipboardList },
  { label: "Materials", href: "/admin/materials", icon: BookOpen },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Chat", href: "/admin/chat", icon: MessageCircle },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShellSkeleton() {
  return (
    <div className="dark min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-900 p-5 md:block">
          <Skeleton className="mb-9 h-10 w-40 bg-slate-800" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full bg-slate-800" />
            ))}
          </div>
        </aside>
        <main className="flex-1 space-y-6 p-8">
          <Skeleton className="h-9 w-60 bg-slate-800" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 bg-slate-800" />
            ))}
          </div>
          <Skeleton className="h-72 bg-slate-800" />
        </main>
      </div>
    </div>
  );
}

export default function AdminShell({
  admin,
  children,
}: {
  admin: AdminInfo;
  children: ReactNode;
}) {
  const pathname = usePathname();

  const initials = admin.adminName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AdminProvider value={admin}>
      <div className="dark min-h-screen bg-slate-950 font-sans text-base text-slate-100">
        <SidebarProvider>
          <Sidebar
            side="left"
            collapsible="icon"
            className="border-r border-slate-800 bg-slate-900 text-slate-100"
          >
            <SidebarHeader className="bg-slate-900">
              <Link href="/admin" className="flex items-center gap-3 px-2 py-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <GraduationCap className="size-5" />
                </div>
                <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="font-semibold text-slate-100">EduCore</p>
                  <p className="text-sm text-slate-400">Admin Console</p>
                </div>
              </Link>
            </SidebarHeader>

            <SidebarContent className="bg-slate-900">
              <SidebarGroup>
                <SidebarGroupLabel className="text-sm text-slate-400">
                  Manage
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

            <SidebarFooter className="space-y-2 border-t border-slate-800 bg-slate-900">
              <div className="flex items-center gap-3 rounded-lg border border-slate-800 p-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-indigo-950 text-indigo-200">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="truncate font-medium text-slate-100">
                    {admin.adminName}
                  </p>
                  <p className="truncate text-sm text-slate-400">
                    {admin.adminEmail}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="h-10 w-full border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 group-data-[collapsible=icon]:px-0"
              >
                <LogOut className="size-4 group-data-[collapsible=icon]:mr-0 sm:mr-2" />
                <span className="group-data-[collapsible=icon]:hidden">
                  Sign out
                </span>
              </Button>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="min-w-0 bg-slate-950 text-slate-100">
            <div className="min-h-screen bg-slate-950">
              <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur md:px-8">
                <SidebarTrigger className="text-slate-200 hover:bg-slate-800 hover:text-white" />
                <div className="flex-1">
                  <p className="font-medium text-slate-100">Admin Dashboard</p>
                </div>
                <Badge className="border border-indigo-800 bg-indigo-950 text-sm text-indigo-200">
                  Academic Year 2026/2027
                </Badge>
              </header>

              <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 pb-16 md:px-8 md:py-8">
                {children}
              </main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </AdminProvider>
  );
}
