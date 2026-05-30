// t3 env reads import.meta.env; seed scripts run
import dotenv from "dotenv";

import type { DB } from "./";
import { runSeed } from "./seed/seed";
import drugSeed from "./seed/seed-drugs";
import wfaSeed from "./seed/seed-wfa";

dotenv.config({
  path: "../../apps/web/.env",
});

/**
 * Master seed runner
 */
async function runAllSeeds(db: DB) {
  console.log("🚀 Starting Master Seeding Orchestration...\n");

  await runSeed(db);
  console.log("✅ Base Data (Clinic / Faker) Seeded");
  console.log("--------------------------------------------------");

  await drugSeed(db);
  console.log("✅ NICU Drug Database Seeded");
  console.log("--------------------------------------------------");

  await wfaSeed(db);
  console.log("✅ WHO WFA (JSON) Seeded");
  console.log("--------------------------------------------------");

  console.log("🎉 All seeds completed successfully!");
}

/**
 * Top-level execution
 */
(async () => {
  try {
    const { db, checkIsDbReady } = await import("./index");
    await checkIsDbReady();
    await runAllSeeds(db);
  } catch (error) {
    console.error("❌ Master Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    // The postgres-js connection will close automatically on process exit
    process.exit();
  }
})();
