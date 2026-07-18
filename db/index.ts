import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "The managed SQL binding `DB` is unavailable. Configure the production database binding before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}
