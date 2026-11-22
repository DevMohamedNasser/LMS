import { DefaultSession } from "next-auth";

type UserRole = "admin" | "student";

declare module "next-auth" {
  interface User {
    role: UserRole;
    grade?: number;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      grade?: number;
    } & DefaultSession["user"];

    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    accessToken?: string;
    refreshToken?: string;
  }
}