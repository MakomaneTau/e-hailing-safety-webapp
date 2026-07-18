import {
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";

import type { CookieOptions } from "express";

import { env } from "../../config/env";

export const sessionCookieName =
  env.NODE_ENV === "production"
    ? "__Host-session"
    : "session";

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionData(userId: string) {
  const token = generateSessionToken();

  const expiresAt = new Date(
    Date.now() +
      env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  return {
    id: randomUUID(),
    userId,
    token,
    tokenHash: hashSessionToken(token),
    expiresAt,
  };
}

export function getSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.COOKIE_SAME_SITE,
    path: "/",
    maxAge:
      env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function getClearCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.COOKIE_SAME_SITE,
    path: "/",
  };
}