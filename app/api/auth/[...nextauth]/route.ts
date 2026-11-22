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

type AuthorizedUser = {
  id: string;
  role: UserRole;
  grade?: number;
  tokens: AuthTokens;
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

// Shared by the email/password login and the Google login: both endpoints
// answer with { tokens: { accessToken, refreshToken } }.
async function loginWithBackend(
  path: string,
  isAdmin: boolean,
  body: Record<string, string>,
  fallbackError: string,
): Promise<AuthorizedUser> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    throw new Error("API base URL is not configured.");
  }

  const endpoint = new URL(
    path,
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  );
  endpoint.searchParams.set("isAdmin", String(isAdmin));

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response
    .json()
    .catch(() => ({}))) as LoginApiResponse;

  if (!response.ok) {
    throw new Error(data.message || fallbackError);
  }

  const accessToken = data.tokens?.accessToken;
  const refreshToken = data.tokens?.refreshToken;

  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
    throw new Error("Login response did not include valid tokens.");
  }

  const decodedToken = jwtDecode<ApiTokenPayload>(accessToken);

  if (typeof decodedToken.id !== "string" || !decodedToken.id) {
    throw new Error("Access token does not contain a user ID.");
  }

  // The role comes from the button the user pressed on the login page
  // ("Login as Student" / "Login as Admin"); the backend validates it.
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
    tokens: { accessToken, refreshToken } satisfies AuthTokens,
  };
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
    // Email + password
    Credentials({
      id: "credentials",
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

        return loginWithBackend(
          "auth/login",
          credentials?.isAdmin === "true",
          { email, password },
          "Invalid email or password.",
        );
      },
    }),

    // Google: the browser gets a Google ID token, the backend verifies it
    // at POST /auth/social-login?isAdmin=true|false
    Credentials({
      id: "google-id-token",
      name: "google-id-token",

      credentials: {
        idToken: {},
        isAdmin: {},
      },

      async authorize(credentials) {
        const idToken = credentials?.idToken;

        if (!idToken) {
          return null;
        }

        return loginWithBackend(
          "auth/social-login",
          credentials?.isAdmin === "true",
          { idToken },
          "Google sign-in failed.",
        );
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
        ...(typeof token.grade === "number" ? { grade: token.grade } : {}),
      };

      session.accessToken = accessToken;

      return session;
    },
  },
};

const handler = NextAuth(NextOptions);

export { handler as GET, handler as POST };
