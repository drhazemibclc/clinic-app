// utils/growth.server.ts - SERVER ONLY
import { db } from "..";
import type { Gender, MeasurementType } from "../schema";

export const getWHOStandard = async (
  ageDays: number,
  gender: Gender,
  type: MeasurementType,
) => {
  return await db.query.whoGrowthStandard.findFirst({
    where: { ageDays, gender, measurementType: type },
  });
};

export const getMultipleWHOStandards = async (
  params: Array<{ ageDays: number; gender: Gender; type: MeasurementType }>,
) => {
  return await Promise.all(
    params.map((p) => getWHOStandard(p.ageDays, p.gender, p.type)),
  );
};
