import path from "node:path";
import { env } from "@clinic-app/env/server";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { relations } from "./relations";

// Simple Logger Helper
const logger = {
  info: (msg: string, ...args: unknown[]) =>
    console.log(`[DB-INFO] ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) =>
    console.warn(`[DB-WARN] ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) =>
    console.error(`[DB-ERROR] ${msg}`, ...args),
  debug: (msg: string, ...args: unknown[]) =>
    env.NODE_ENV !== "production" &&
    console.debug(`[DB-DEBUG] ${msg}`, ...args),
};

const globalForDb = globalThis as unknown as {
  client: postgres.Sql | undefined;
};

const client =
  globalForDb.client ??
  postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 1800,
  });

if (env.NODE_ENV !== "production") globalForDb.client = client;

export const db = drizzle({
  client,
  relations,
  logger: env.NODE_ENV === "development",
});

export function createDb() {
  return drizzle({
    client: postgres(env.DATABASE_URL),
    relations,
  });
}

export async function checkIsDbReady(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    logger.debug("Database connection check successful");
    return true;
  } catch (error) {
    logger.error("Database connection check failed", error);
    return false;
  }
}

let migrationFnCalled = false;

export async function runMigrations(): Promise<void> {
  const fnName = "runMigrations";

  if (migrationFnCalled) {
    logger.debug(`[${fnName}] Skipping migration (already called)`);
    return;
  }

  migrationFnCalled = true;

  if (env.IS_BUILD) {
    logger.info(
      `[${fnName}] Skipping migrations during build process (NODE_ENV: ${env.NODE_ENV})`,
    );
    return;
  }

  // Note: Usually you WANT to run migrations in production.
  // If you strictly want to skip them, keep this, but ensure your CI/CD handles it.
  if (env.NODE_ENV !== "production") {
    logger.info(
      `[${fnName}] Running in ${env.NODE_ENV}, applying migrations...`,
    );
  } else {
    logger.info(`[${fnName}] Applying migrations for production...`);
  }

  const migrationsFolder = path.join(
    process.cwd(),
    "packages/db/src/migrations",
  );

  try {
    logger.info(`[${fnName}] Starting migration process...`);
    await migrate(db, { migrationsFolder });
    logger.info(`[${fnName}] ✅ Database migration completed successfully`);
  } catch (error) {
    logger.error(`[${fnName}] ❌ Database migration failed`, error);
    throw error;
  }
}

export type DB = typeof db;
export type DBType = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DBorTx = DB | DBType;
