import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    PORT: z.coerce.number().int().positive().default(5000),

    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

    FRONTEND_URL: z.url("FRONTEND_URL must be a valid URL"),

    SESSION_TTL_DAYS: z.coerce.number().int().positive().max(30).default(7),

    COOKIE_SAME_SITE: z.enum(["lax", "none"]).default("lax"),

    GOOGLE_CLIENT_ID: z.string().optional(),

    GOOGLE_CLIENT_SECRET: z.string().optional(),

    GOOGLE_REDIRECT_URI: z.string().optional(),
  })
  .superRefine((values, context) => {
    if (
      values.NODE_ENV !== "production" &&
      values.COOKIE_SAME_SITE === "none"
    ) {
      context.addIssue({
        code: "custom",
        path: ["COOKIE_SAME_SITE"],
        message: "SameSite=None requires a secure HTTPS environment",
      });
    }
  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid API environment configuration:");
  console.error(z.treeifyError(result.error));
  process.exit(1);
}

export const env = result.data;