import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authPages = [
  "/login",
  "/signup",
  "/confirm-email",
  "/forget-password",
  "/reset-password",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let Server Actions handle their own authentication.
  if (request.headers.has("Next-Action")) {
    return NextResponse.next();
  }

  

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const role = token?.role;

  if (token && authPages.includes(pathname)) {
    const destination = role === "admin" ? "/admin" : "/student";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isStudentRoute = pathname.startsWith("/student");

  if ((isAdminRoute || isStudentRoute) && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/student", request.url));
  }

  if (isStudentRoute && role !== "student") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/confirm-email",
    "/forget-password",
    "/reset-password",
    "/admin/:path*",
    "/student/:path*",
  ],
};