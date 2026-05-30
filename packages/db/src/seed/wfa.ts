// scripts/seed-who-growth-data.ts

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { db } from "../";
import { whoGrowthStandard } from "../schema";
import { Gender } from "../seed/seed";

type WHODayData = {
  Day: string;
  L: string;
  M: string;
  S: string;
  SD4neg: string;
  SD3neg: string;
  SD2neg: string;
  SD1neg: string;
  SD0: string;
  SD1: string;
  SD2: string;
  SD3: string;
  SD4: string;
};

type WHOData = {
  wfa: {
    boys: WHODayData[];
    girls: WHODayData[];
  };
};

export default async function seedWHOGrowthData() {
  console.log("🌱 Seeding WHO growth data...");

  // 1️⃣ Read JSON
  const dataPath = path.join(process.cwd(), "data", "wfa.json");
  const rawData = fs.readFileSync(dataPath, "utf-8");
  const whoData = JSON.parse(rawData) as WHOData;

  // 2️⃣ Clear existing data (fastest & safest)
  console.log("🗑️ Clearing existing WHO growth data...");
  await db.delete(whoGrowthStandard).execute();

  const records: (typeof whoGrowthStandard.$inferInsert)[] = [];

  // 3️⃣ Boys
  for (const dayData of whoData.wfa.boys) {
    const ageDays = Number.parseInt(dayData.Day, 10);

    records.push({
      id: randomUUID(),
      ageDays,
      ageInMonths: Math.floor(ageDays / 30.4375),
      gender: Gender.MALE,
      measurementType: "WEIGHT",
      lValue: Number(dayData.L),
      mValue: Number(dayData.M),
      sValue: Number(dayData.S),
      sd0: Number(dayData.SD0),
      sd1neg: Number(dayData.SD1neg),
      sd1pos: Number(dayData.SD1),
      sd2neg: Number(dayData.SD2neg),
      sd2pos: Number(dayData.SD2),
      sd3neg: Number(dayData.SD3neg),
      sd3pos: Number(dayData.SD3),
      sd4neg: Number(dayData.SD4neg),
      sd4pos: Number(dayData.SD4),
    });
  }

  // 4️⃣ Girls
  for (const dayData of whoData.wfa.girls) {
    const ageDays = Number.parseInt(dayData.Day, 10);

    records.push({
      id: randomUUID(),
      ageDays,
      ageInMonths: Math.floor(ageDays / 30.4375),
      gender: Gender.FEMALE,
      measurementType: "WEIGHT",
      lValue: Number(dayData.L),
      mValue: Number(dayData.M),
      sValue: Number(dayData.S),
      sd0: Number(dayData.SD0),
      sd1neg: Number(dayData.SD1neg),
      sd1pos: Number(dayData.SD1),
      sd2neg: Number(dayData.SD2neg),
      sd2pos: Number(dayData.SD2),
      sd3neg: Number(dayData.SD3neg),
      sd3pos: Number(dayData.SD3),
      sd4neg: Number(dayData.SD4neg),
      sd4pos: Number(dayData.SD4),
    });
  }

  // 5️⃣ Batched insert (SQLite-safe)
  const BATCH_SIZE = 1000;
  let inserted = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    await db.insert(whoGrowthStandard).values(batch).execute();

    inserted += batch.length;
    console.log(`  ✅ Inserted ${batch.length} records`);
  }

  console.log(`🎉 Seeded ${inserted} WHO WFA records`);
}
