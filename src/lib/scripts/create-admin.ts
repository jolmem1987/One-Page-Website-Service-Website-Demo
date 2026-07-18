import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "../db/schema";

/**
 * Provisions the first (or an additional) administrator. There is NO public
 * registration — admins are created only via this script.
 *
 * Usage:
 *   npm run admin:create                         (interactive prompts)
 *   ADMIN_EMAIL=you@ex.com ADMIN_PASSWORD=... ADMIN_NAME="You" npm run admin:create
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("\n[admin:create] DATABASE_URL is not set. Add it to .env.local first.\n");
    process.exit(1);
  }

  let email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;
  let name = process.env.ADMIN_NAME;

  if (!email || !password) {
    const rl = createInterface({ input: stdin, output: stdout });
    email = email || (await rl.question("Admin email: "));
    name = name || (await rl.question("Admin name [Administrator]: ")) || "Administrator";
    password = password || (await rl.question("Admin password (min 10 chars): "));
    rl.close();
  }
  name = name || "Administrator";

  email = email.toLowerCase().trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("[admin:create] Invalid email.");
    process.exit(1);
  }
  if (!password || password.length < 10) {
    console.error("[admin:create] Password must be at least 10 characters.");
    process.exit(1);
  }

  const sql = neon(url);
  const db = drizzle(sql, { schema });

  const existing = await db
    .select({ id: schema.adminUsers.id })
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, email))
    .limit(1);

  const passwordHash = await bcrypt.hash(password, 12);

  if (existing.length > 0) {
    await db
      .update(schema.adminUsers)
      .set({ passwordHash, name, updatedAt: new Date() })
      .where(eq(schema.adminUsers.email, email));
    console.log(`[admin:create] Updated existing admin: ${email}`);
  } else {
    await db.insert(schema.adminUsers).values({ email, name, passwordHash });
    console.log(`[admin:create] Created admin: ${email}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("[admin:create] Failed:", err);
  process.exit(1);
});
