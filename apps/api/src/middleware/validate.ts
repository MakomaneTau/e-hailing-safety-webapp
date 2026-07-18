import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

import type { ApiResponse } from "@project/shared";

export function validateBody(schema: ZodType) {
  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ): void => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      response.status(400).json({
        success: false,
        message: "Invalid request data",
        data: result.error.issues,
      } satisfies ApiResponse<unknown>);

      return;
    }

    request.body = result.data;
    next();
  };
}