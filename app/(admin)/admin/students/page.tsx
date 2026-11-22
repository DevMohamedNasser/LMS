"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, Users } from "lucide-react";

import { useCachedData } from "../cache";
import {
  EmptyState,
  ErrorBanner,
  GradeSelect,
  PageHeader,
  RefreshButton,
  formatDate,
} from "../shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listStudents } from "@/app/api/actions";

const PAGE_SIZE = 10;

export default function AdminStudentsPage() {
  const [grade, setGrade] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");

  const gradeNumber = grade === "all" ? undefined : Number(grade);

  const { data, loading, error, cachedAt, refresh } = useCachedData(
    `students:${grade}:${page}`,
    () => listStudents(page, PAGE_SIZE, gradeNumber),
  );

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const students = data?.students ?? [];

    if (!term) return students;

    return students.filter(
      (student) =>
        student.fullName.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term),
    );
  }, [data, search]);

  return (
    <>
      <PageHeader
        title="Students"
        description="Browse accounts, open a profile, change roles or reset passwords."
        actions={
          <>
            <GradeSelect
              allowAll
              value={grade}
              onChange={(next) => {
                setGrade(next);
                setPage(1);
              }}
            />
            <RefreshButton
              onClick={refresh}
              loading={loading}
              cachedAt={cachedAt}
            />
          </>
        }
      />

      <ErrorBanner message={error} />

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="space-y-4 p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search this page by name or email"
              className="border-slate-700 bg-slate-950 pl-9 text-slate-100"
            />
          </div>

          {loading && !data ? (
            <Skeleton className="h-64 w-full bg-slate-800" />
          ) : rows.length ? (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Name</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Grade</TableHead>
                  <TableHead className="text-slate-400">Role</TableHead>
                  <TableHead className="text-slate-400">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((student) => (
                  <TableRow
                    key={student.id}
                    className="border-slate-800 hover:bg-slate-800/40"
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="text-slate-100 hover:text-indigo-300"
                      >
                        {student.fullName || "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {student.email}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {student.grade ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`border ${
                          student.role === "ADMIN"
                            ? "border-amber-800 bg-amber-950 text-amber-200"
                            : "border-slate-700 bg-slate-800 text-slate-200"
                        }`}
                      >
                        {student.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {formatDate(student.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Users}
              title="No students found"
              description="Try another grade, page or search term."
            />
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Page {page}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
                className="h-9 border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
              >
                <ChevronLeft className="mr-1 size-4" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!data?.hasMore || loading}
                onClick={() => setPage((current) => current + 1)}
                className="h-9 border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
              >
                Next
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
