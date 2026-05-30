import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline";

import "dotenv/config";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function askConfirmation(): Promise<boolean> {
  const args = process.argv.slice(2);
  if (args.includes("--force") || args.includes("-y")) {
    return true;
  }

  const rl = readline.createInterface({ input, output });
  try {
    const answer = await new Promise<string>((resolve) => {
      rl.question(
        "\n⚠️  WARNING: This will delete ALL data in the public schema. Continue? (y/N): ",
        resolve,
      );
    });
    return answer.toLowerCase() === "y" || answer.toLowerCase() === "yes";
  } finally {
    rl.close();
  }
}

async function resetDatabase() {
  const confirmed = await askConfirmation();
  if (!confirmed) {
    console.log("❌ Reset cancelled.");
    return;
  }

  console.log("\n🧹 Preparing to reset PostgreSQL database...");
  const maskedUrl = DATABASE_URL?.replace(/:([^:@]+)@/, ":****@");
  console.log(`📡 Connecting to: ${maskedUrl}`);

  const sql = postgres(DATABASE_URL ?? "", { max: 1 });

  try {
    // Test connection
    await sql`SELECT 1`;
    console.log("✅ Database connection successful\n");

    console.log("🔥 Dropping and recreating public schema...");

    // We use a transaction to ensure we don't leave the DB in a broken state
    await sql.begin(async (sql) => {
      // Drop the entire public schema and recreate it
      // This is the most robust way to ensure everything (tables, enums, sequences, etc.) is gone
      await sql`DROP SCHEMA IF EXISTS public CASCADE`;
      await sql`CREATE SCHEMA public`;
      await sql`GRANT ALL ON SCHEMA public TO public`;
      await sql`COMMENT ON SCHEMA public IS 'standard public schema'`;
    });

    console.log("✅ Schema reset successful.");

    console.log("\n✨ Database reset complete!");
    console.log("\n🚀 Next steps:");
    console.log("   1. Run migrations: bun run db:migrate");
    console.log("   2. Seed database: bun run db:seed");
    console.log("   3. Start the app: bun run dev");
  } catch (error) {
    console.error(
      "\n❌ Reset failed:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  } finally {
    await sql.end();
  }
}

resetDatabase();
