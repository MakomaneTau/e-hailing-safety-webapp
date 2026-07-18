import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import type {
  ApiResponse,
  HealthResponse,
} from "@project/shared";

import { corsOptions } from "./config/cors";
import { database } from "./database/pool";
import { errorHandler } from "./middleware/error-handler";
import { notFound } from "./middleware/not-found";
import { validateOrigin } from "./middleware/validate-origin";
import { authRouter } from "./modules/auth/auth.routes";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(validateOrigin);

app.get("/api/health", async (_request, response) => {
  await database.query("SELECT 1");

  response.status(200).json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  } satisfies ApiResponse<HealthResponse>);
});

app.use("/api/auth", authRouter);

app.use(notFound);
app.use(errorHandler);