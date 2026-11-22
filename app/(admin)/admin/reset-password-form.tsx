"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { ErrorBanner, NoticeBanner } from "./shared";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetUserPassword } from "@/app/api/actions";

export default function ResetPasswordForm({
  defaultEmail,
  lockEmail = false,
  onDone,
}: {
  defaultEmail: string;
  lockEmail?: boolean;
  onDone?: () => void;
}) {
  const [email, setEmail] = useState<string>(defaultEmail);
  const [password, setPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [done, setDone] = useState<string>("");

  async function handleSubmit() {
    setError("");
    setDone("");

    if (!email.trim() || !password || !newPassword) {
      return setError("Fill in every field.");
    }

    if (newPassword.length < 6) {
      return setError("The new password must be at least 6 characters.");
    }

    if (newPassword !== confirmPassword) {
      return setError("The new password and its confirmation do not match.");
    }

    setSaving(true);

    try {
      await resetUserPassword({
        email: email.trim(),
        password,
        newPassword,
        confirmPassword,
      });

      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setDone("Password updated.");
      onDone?.();
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Unable to update the password.",
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "border-slate-700 bg-slate-950 text-slate-100";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rp-email">Email</Label>
        <Input
          id="rp-email"
          type="email"
          value={email}
          readOnly={lockEmail}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rp-current">Current password</Label>
        <Input
          id="rp-current"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rp-new">New password</Label>
          <Input
            id="rp-new"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rp-confirm">Confirm new password</Label>
          <Input
            id="rp-confirm"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <ErrorBanner message={error} />
      <NoticeBanner message={done} />

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="h-10 bg-indigo-600 text-white hover:bg-indigo-500"
      >
        {saving && <LoaderCircle className="mr-2 size-4 animate-spin" />}
        Update password
      </Button>
    </div>
  );
}