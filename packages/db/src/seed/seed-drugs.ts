import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import { eq } from "drizzle-orm";

import type { DB as AppDb } from "../";
import { type DrugRoute, doseGuideline, drug as drugs } from "../schema";

/* =======================
   Types (unchanged)
======================= */

type DoseGuidelineData = {
  ROUTE: string;
  CLINICAL_INDICATION: string;
  MIN_DOSE_PER_KG: number | string;
  MAX_DOSE_PER_KG: number | string;
  DOSE_UNIT: string;
  FREQUENCY_DAYS: string;
  GESTATIONAL_AGE_WEEKS_MIN: number | string;
  GESTATIONAL_AGE_WEEKS_MAX: number | string;
  POST_NATAL_AGE_DAYS_MIN: number | string;
  POST_NATAL_AGE_DAYS_MAX: number | string;
  MAX_DOSE_PER_24H: number | string;
  STOCK_CONCENTRATION_MG_ML: number | string;
  FINAL_CONCENTRATION_MG_ML: number | string;
  MIN_INFUSION_TIME_MIN: number | string;
  COMPATIBILITY_DILUENT: string;
};

type DrugDatabase = {
  [drugName: string]: DoseGuidelineData[];
};

/* =======================
   Helpers (unchanged)
======================= */

function parseNumericValue(value: string | number): number | null {
  if (value === "N/A" || value === "" || value == null) return null;
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat(value.trim());
  return Number.isNaN(parsed) ? null : parsed;
}

function parseIntegerValue(value: string | number): number | null {
  if (value === "N/A" || value === "" || value == null) return null;
  if (typeof value === "number") return Math.floor(value);
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

const ROUTE_MAP: Record<string, DrugRoute> = {
  PO: "ORAL",
  ORAL: "ORAL",
  IV: "INTRAVENOUS",
  INTRAVENOUS: "INTRAVENOUS",
  IM: "INTRAMUSCULAR",
  INTRAMUSCULAR: "INTRAMUSCULAR",
  SC: "SUBCUTANEOUS",
  SUBCUTANEOUS: "SUBCUTANEOUS",
  TOPICAL: "TOPICAL",
  INHALATION: "INHALATION",
  RECTAL: "RECTAL",
};

function normalizeDrugRoute(route: string): DrugRoute {
  const normalized = ROUTE_MAP[route.trim().toUpperCase()];
  if (!normalized) {
    throw new Error(`Unsupported drug route in seed data: ${route}`);
  }
  return normalized;
}

/* =======================
   Drizzle Seed
======================= */

export default async function drugSeed(db: AppDb) {
  console.log("🌱 Starting NICU Drug Database seeding...");

  const filePath = path.join(
    import.meta.dirname,
    "../../../data/nicu_data.json",
  );
  console.log(`📖 Reading data from: ${filePath}`);

  const drugData = JSON.parse(
    fs.readFileSync(filePath, "utf-8"),
  ) as DrugDatabase;

  const drugNames = Object.keys(drugData);
  console.log(`📊 Found ${drugNames.length} drugs`);

  const guidelinesBuffer: (typeof doseGuideline.$inferInsert)[] = [];
  let totalGuidelines = 0;

  for (const [drugName, guidelines] of Object.entries(drugData)) {
    /* ---------- upsert drug ---------- */
    const existingDrugs = await db
      .select()
      .from(drugs)
      .where(eq(drugs.name, drugName))
      .limit(1);
    let drug = existingDrugs[0];

    if (!drug) {
      const id = randomUUID();
      await db.insert(drugs).values({ id, name: drugName });
      drug = {
        id,
        clinicId: null,
        name: drugName,
        genericName: null,
        brandName: null,
        description: null,
        sideEffects: null,
        quantityInStock: 0,
        interactions: null,
        contraindications: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    /* ---------- collect guidelines ---------- */
    for (const g of guidelines) {
      guidelinesBuffer.push({
        id: randomUUID(),
        drugId: drug.id,
        route: normalizeDrugRoute(g.ROUTE),
        clinicalIndication: g.CLINICAL_INDICATION,

        minDosePerKg: parseNumericValue(g.MIN_DOSE_PER_KG),
        maxDosePerKg: parseNumericValue(g.MAX_DOSE_PER_KG),
        doseUnit: g.DOSE_UNIT === "N/A" ? null : g.DOSE_UNIT,
        frequencyDays: g.FREQUENCY_DAYS === "N/A" ? null : g.FREQUENCY_DAYS,

        gestationalAgeWeeksMin: parseNumericValue(g.GESTATIONAL_AGE_WEEKS_MIN),
        gestationalAgeWeeksMax: parseNumericValue(g.GESTATIONAL_AGE_WEEKS_MAX),

        postNatalAgeDaysMin: parseIntegerValue(g.POST_NATAL_AGE_DAYS_MIN),
        postNatalAgeDaysMax: parseIntegerValue(g.POST_NATAL_AGE_DAYS_MAX),

        maxDosePer24h: parseNumericValue(g.MAX_DOSE_PER_24H),
        stockConcentrationMgMl: parseNumericValue(g.STOCK_CONCENTRATION_MG_ML),
        finalConcentrationMgMl: parseNumericValue(g.FINAL_CONCENTRATION_MG_ML),
        minInfusionTimeMin: parseIntegerValue(g.MIN_INFUSION_TIME_MIN),

        compatibilityDiluent:
          g.COMPATIBILITY_DILUENT === "N/A" ? null : g.COMPATIBILITY_DILUENT,
      });
    }

    totalGuidelines += guidelines.length;
    console.log(`✅ ${drugName}: ${guidelines.length} guidelines`);
  }

  /* ---------- batch insert ---------- */
  const BATCH_SIZE = 1000;
  console.log(`⏳ Inserting ${guidelinesBuffer.length} guidelines...`);

  for (let i = 0; i < guidelinesBuffer.length; i += BATCH_SIZE) {
    await db
      .insert(doseGuideline)
      .values(guidelinesBuffer.slice(i, i + BATCH_SIZE));
  }

  console.log("🎉 NICU Drug Database seeded successfully!");
  console.log(
    `📈 Summary — Drugs: ${drugNames.length}, Guidelines: ${totalGuidelines}`,
  );
}
