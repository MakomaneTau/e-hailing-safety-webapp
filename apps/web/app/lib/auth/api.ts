const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured");
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "reviewer" | "admin";
  emailVerified: boolean;
  createdAt: string;
}

interface ValidationIssue {
  path?: Array<string | number>;
  message: string;
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  message?: string;
  data?: unknown;
}

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

function getValidationError(data: unknown): string | undefined {
  if (!Array.isArray(data)) {
    return undefined;
  }

  const messages = data
    .filter(
      (issue): issue is ValidationIssue =>
        typeof issue === "object" &&
        issue !== null &&
        "message" in issue &&
        typeof issue.message === "string",
    )
    .map((issue) => {
      const field = issue.path?.[0];

      if (typeof field !== "string") {
        return issue.message;
      }

      const label = `${field.charAt(0).toUpperCase()}${field.slice(1)}`;

      return issue.message.toLowerCase().startsWith(field.toLowerCase())
        ? issue.message
        : `${label}: ${issue.message}`;
    });

  return messages.length > 0 ? messages.join(". ") : undefined;
}

async function authRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !result.success) {
    const validationError = !result.success
      ? getValidationError(result.data)
      : undefined;

    throw new Error(
      validationError ??
        (!result.success ? result.message : undefined) ??
        "Request failed",
    );
  }

  return result.data;
}

export function signup(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  return authRequest<AuthUser>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  return authRequest<AuthUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getCurrentUser(): Promise<AuthUser> {
  return authRequest<AuthUser>("/api/auth/me");
}

export function logout(): Promise<void> {
  return authRequest<void>("/api/auth/logout", {
    method: "POST",
  });
}

export function logoutAll(): Promise<void> {
  return authRequest<void>("/api/auth/logout-all", {
    method: "POST",
  });
}
