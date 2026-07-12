import "dotenv/config";

import cors from "cors";
import express from "express";
import helmet from "helmet";
import { Pool } from "pg";

import type {
  ApiResponse,
  HealthResponse,
} from "@project/shared";

const app = express();

const port = Number(process.env.PORT ?? 5000);

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin));

app.use(helmet());
app.use(express.json());

app.use(
  cors({
    origin(origin, callback) {
      // Allows server-to-server requests and tools such as Postman.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS rejected origin: ${origin}`));
    },
    credentials: true,
  }),
);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}

const database = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
  max: 5,
});

app.get(
  "/api/health",
  async (_request, response) => {
    await database.query("SELECT 1");

    const result: ApiResponse<HealthResponse> = {
      success: true,
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    };

    response.status(200).json(result);
  },
);

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error);

    response.status(500).json({
      success: false,
      message: "An internal server error occurred",
    } satisfies ApiResponse<never>);
  },
);

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on port ${port}`);
});