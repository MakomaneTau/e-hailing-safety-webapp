import { randomUUID } from "node:crypto";

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
import type {
  LoginInput,
  SignupInput,
} from "./auth.schema";
import {
  createSessionData,
  hashSessionToken,
} from "./session";
import type {
  AuthResult,
  PublicUser,
  UserRecord,
} from "./auth.types";

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
    throw new ApiError(
      409,
      "An account with this email already exists",
    );
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
      throw new ApiError(
        409,
        "An account with this email already exists",
      );
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

  const validPassword = await argon2.verify(
    user.passwordHash,
    input.password,
  );

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

export async function logout(
  rawSessionToken: string,
): Promise<void> {
  await deleteSession(hashSessionToken(rawSessionToken));
}

export async function logoutAll(userId: string): Promise<void> {
  await deleteAllUserSessions(userId);
}

export async function getCurrentUser(
  userId: string,
): Promise<PublicUser> {
  const user = await findUserById(userId);

  if (!user || user.disabledAt) {
    throw new ApiError(401, "Authentication required");
  }

  return toPublicUser(user);
}