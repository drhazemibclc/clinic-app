// db/optimizations.ts - Add query optimization

import { sql } from "drizzle-orm";
import type { DB } from ".";

// Add materialized views for dashboard analytics
export const createMaterializedViews = async (db: DB) => {
  // Daily appointment summary view
  await db.execute(sql`
    CREATE MATERIALIZED VIEW IF NOT EXISTS daily_appointment_summary AS
    SELECT
      DATE(appointment_date) as date,
      clinic_id,
      COUNT(*) as total_appointments,
      COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled,
      SUM(appointment_price) as total_revenue
    FROM appointment
    WHERE is_deleted = false
    GROUP BY DATE(appointment_date), clinic_id
  `);

  // Immunization coverage view
  await db.execute(sql`
    CREATE MATERIALIZED VIEW IF NOT EXISTS immunization_coverage AS
    SELECT
      p.clinic_id,
      i.vaccine,
      COUNT(DISTINCT i.patient_id) as vaccinated_count,
      COUNT(DISTINCT p.id) as eligible_patients
    FROM patient p
    LEFT JOIN immunization i ON p.id = i.patient_id
    WHERE p.is_deleted = false
    GROUP BY p.clinic_id, i.vaccine
  `);
};

// Add query caching with D1/Postgres
export const cachedQuery = <T>(
  key: string,
  query: () => Promise<T>,
  ttl = 300000, // 5 minutes
) => {
  const cache = new Map();
  return async () => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    const data = await query();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  };
};
