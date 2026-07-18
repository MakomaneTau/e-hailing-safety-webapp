import type { CorsOptions } from "cors";

import { env } from "./env";

export const corsOptions: CorsOptions = {
  credentials: true,

  origin(origin, callback) {
    if (!origin || origin === env.FRONTEND_URL) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS rejected origin: ${origin}`));
  },

  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Accept"],
};