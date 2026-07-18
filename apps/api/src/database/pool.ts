import { Pool } from "pg";

import { env } from "../config/env";

export const database = new Pool({
  connectionString: env.DATABASE_URL,

  ssl:
    env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,

  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

database.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error", error);
});