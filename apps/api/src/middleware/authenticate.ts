import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { ApiError } from "../lib/api-error";
import { findUserBySessionHash } from "../modules/auth/auth.repository";
import {
  hashSessionToken,
  sessionCookieName,
} from "../modules/auth/session";

export async function authenticate(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawToken = request.cookies?.[sessionCookieName];

    if (typeof rawToken !== "string" || !rawToken) {
      throw new ApiError(401, "Authentication required");
    }

    const record = await findUserBySessionHash(
      hashSessionToken(rawToken),
    );

    if (!record || record.disabledAt) {
      throw new ApiError(401, "Authentication required");
    }

    request.sessionToken = rawToken;

    request.user = {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      emailVerified: record.emailVerified,
      createdAt: record.createdAt.toISOString(),
    };

    next();
  } catch (error) {
    next(error);
  }
}