import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

/**
 * Applies SQL migrations from ./drizzle to the connected Neon database.
 * Run with:  npm run db:migrate
 *
 * This is intentionally non-destructive — it only applies pending migrations.
 * It never drops tables or data.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("\n[migrate] DATABASE_URL is not set. Add it to .env.local first.\n");
    process.exit(1);
  }

  console.log("[migrate] Applying migrations to Neon...");
  const sql = neon(url);
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[migrate] Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[migrate] Failed:", err);
  process.exit(1);
});
