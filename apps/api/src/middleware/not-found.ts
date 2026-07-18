import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { ApiError } from "../lib/api-error";

export function notFound(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  next(
    new ApiError(
      404,
      `Route ${request.method} ${request.path} was not found`,
    ),
  );
}