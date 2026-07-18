import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Database client for Neon Postgres.
 *
 * IMPORTANT: The template must build and render without a database. When
 * DATABASE_URL is absent, `db` is null and the data-access layer falls back to
 * the demo site config. Never assume `db` is non-null — use `getDb()`.
 */

let _db: NeonHttpDatabase<typeof schema> | null = null;

function init(): NeonHttpDatabase<typeof schema> | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (_db) return _db;
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

/** Returns the Drizzle client, or null when no database is configured. */
export function getDb(): NeonHttpDatabase<typeof schema> | null {
  return init();
}

/** True when a database connection string is configured. */
export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export { schema };
