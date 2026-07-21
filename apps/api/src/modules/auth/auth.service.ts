import { createHash, randomBytes, randomUUID } from "node:crypto";

import argon2 from "argon2";
import type { DatabaseError } from "pg";

import { database } from "../../database/pool";
import { ApiError } from "../../lib/api-error";
import {
  createSession,
  createUser,
  deleteAllUserSessions,
  deleteSession,
  findUserByEmail,
  findUserById,
} from "./auth.repository";
import type { LoginInput, SignupInput } from "./auth.schema";
import { createSessionData, hashSessionToken } from "./session";
import type { AuthResult, PublicUser, UserRecord } from "./auth.types";

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as DatabaseError).code === "23505"
  );
}

export async function signup(
  input: SignupInput,
  userAgent?: string,
): Promise<AuthResult> {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  const client = await database.connect();

  try {
    await client.query("BEGIN");

    const user = await createUser(
      {
        id: randomUUID(),
        name: input.name,
        email: input.email,
        passwordHash,
      },
      client,
    );

    const session = createSessionData(user.id);

    await createSession(
      {
        id: session.id,
        userId: session.userId,
        tokenHash: session.tokenHash,
        expiresAt: session.expiresAt,
        userAgent,
      },
      client,
    );

    await client.query("COMMIT");

    return {
      user: toPublicUser(user),
      sessionToken: session.token,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    if (isUniqueViolation(error)) {
      throw new ApiError(409, "An account with this email already exists");
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function login(
  input: LoginInput,
  userAgent?: string,
): Promise<AuthResult> {
  const user = await findUserByEmail(input.email);

  if (!user) {
    // Performs expensive work even when the email does not exist.
    await argon2.hash(input.password, {
      type: argon2.argon2id,
    });

    throw new ApiError(401, "Invalid email or password");
  }

  const validPassword = await argon2.verify(user.passwordHash, input.password);

  if (!validPassword) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.disabledAt) {
    throw new ApiError(403, "This account is disabled");
  }

  const session = createSessionData(user.id);

  await createSession({
    id: session.id,
    userId: session.userId,
    tokenHash: session.tokenHash,
    expiresAt: session.expiresAt,
    userAgent,
  });

  return {
    user: toPublicUser(user),
    sessionToken: session.token,
  };
}

export async function logout(rawSessionToken: string): Promise<void> {
  await deleteSession(hashSessionToken(rawSessionToken));
}

export async function logoutAll(userId: string): Promise<void> {
  await deleteAllUserSessions(userId);
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await findUserById(userId);

  if (!user || user.disabledAt) {
    throw new ApiError(401, "Authentication required");
  }

  return toPublicUser(user);
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";


function base64Url(buffer: Buffer | Uint8Array): string {
  return Buffer.from(buffer).toString("base64url");
}

function sha256Base64Url(value: string): string {
  return createHash("sha256").update(value).digest().toString("base64url");
}

export function createPkcePair() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = sha256Base64Url(verifier);
  const state = randomBytes(32).toString("base64url");

  return { verifier, challenge, state };
}

export function buildGoogleAuthorizeUrl(state: string, challenge: string) {
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function exchangeGoogleCode(code: string, verifier: string) {
  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    code,
    code_verifier: verifier,
    grant_type: "authorization_code",
    redirect_uri: GOOGLE_REDIRECT_URI,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new ApiError(401, "Google sign-in failed");
  }

  return response.json() as Promise<{
    access_token: string;
    id_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
  }>;
}

export async function fetchGoogleProfile(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new ApiError(401, "Google profile could not be loaded");
  }

  return response.json() as Promise<{
    sub: string;
    email: string;
    email_verified: boolean;
    name: string;
    picture?: string;
  }>;
}

export async function finishGoogleLogin(profile: {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
}) {
  const existingUser = await findUserByEmail(profile.email);

  let user = existingUser;
  if (!user) {
    user = await createUser(
      {
        id: randomUUID(),
        name: profile.name,
        email: profile.email,
        passwordHash: randomBytes(32).toString("hex"),
      },
      database,
    );
    // mark email_verified = true for Google account in your repository layer
  }

  const session = createSessionData(user.id);

  await createSession({
    id: session.id,
    userId: session.userId,
    tokenHash: session.tokenHash,
    expiresAt: session.expiresAt,
    userAgent: undefined,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: true,
      createdAt: user.createdAt.toISOString(),
    },
    sessionToken: session.token,
  };
}