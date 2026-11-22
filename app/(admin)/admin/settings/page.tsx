"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Database, LogOut, Trash2 } from "lucide-react";

import { useAdmin } from "../admin-context";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NoticeBanner, PageHeader } from "../shared";
import ResetPasswordForm from "../reset-password-form";
import { ADMIN_CACHE_TTL, clearAdminCache } from "../cache";

export default function AdminSettingsPage() {
  const { adminId, adminName, adminEmail } = useAdmin();
  const [notice, setNotice] = useState<string>("");

  const initials = adminName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your account, password and local cache."
      />

      <NoticeBanner message={notice} />

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle className="text-xl text-white">Account</CardTitle>
            <CardDescription className="text-slate-400">
              You are signed in as an administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="size-14">
                <AvatarFallback className="bg-indigo-950 text-lg text-indigo-200">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{adminName}</p>
                <p className="truncate text-sm text-slate-400">{adminEmail}</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="h-10 w-full border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
            >
              <LogOut className="mr-2 size-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900 text-slate-100 xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl text-white">
              Change my password
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your current password, then choose a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm
              defaultEmail={adminEmail}
              lockEmail
              onDone={() => setNotice("Your password was updated.")}
            />
          </CardContent>
        </Card>
      </section>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <Database className="size-5 text-indigo-300" />
            Cache
          </CardTitle>
          <CardDescription className="text-slate-400">
            Exams, materials and students are kept in this browser for{" "}
            {Math.round(ADMIN_CACHE_TTL / 60000)} minutes. A hard refresh
            (Ctrl+Shift+R) or the Refresh button always fetches fresh data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              clearAdminCache(adminId);
              setNotice("Cache cleared. Every page will fetch fresh data.");
            }}
            className="h-10 border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
          >
            <Trash2 className="mr-2 size-4" />
            Clear cache
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
