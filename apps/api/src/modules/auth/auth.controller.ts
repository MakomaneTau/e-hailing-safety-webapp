import type { Request, Response } from "express";

import type { ApiResponse } from "@project/shared";

import { ApiError } from "../../lib/api-error";
import type {
  LoginInput,
  SignupInput,
} from "./auth.schema";
import {
  getCurrentUser,
  login,
  logout,
  logoutAll,
  signup,
} from "./auth.service";
import {
  getClearCookieOptions,
  getSessionCookieOptions,
  sessionCookieName,
} from "./session";
import type { PublicUser } from "./auth.types";

export async function signupController(
  request: Request<unknown, unknown, SignupInput>,
  response: Response<ApiResponse<PublicUser>>,
): Promise<void> {
  const result = await signup(
    request.body,
    request.get("user-agent"),
  );

  response.cookie(
    sessionCookieName,
    result.sessionToken,
    getSessionCookieOptions(),
  );

  response.status(201).json({
    success: true,
    data: result.user,
  });
}

export async function loginController(
  request: Request<unknown, unknown, LoginInput>,
  response: Response<ApiResponse<PublicUser>>,
): Promise<void> {
  const result = await login(
    request.body,
    request.get("user-agent"),
  );

  response.cookie(
    sessionCookieName,
    result.sessionToken,
    getSessionCookieOptions(),
  );

  response.status(200).json({
    success: true,
    data: result.user,
  });
}

export async function logoutController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.sessionToken) {
    throw new ApiError(401, "Authentication required");
  }

  await logout(request.sessionToken);

  response.clearCookie(
    sessionCookieName,
    getClearCookieOptions(),
  );

  response.status(204).send();
}

export async function logoutAllController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.user) {
    throw new ApiError(401, "Authentication required");
  }

  await logoutAll(request.user.id);

  response.clearCookie(
    sessionCookieName,
    getClearCookieOptions(),
  );

  response.status(204).send();
}

export async function meController(
  request: Request,
  response: Response<ApiResponse<PublicUser>>,
): Promise<void> {
  if (!request.user) {
    throw new ApiError(401, "Authentication required");
  }

  const user = await getCurrentUser(request.user.id);

  response.status(200).json({
    success: true,
    data: user,
  });
}