// import NextAuth, { type NextAuthOptions } from "next-auth";
// import Credentials from "next-auth/providers/credentials";
// import { jwtDecode } from "jwt-decode";

// type UserRole = "admin" | "student";

// type ApiTokenPayload = {
//   id: string;
// };

// export const NextOptions: NextAuthOptions = {
//   pages: {
//     signIn: "/login",
//   },

//   session: {
//     strategy: "jwt",
//   },

//   secret: process.env.NEXTAUTH_SECRET,

//   providers: [
//     Credentials({
//       name: "credentials",

//       credentials: {
//         email: {},
//         password: {},
//         isAdmin: {},
//       },

//       async authorize(credentials) {
//         const email = credentials?.email;
//         const password = credentials?.password;

//         if (!email || !password) {
//           return null;
//         }

//         const isAdmin = credentials?.isAdmin === "true";
//         const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

//         if (!baseUrl) {
//           throw new Error("API base URL is not configured.");
//         }

//         const endpoint = new URL(
//           "auth/login",
//           baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
//         );
//         endpoint.searchParams.set("isAdmin", String(isAdmin));

//         const res = await fetch(endpoint, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ email, password }),
//         });

//         const data = await res.json().catch(() => ({}));

//         if (!res.ok) {
//           throw new Error(data.message || "Invalid email or password.");
//         }

//         const accessToken = data.tokens?.accessToken;
//         const refreshToken = data.tokens?.refreshToken;

//         if (
//           typeof accessToken !== "string" ||
//           typeof refreshToken !== "string"
//         ) {
//           throw new Error("Login response did not include valid tokens.");
//         }

//         const decodedToken = jwtDecode<ApiTokenPayload>(accessToken);

//         if (!decodedToken.id) {
//           throw new Error("Access token does not contain a user ID.");
//         }

//         // الـ backend يجب أن يتحقق من صلاحية الدخول كإداري
//         // قبل أن يصدر التوكن عند isAdmin=true.
//         const role: UserRole = isAdmin ? "admin" : "student";

//         return {
//           id: decodedToken.id,
//           role,
//           tokens: {
//             accessToken,
//             refreshToken,
//           },
//         };
//       },
//     }),
//   ],

//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.sub = user.id;
//         token.role = user.role;
//         token.accessToken = user.tokens.accessToken;
//         token.refreshToken = user.tokens.refreshToken;
//       }

//       return token;
//     },

//     async session({ session, token }) {
//       const role = token.role;
//       const accessToken = token.accessToken;

//       if (
//         (role !== "admin" && role !== "student") ||
//         typeof accessToken !== "string"
//       ) {
//         throw new Error("Invalid session token.");
//       }

//       session.user = {
//         ...session.user,
//         id: token.sub ?? "",
//         role,
//       };

//       session.accessToken = accessToken;

//       return session;
//     },
//   },
// };

// const handler = NextAuth(NextOptions);

// export { handler as GET, handler as POST };






import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { jwtDecode } from "jwt-decode";

type UserRole = "admin" | "student";

type ApiTokenPayload = {
  id?: string;
  grade?: number;
};

type LoginApiResponse = {
  message?: string;
  tokens?: {
    accessToken?: unknown;
    refreshToken?: unknown;
  };
  data?: {
    grade?: unknown;
    user?: {
      grade?: unknown;
    };
  };
  user?: {
    grade?: unknown;
  };
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

function toGrade(value: unknown): number | undefined {
  const grade =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;

  return Number.isInteger(grade) && grade >= 1 && grade <= 7
    ? grade
    : undefined;
}

export const NextOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    Credentials({
      name: "credentials",

      credentials: {
        email: {},
        password: {},
        isAdmin: {},
      },

      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const isAdmin = credentials?.isAdmin === "true";
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

        if (!baseUrl) {
          throw new Error("API base URL is not configured.");
        }

        const endpoint = new URL(
          "auth/login",
          baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
        );
        endpoint.searchParams.set("isAdmin", String(isAdmin));

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = (await response.json().catch(() => ({}))) as LoginApiResponse;

        if (!response.ok) {
          throw new Error(data.message || "Invalid email or password.");
        }

        const accessToken = data.tokens?.accessToken;
        const refreshToken = data.tokens?.refreshToken;

        if (
          typeof accessToken !== "string" ||
          typeof refreshToken !== "string"
        ) {
          throw new Error("Login response did not include valid tokens.");
        }

        const decodedToken = jwtDecode<ApiTokenPayload>(accessToken);

        if (typeof decodedToken.id !== "string" || !decodedToken.id) {
          throw new Error("Access token does not contain a user ID.");
        }

        // الـ backend مسؤول عن التحقق من صلاحية دور الحساب.
        const role: UserRole = isAdmin ? "admin" : "student";

        const grade =
          toGrade(data.data?.grade) ??
          toGrade(data.data?.user?.grade) ??
          toGrade(data.user?.grade) ??
          toGrade(decodedToken.grade);

        return {
          id: decodedToken.id,
          role,
          ...(grade !== undefined ? { grade } : {}),
          tokens: {
            accessToken,
            refreshToken,
          } satisfies AuthTokens,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.accessToken = user.tokens.accessToken;
        token.refreshToken = user.tokens.refreshToken;

        if (typeof user.grade === "number") {
          token.grade = user.grade;
        }
      }

      return token;
    },

    async session({ session, token }) {
      const role = token.role;
      const accessToken = token.accessToken;

      if (
        (role !== "admin" && role !== "student") ||
        typeof accessToken !== "string"
      ) {
        throw new Error("Invalid session token.");
      }

      session.user = {
        ...session.user,
        id: token.sub ?? "",
        role,
        ...(typeof token.grade === "number"
          ? { grade: token.grade }
          : {}),
      };

      session.accessToken = accessToken;

      return session;
    },
  },
};

const handler = NextAuth(NextOptions);

export { handler as GET, handler as POST };