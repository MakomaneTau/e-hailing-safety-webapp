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
  createPkcePair,
  buildGoogleAuthorizeUrl,
  exchangeGoogleCode,
  fetchGoogleProfile,
  finishGoogleLogin,
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

export async function googleStartController(
  _request: Request,
  response: Response,
): Promise<void> {
  const { state, challenge, verifier } = createPkcePair();

  response.cookie("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
  });

  response.cookie("oauth_verifier", verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
  });

  const authorizeUrl = buildGoogleAuthorizeUrl(state, challenge);

  response.redirect(authorizeUrl);
}

export async function googleCallbackController(
  request: Request,
  response: Response,
): Promise<void> {
  const { code, state } = request.query;

  const storedState = request.cookies?.oauth_state;
  const storedVerifier = request.cookies?.oauth_verifier;

  if (!code || typeof code !== "string") {
    throw new ApiError(400, "Missing authorization code");
  }

  if (!state || typeof state !== "string" || state !== storedState) {
    throw new ApiError(400, "Invalid state parameter");
  }

  if (!storedVerifier || typeof storedVerifier !== "string") {
    throw new ApiError(400, "PKCE verifier not found");
  }

  const tokenResponse = await exchangeGoogleCode(code, storedVerifier);
  const profile = await fetchGoogleProfile(tokenResponse.access_token);

  const result = await finishGoogleLogin(profile);

  response.clearCookie("oauth_state");
  response.clearCookie("oauth_verifier");

  response.cookie(
    sessionCookieName,
    result.sessionToken,
    getSessionCookieOptions(),
  );

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  response.redirect(`${frontendUrl}/dashboard`);
}