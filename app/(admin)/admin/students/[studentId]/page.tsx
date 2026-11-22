"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, KeyRound, LoaderCircle, ShieldCheck, Trophy } from "lucide-react";

import { useAdmin } from "../../admin-context";
import { invalidateCache, useCachedData } from "../../cache";
import ResetPasswordForm from "../../reset-password-form";
import {
  EmptyState,
  ErrorBanner,
  NoticeBanner,
  PageHeader,
  RefreshButton,
  formatDate,
  scoreClass,
} from "../../shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { changeUserRole, getStudentDetail } from "@/app/api/actions";

type RoleValue = "USER" | "ADMIN";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800 py-3 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="truncate text-base text-slate-100">{value}</span>
    </div>
  );
}

export default function AdminStudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { adminId } = useAdmin();

  const { data, loading, error, cachedAt, refresh } = useCachedData(
    `student:${studentId}`,
    () => getStudentDetail(studentId),
  );

  const [role, setRole] = useState<RoleValue>("USER");
  const [savingRole, setSavingRole] = useState<boolean>(false);
  const [confirmRole, setConfirmRole] = useState<boolean>(false);
  const [resetOpen, setResetOpen] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");

  useEffect(() => {
    if (data) setRole(data.student.role === "ADMIN" ? "ADMIN" : "USER");
  }, [data]);

  const student = data?.student;
  const results = data?.results ?? [];
  const roleChanged = student ? student.role !== role : false;

  const scored = results.filter((row) => row.score !== null);
  const average = scored.length
    ? scored.reduce((sum, row) => sum + (row.score ?? 0), 0) / scored.length
    : null;

  async function handleRoleSave() {
    if (!student) return;

    setSavingRole(true);
    setActionError("");

    try {
      await changeUserRole(student.id, role);
      invalidateCache(adminId, "student", "overview");
      setConfirmRole(false);
      setNotice(`Role changed to ${role}.`);
      await refresh();
    } catch (roleError) {
      setActionError(
        roleError instanceof Error
          ? roleError.message
          : "Unable to change the role.",
      );
    } finally {
      setSavingRole(false);
    }
  }

  return (
    <>
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="size-4" />
        Back to students
      </Link>

      <PageHeader
        title={student?.fullName || "Student"}
        description={student?.email}
        actions={
          <RefreshButton
            onClick={refresh}
            loading={loading}
            cachedAt={cachedAt}
          />
        }
      />

      <NoticeBanner message={notice} />
      <ErrorBanner message={error || actionError} />

      {loading && !data ? (
        <Skeleton className="h-72 w-full bg-slate-800" />
      ) : student ? (
        <>
          <section className="grid gap-6 xl:grid-cols-3">
            <Card className="border-slate-800 bg-slate-900 text-slate-100 xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl text-white">Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <InfoRow label="Full name" value={student.fullName || "—"} />
                <InfoRow label="Email" value={student.email || "—"} />
                <InfoRow label="Phone" value={student.phone ?? "—"} />
                <InfoRow label="Address" value={student.address ?? "—"} />
                <InfoRow
                  label="Grade"
                  value={student.grade ? `Grade ${student.grade}` : "—"}
                />
                <InfoRow label="Joined" value={formatDate(student.createdAt)} />
                <InfoRow
                  label="Exams taken"
                  value={String(results.length)}
                />
                <InfoRow
                  label="Average score"
                  value={average !== null ? `${Math.round(average)}%` : "—"}
                />
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader>
                <CardTitle className="text-xl text-white">Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Role</p>
                  <Select
                    value={role}
                    onValueChange={(next) =>
                      setRole(next === "ADMIN" ? "ADMIN" : "USER")
                    }
                  >
                    <SelectTrigger className="h-10 w-full border-slate-700 bg-slate-950 text-slate-100">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
                      <SelectItem value="USER">USER</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    disabled={!roleChanged}
                    onClick={() => setConfirmRole(true)}
                    className="h-10 w-full bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    <ShieldCheck className="mr-2 size-4" />
                    Save role
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetOpen(true)}
                  className="h-10 w-full border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
                >
                  <KeyRound className="mr-2 size-4" />
                  Reset password
                </Button>
              </CardContent>
            </Card>
          </section>

          <Card className="border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader>
              <CardTitle className="text-xl text-white">Exam results</CardTitle>
            </CardHeader>
            <CardContent>
              {results.length ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">Exam</TableHead>
                      <TableHead className="text-slate-400">Started</TableHead>
                      <TableHead className="text-slate-400">
                        Wrong answers
                      </TableHead>
                      <TableHead className="text-right text-slate-400">
                        Score
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((row) => (
                      <TableRow
                        key={row.id}
                        className="border-slate-800 hover:bg-slate-800/40"
                      >
                        <TableCell className="font-medium text-slate-100">
                          {row.exam?.title ?? "—"}
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {formatDate(row.startedAt, true)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {row.wrongCount}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={`border ${scoreClass(row.score)}`}>
                            {row.score !== null
                              ? `${Math.round(row.score)}%`
                              : "—"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={Trophy}
                  title="No exam results"
                  description="This student has not submitted an exam yet."
                />
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* ------------------------------ Role confirm ------------------------------ */}
      <Dialog
        open={confirmRole}
        onOpenChange={(open) => {
          if (!open && !savingRole) setConfirmRole(false);
        }}
      >
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              Change role to {role}?
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {role === "ADMIN"
                ? "This account will get full access to the admin console."
                : "This account will lose access to the admin console."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={savingRole}
              onClick={() => setConfirmRole(false)}
              className="border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRoleSave}
              disabled={savingRole}
              className="bg-indigo-600 text-white hover:bg-indigo-500"
            >
              {savingRole && (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------------------- Reset password ----------------------------- */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              Reset password
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Sets a new password for {student?.email}.
            </DialogDescription>
          </DialogHeader>
          {student && (
            <ResetPasswordForm
              defaultEmail={student.email}
              lockEmail
              onDone={() => setNotice("Password updated.")}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
