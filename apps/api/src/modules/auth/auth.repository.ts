import type {
  Pool,
  PoolClient,
  QueryResultRow,
} from "pg";

import { database } from "../../database/pool";
import type {
  SessionUserRecord,
  UserRecord,
  UserRole,
} from "./auth.types";

type DatabaseConnection = Pool | PoolClient;

interface UserRow extends QueryResultRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  email_verified: boolean;
  disabled_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface SessionUserRow extends UserRow {
  session_id: string;
  session_expires_at: Date;
}

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    emailVerified: row.email_verified,
    disabledAt: row.disabled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findUserByEmail(
  email: string,
  connection: DatabaseConnection = database,
): Promise<UserRecord | null> {
  const result = await connection.query<UserRow>(
    `
      SELECT
        id,
        name,
        email,
        password_hash,
        role,
        email_verified,
        disabled_at,
        created_at,
        updated_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email],
  );

  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function findUserById(
  id: string,
  connection: DatabaseConnection = database,
): Promise<UserRecord | null> {
  const result = await connection.query<UserRow>(
    `
      SELECT
        id,
        name,
        email,
        password_hash,
        role,
        email_verified,
        disabled_at,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function createUser(
  input: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
  },
  connection: DatabaseConnection,
): Promise<UserRecord> {
  const result = await connection.query<UserRow>(
    `
      INSERT INTO users (
        id,
        name,
        email,
        password_hash
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        name,
        email,
        password_hash,
        role,
        email_verified,
        disabled_at,
        created_at,
        updated_at
    `,
    [
      input.id,
      input.name,
      input.email,
      input.passwordHash,
    ],
  );

  return mapUser(result.rows[0]);
}

export async function createSession(
  input: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
  },
  connection: DatabaseConnection = database,
): Promise<void> {
  await connection.query(
    `
      INSERT INTO sessions (
        id,
        user_id,
        token_hash,
        expires_at,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      input.id,
      input.userId,
      input.tokenHash,
      input.expiresAt,
      input.userAgent ?? null,
    ],
  );
}

export async function findUserBySessionHash(
  tokenHash: string,
): Promise<SessionUserRecord | null> {
  const result = await database.query<SessionUserRow>(
    `
      SELECT
        users.id,
        users.name,
        users.email,
        users.password_hash,
        users.role,
        users.email_verified,
        users.disabled_at,
        users.created_at,
        users.updated_at,
        sessions.id AS session_id,
        sessions.expires_at AS session_expires_at
      FROM sessions
      INNER JOIN users
        ON users.id = sessions.user_id
      WHERE sessions.token_hash = $1
        AND sessions.expires_at > NOW()
      LIMIT 1
    `,
    [tokenHash],
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    ...mapUser(row),
    sessionId: row.session_id,
    sessionExpiresAt: row.session_expires_at,
  };
}

export async function deleteSession(
  tokenHash: string,
): Promise<void> {
  await database.query(
    "DELETE FROM sessions WHERE token_hash = $1",
    [tokenHash],
  );
}

export async function deleteAllUserSessions(
  userId: string,
): Promise<void> {
  await database.query(
    "DELETE FROM sessions WHERE user_id = $1",
    [userId],
  );
}

export async function deleteExpiredSessions(): Promise<void> {
  await database.query(
    "DELETE FROM sessions WHERE expires_at <= NOW()",
  );
}