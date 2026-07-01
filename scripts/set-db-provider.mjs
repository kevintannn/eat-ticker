// Patches the Prisma datasource `provider` to match the target database.
//
// Prisma does not allow `provider = env(...)`, so we rewrite the schema in place
// before running any prisma command. Defaults to sqlite for local development;
// set DATABASE_PROVIDER=postgresql (as on Vercel) to target Neon/Postgres.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "..", "prisma", "schema.prisma");

const provider = process.env.DATABASE_PROVIDER === "postgresql" ? "postgresql" : "sqlite";

const schema = readFileSync(schemaPath, "utf8");
// Only the datasource block uses "sqlite"/"postgresql"; the generator uses
// "prisma-client-js", so this replace targets the datasource provider uniquely.
const patched = schema.replace(/provider = "(sqlite|postgresql)"/, `provider = "${provider}"`);

if (patched !== schema) {
  writeFileSync(schemaPath, patched);
}

console.log(`[set-db-provider] Prisma datasource provider = ${provider}`);
