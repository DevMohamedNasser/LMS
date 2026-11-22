"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Database, KeyRound, LoaderCircle, LogOut } from "lucide-react";

import type { ResultHistoryEntry } from "../extra-types";
import { clearListCache, readResultHistory } from "../student-cache";
import { ErrorBanner, NoticeBanner, PageTitle } from "../student-ui";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeStudentPassword } from "../actions-addition";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800 py-3 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="truncate text-base text-slate-100">{value}</span>
    </div>
  );
}

export default function ProfileClient({
  studentId,
  studentName,
  studentEmail,
}: {
  studentId: string;
  studentName: string;
  studentEmail: string;
}) {
  const [history, setHistory] = useState<ResultHistoryEntry[]>([]);
  const [notice, setNotice] = useState<string>("");

  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(readResultHistory(studentId));
  }, [studentId]);

  const initials = studentName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const average = history.length
    ? history.reduce((sum, entry) => sum + entry.score, 0) / history.length
    : null;

  async function handlePasswordChange(): Promise<void> {
    setPasswordError("");
    setNotice("");

    if (!currentPassword || !newPassword) {
      return setPasswordError("Fill in every field.");
    }

    if (newPassword.length < 6) {
      return setPasswordError(
        "The new password must be at least 6 characters.",
      );
    }

    if (newPassword !== confirmPassword) {
      return setPasswordError(
        "The new password and its confirmation do not match.",
      );
    }

    setSaving(true);

    const result = await changeStudentPassword({
      email: studentEmail,
      password: currentPassword,
      newPassword,
      confirmPassword,
    });

    setSaving(false);

    if (!result.ok) {
      setPasswordError(result.error);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setNotice("Your password was updated.");
  }

  const inputClass = "border-slate-700 bg-slate-950 text-slate-100";

  return (
    <>
      <PageTitle
        title="Profile"
        description="Your account details, password and local data."
      />

      <NoticeBanner message={notice} />

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle className="text-xl text-white">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-14">
                <AvatarFallback className="bg-indigo-950 text-lg text-indigo-200">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {studentName}
                </p>
                <p className="truncate text-sm text-slate-400">
                  {studentEmail || "Student account"}
                </p>
              </div>
            </div>

            <div>
              <InfoRow label="Exams completed" value={String(history.length)} />
              <InfoRow
                label="Average score"
                value={average !== null ? `${Math.round(average)}%` : "—"}
              />
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
            <CardTitle className="flex items-center gap-2 text-xl text-white">
              <KeyRound className="size-5 text-indigo-300" />
              Change password
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your current password, then choose a new one.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pw-current">Current password</Label>
              <Input
                id="pw-current"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pw-new">New password</Label>
                <Input
                  id="pw-new"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw-confirm">Confirm new password</Label>
                <Input
                  id="pw-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <ErrorBanner message={passwordError} />

            <Button
              type="button"
              onClick={handlePasswordChange}
              disabled={saving}
              className="h-10 bg-indigo-600 text-white hover:bg-indigo-500"
            >
              {saving && <LoaderCircle className="mr-2 size-4 animate-spin" />}
              Update password
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <Database className="size-5 text-indigo-300" />
            Local data
          </CardTitle>
          <CardDescription className="text-slate-400">
            Exam and material lists are cached for 5 minutes. Clearing them
            keeps your exam attempts and results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              clearListCache(studentId);
              setNotice("Lists cleared. They will be fetched again next time.");
            }}
            className="h-10 border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
          >
            Clear cached lists
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
