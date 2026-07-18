import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { env } from "../config/env";
import { ApiError } from "../lib/api-error";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function validateOrigin(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  if (safeMethods.has(request.method)) {
    next();
    return;
  }

  const origin = request.get("origin");

  if (!origin && env.NODE_ENV !== "production") {
    next();
    return;
  }

  if (origin !== env.FRONTEND_URL) {
    next(new ApiError(403, "Request origin is not allowed"));
    return;
  }

  next();
}