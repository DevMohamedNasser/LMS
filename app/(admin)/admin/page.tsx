// "use client";

// import Link from "next/link";
// import { useState } from "react";
// import {
//   BookOpen,
//   ClipboardList,
//   FileText,
//   Trophy,
//   Users,
//   type LucideIcon,
// } from "lucide-react";

// import {
//   EmptyState,
//   ErrorBanner,
//   PageHeader,
//   RefreshButton,
//   formatDate,
//   scoreClass,
// } from "./shared";

// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   Pagination,
//   PaginationContent,
//   PaginationItem,
//   PaginationLink,
//   PaginationNext,
//   PaginationPrevious,
// } from "@/components/ui/pagination";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { getOverview } from "@/app/api/actions";
// import { useCachedData } from "./cache";

// const RESULTS_PER_PAGE = 5;

// function StatCard({
//   title,
//   value,
//   detail,
//   icon: Icon,
//   href,
//   loading,
// }: {
//   title: string;
//   value: string;
//   detail: string;
//   icon: LucideIcon;
//   href?: string;
//   loading: boolean;
// }) {
//   const card = (
//     <Card className="h-full border-slate-800 bg-slate-900 text-slate-100 transition-colors hover:border-indigo-700">
//       <CardContent className="flex items-center justify-between gap-4 p-5">
//         <div className="min-w-0">
//           <p className="text-base text-slate-300">{title}</p>
//           {loading ? (
//             <Skeleton className="mt-2 h-8 w-16 bg-slate-800" />
//           ) : (
//             <p className="mt-2 text-2xl font-bold text-white">{value}</p>
//           )}
//           <p className="mt-1 truncate text-sm text-slate-400">{detail}</p>
//         </div>
//         <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-950 text-indigo-300">
//           <Icon className="size-6" />
//         </div>
//       </CardContent>
//     </Card>
//   );

//   return href ? (
//     <Link href={href} className="block">
//       {card}
//     </Link>
//   ) : (
//     card
//   );
// }

// export default function AdminDashboardPage() {
//   const { data, loading, error, cachedAt, refresh } = useCachedData(
//     "overview",
//     getOverview,
//   );

//   const [resultsPage, setResultsPage] = useState(1);

//   const recentResults = data?.recentResults ?? [];
//   const pageCount = Math.ceil(recentResults.length / RESULTS_PER_PAGE);
//   const currentPage = Math.min(resultsPage, Math.max(pageCount, 1));
//   const pageStart = (currentPage - 1) * RESULTS_PER_PAGE;
//   const paginatedResults = recentResults.slice(
//     pageStart,
//     pageStart + RESULTS_PER_PAGE,
//   );

//   function goToPage(page: number) {
//     setResultsPage(Math.min(Math.max(page, 1), Math.max(pageCount, 1)));
//   }

//   return (
//     <>
//       <PageHeader
//         title="Overview"
//         description="Exams, materials, students and recent results at a glance."
//         actions={
//           <RefreshButton
//             onClick={() => {
//               setResultsPage(1);
//               void refresh();
//             }}
//             loading={loading}
//             cachedAt={cachedAt}
//           />
//         }
//       />

//       <ErrorBanner message={error} />

//       <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
//         <StatCard
//           title="Exams"
//           value={String(data?.examCount ?? 0)}
//           detail="Across all grades"
//           icon={ClipboardList}
//           href="/admin/exams"
//           loading={loading && !data}
//         />
//         <StatCard
//           title="Materials"
//           value={String(data?.materialCount ?? 0)}
//           detail="Uploaded files"
//           icon={BookOpen}
//           href="/admin/materials"
//           loading={loading && !data}
//         />
//         <StatCard
//           title="Students"
//           value={`${data?.studentCount ?? 0}${data?.studentCountCapped ? "+" : ""}`}
//           detail="Registered accounts"
//           icon={Users}
//           href="/admin/students"
//           loading={loading && !data}
//         />
//         <StatCard
//           title="Average score"
//           value={
//             data?.averageScore != null
//               ? `${Math.round(data.averageScore)}%`
//               : "—"
//           }
//           detail="Latest submitted exams"
//           icon={Trophy}
//           loading={loading && !data}
//         />
//       </section>

//       <section className="grid gap-6 xl:grid-cols-3">
//         <Card className="border-slate-800 bg-slate-900 text-slate-100 xl:col-span-2">
//           <CardHeader>
//             <CardTitle className="text-xl text-white">Recent results</CardTitle>
//           </CardHeader>

//           <CardContent>
//             {loading && !data ? (
//               <Skeleton className="h-48 w-full bg-slate-800" />
//             ) : recentResults.length > 0 ? (
//               <div className="space-y-4">
//                 <Table>
//                   <TableHeader>
//                     <TableRow className="border-slate-800 hover:bg-transparent">
//                       <TableHead className="text-slate-400">Student</TableHead>
//                       <TableHead className="text-slate-400">Exam</TableHead>
//                       <TableHead className="text-slate-400">Date</TableHead>
//                       <TableHead className="text-right text-slate-400">
//                         Score
//                       </TableHead>
//                     </TableRow>
//                   </TableHeader>

//                   <TableBody>
//                     {paginatedResults.map((row) => (
//                       <TableRow
//                         key={row.id}
//                         className="border-slate-800 hover:bg-slate-800/40"
//                       >
//                         <TableCell className="font-medium text-slate-100">
//                           {row.student ? (
//                             <Link
//                               href={`/admin/students/${row.student.id}`}
//                               className="hover:text-indigo-300"
//                             >
//                               {row.student.fullName || row.student.email}
//                             </Link>
//                           ) : (
//                             "—"
//                           )}
//                         </TableCell>

//                         <TableCell className="text-slate-300">
//                           {row.exam?.title ?? "—"}
//                         </TableCell>

//                         <TableCell className="text-slate-400">
//                           {formatDate(row.startedAt, true)}
//                         </TableCell>

//                         <TableCell className="text-right">
//                           <Badge className={`border ${scoreClass(row.score)}`}>
//                             {row.score !== null
//                               ? `${Math.round(row.score)}%`
//                               : "—"}
//                           </Badge>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>

//                 {pageCount > 1 && (
//                   <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-4 sm:flex-row">
//                     <p className="text-sm text-slate-400">
//                       Showing {pageStart + 1}–
//                       {Math.min(
//                         pageStart + RESULTS_PER_PAGE,
//                         recentResults.length,
//                       )}{" "}
//                       of {recentResults.length} results
//                     </p>

//                     <Pagination className="mx-0 w-auto justify-end">
//                       <PaginationContent>
//                         <PaginationItem>
//                           <PaginationPrevious
//                             href="#"
//                             aria-disabled={currentPage <= 1}
//                             className={
//                               currentPage <= 1
//                                 ? "pointer-events-none opacity-50"
//                                 : "cursor-pointer"
//                             }
//                             onClick={(event) => {
//                               event.preventDefault();
//                               goToPage(currentPage - 1);
//                             }}
//                           />
//                         </PaginationItem>

//                         {Array.from({ length: pageCount }, (_, index) => {
//                           const page = index + 1;

//                           return (
//                             <PaginationItem key={page}>
//                               <PaginationLink
//                                 href="#"
//                                 isActive={page === currentPage}
//                                 onClick={(event) => {
//                                   event.preventDefault();
//                                   goToPage(page);
//                                 }}
//                               >
//                                 {page}
//                               </PaginationLink>
//                             </PaginationItem>
//                           );
//                         })}

//                         <PaginationItem>
//                           <PaginationNext
//                             href="#"
//                             aria-disabled={currentPage >= pageCount}
//                             className={
//                               currentPage >= pageCount
//                                 ? "pointer-events-none opacity-50"
//                                 : "cursor-pointer"
//                             }
//                             onClick={(event) => {
//                               event.preventDefault();
//                               goToPage(currentPage + 1);
//                             }}
//                           />
//                         </PaginationItem>
//                       </PaginationContent>
//                     </Pagination>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <EmptyState
//                 icon={Trophy}
//                 title="No results yet"
//                 description="Submitted exams will show up here."
//               />
//             )}
//           </CardContent>
//         </Card>

//         <Card className="border-slate-800 bg-slate-900 text-slate-100">
//           <CardHeader>
//             <CardTitle className="text-xl text-white">
//               Latest materials
//             </CardTitle>
//           </CardHeader>

//           <CardContent className="space-y-3">
//             {loading && !data ? (
//               <Skeleton className="h-48 w-full bg-slate-800" />
//             ) : data?.recentMaterials.length ? (
//               data.recentMaterials.map((item) => (
//                 <div
//                   key={item.id}
//                   className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3"
//                 >
//                   <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-950 text-sky-300">
//                     <FileText className="size-5" />
//                   </span>

//                   <div className="min-w-0">
//                     <p className="truncate font-medium text-slate-100">
//                       {item.title}
//                     </p>
//                     <p className="text-sm text-slate-400">
//                       {item.grade ? `Grade ${item.grade}` : "All grades"}
//                     </p>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <EmptyState
//                 icon={BookOpen}
//                 title="No materials"
//                 description="Upload a file from the Materials page."
//               />
//             )}
//           </CardContent>
//         </Card>
//       </section>

//       <Card className="border-slate-800 bg-slate-900 text-slate-100">
//         <CardHeader>
//           <CardTitle className="text-xl text-white">Latest exams</CardTitle>
//         </CardHeader>

//         <CardContent className="space-y-3">
//           {loading && !data ? (
//             <Skeleton className="h-32 w-full bg-slate-800" />
//           ) : data?.recentExams.length ? (
//             data.recentExams.map((exam) => (
//               <div
//                 key={exam.id}
//                 className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3"
//               >
//                 <p className="truncate font-medium text-slate-100">
//                   {exam.title}
//                 </p>

//                 <p className="shrink-0 text-sm text-slate-400">
//                   {exam.grade ? `Grade ${exam.grade}` : "—"} ·{" "}
//                   {exam.questions.length} questions · {exam.durationMin} min
//                 </p>
//               </div>
//             ))
//           ) : (
//             <EmptyState
//               icon={ClipboardList}
//               title="No exams"
//               description="Create your first exam from the Exams page."
//             />
//           )}
//         </CardContent>
//       </Card>
//     </>
//   );
// }















"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  ClipboardList,
  FileText,
  MessageCircle,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  RefreshButton,
  formatDate,
  scoreClass,
} from "./shared";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOverview } from "@/app/api/actions";
import { useCachedData } from "./cache";

const RESULTS_PER_PAGE = 5;

function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  href,
  loading,
}: {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  href?: string;
  loading: boolean;
}) {
  const card = (
    <Card className="h-full border-slate-800 bg-slate-900 text-slate-100 transition-colors hover:border-indigo-700">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-base text-slate-300">{title}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-16 bg-slate-800" />
          ) : (
            <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          )}
          <p className="mt-1 truncate text-sm text-slate-400">{detail}</p>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-950 text-indigo-300">
          <Icon className="size-6" />
        </div>
      </CardContent>
    </Card>
  );

  return href ? (
    <Link href={href} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}

export default function AdminDashboardPage() {
  const { data, loading, error, cachedAt, refresh } = useCachedData(
    "overview",
    getOverview,
  );

  const [resultsPage, setResultsPage] = useState(1);

  const recentResults = data?.recentResults ?? [];
  const pageCount = Math.ceil(recentResults.length / RESULTS_PER_PAGE);
  const currentPage = Math.min(resultsPage, Math.max(pageCount, 1));
  const pageStart = (currentPage - 1) * RESULTS_PER_PAGE;
  const paginatedResults = recentResults.slice(
    pageStart,
    pageStart + RESULTS_PER_PAGE,
  );

  function goToPage(page: number) {
    setResultsPage(Math.min(Math.max(page, 1), Math.max(pageCount, 1)));
  }

  return (
    <>
      <PageHeader
        title="Overview"
        description="Exams, materials, students and recent results at a glance."
        actions={
          <RefreshButton
            onClick={() => {
              setResultsPage(1);
              void refresh();
            }}
            loading={loading}
            cachedAt={cachedAt}
          />
        }
      />

      <ErrorBanner message={error} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Exams"
          value={String(data?.examCount ?? 0)}
          detail="Across all grades"
          icon={ClipboardList}
          href="/admin/exams"
          loading={loading && !data}
        />

        <StatCard
          title="Materials"
          value={String(data?.materialCount ?? 0)}
          detail="Uploaded files"
          icon={BookOpen}
          href="/admin/materials"
          loading={loading && !data}
        />

        <StatCard
          title="Students"
          value={`${data?.studentCount ?? 0}${data?.studentCountCapped ? "+" : ""}`}
          detail="Registered accounts"
          icon={Users}
          href="/admin/students"
          loading={loading && !data}
        />

        <StatCard
          title="Average score"
          value={
            data?.averageScore != null
              ? `${Math.round(data.averageScore)}%`
              : "—"
          }
          detail="Latest submitted exams"
          icon={Trophy}
          loading={loading && !data}
        />

        <StatCard
          title="Chats"
          value="Open"
          detail="Student conversations"
          icon={MessageCircle}
          href="/admin/chat"
          loading={false}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900 text-slate-100 xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl text-white">Recent results</CardTitle>
          </CardHeader>

          <CardContent>
            {loading && !data ? (
              <Skeleton className="h-48 w-full bg-slate-800" />
            ) : recentResults.length > 0 ? (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">Student</TableHead>
                      <TableHead className="text-slate-400">Exam</TableHead>
                      <TableHead className="text-slate-400">Date</TableHead>
                      <TableHead className="text-right text-slate-400">
                        Score
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedResults.map((row) => (
                      <TableRow
                        key={row.id}
                        className="border-slate-800 hover:bg-slate-800/40"
                      >
                        <TableCell className="font-medium text-slate-100">
                          {row.student ? (
                            <Link
                              href={`/admin/students/${row.student.id}`}
                              className="hover:text-indigo-300"
                            >
                              {row.student.fullName || row.student.email}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>

                        <TableCell className="text-slate-300">
                          {row.exam?.title ?? "—"}
                        </TableCell>

                        <TableCell className="text-slate-400">
                          {formatDate(row.startedAt, true)}
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

                {pageCount > 1 && (
                  <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-4 sm:flex-row">
                    <p className="text-sm text-slate-400">
                      Showing {pageStart + 1}–
                      {Math.min(
                        pageStart + RESULTS_PER_PAGE,
                        recentResults.length,
                      )}{" "}
                      of {recentResults.length} results
                    </p>

                    <Pagination className="mx-0 w-auto justify-end">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            aria-disabled={currentPage <= 1}
                            className={
                              currentPage <= 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                            onClick={(event) => {
                              event.preventDefault();
                              goToPage(currentPage - 1);
                            }}
                          />
                        </PaginationItem>

                        {Array.from({ length: pageCount }, (_, index) => {
                          const page = index + 1;

                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                isActive={page === currentPage}
                                onClick={(event) => {
                                  event.preventDefault();
                                  goToPage(page);
                                }}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            aria-disabled={currentPage >= pageCount}
                            className={
                              currentPage >= pageCount
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                            onClick={(event) => {
                              event.preventDefault();
                              goToPage(currentPage + 1);
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={Trophy}
                title="No results yet"
                description="Submitted exams will show up here."
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle className="text-xl text-white">
              Latest materials
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {loading && !data ? (
              <Skeleton className="h-48 w-full bg-slate-800" />
            ) : data?.recentMaterials.length ? (
              data.recentMaterials.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-950 text-sky-300">
                    <FileText className="size-5" />
                  </span>

                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-100">
                      {item.title}
                    </p>
                    <p className="text-sm text-slate-400">
                      {item.grade ? `Grade ${item.grade}` : "All grades"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No materials"
                description="Upload a file from the Materials page."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="text-xl text-white">Latest exams</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {loading && !data ? (
            <Skeleton className="h-32 w-full bg-slate-800" />
          ) : data?.recentExams.length ? (
            data.recentExams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3"
              >
                <p className="truncate font-medium text-slate-100">
                  {exam.title}
                </p>

                <p className="shrink-0 text-sm text-slate-400">
                  {exam.grade ? `Grade ${exam.grade}` : "—"} ·{" "}
                  {exam.questions.length} questions · {exam.durationMin} min
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="No exams"
              description="Create your first exam from the Exams page."
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}