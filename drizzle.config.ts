import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit configuration for generating and applying migrations against
 * Neon Postgres. Reads DATABASE_URL from the environment.
 */
export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
} satisfies Config;
