import type {
  NextFunction,
  Request,
  Response,
} from "express";

import type { ApiResponse } from "@project/shared";

import { env } from "../config/env";
import { ApiError } from "../lib/api-error";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof ApiError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
      data: error.details,
    } satisfies ApiResponse<unknown>);

    return;
  }

  console.error(error);

  response.status(500).json({
    success: false,
    message:
      env.NODE_ENV === "production"
        ? "An internal server error occurred"
        : error instanceof Error
          ? error.message
          : "An internal server error occurred",
  } satisfies ApiResponse<never>);
}