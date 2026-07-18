import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { ApiError } from "../lib/api-error";
import type { UserRole } from "../modules/auth/auth.types";

export function requireRole(...allowedRoles: UserRole[]) {
  return (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void => {
    if (!request.user) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      next(new ApiError(403, "Insufficient permissions"));
      return;
    }

    next();
  };
}