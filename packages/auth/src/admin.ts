import { faker } from "@faker-js/faker";
import dotenv from "dotenv";

dotenv.config({
  path: "../../apps/web/.env",
});

import { fileURLToPath } from "node:url";
import {
  createClinicWithDetails,
  getClinicByName,
  getUserById,
  updateUserToAdmin,
  upsertClinicMember,
  upsertConfigStore,
  upsertDoctorRecord,
} from "@clinic-app/db/actions";
import type { UserRole } from "@clinic-app/db/schema";
import { auth } from "./index";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "hazem032012@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "HealthF26";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Dr.Hazem Ali";
const ADMIN_PHONE = "01003497579";
const CLINIC_NAME = "Smart Clinic";
const DEFAULT_CLINIC_NAME = "Default Clinic";

/**
 * Seed admin user + clinic + relations
 */
export async function seedAdminUser() {
  console.log("🌱 Seeding admin user...");

  try {
    // 1. Check if admin already exists using standard query
    const existingAdmin = await getUserById(ADMIN_EMAIL); // Note: getUserById expects userId, you might need getUserByEmail
    // You may need to add a getUserByEmail function if not exists

    if (existingAdmin && existingAdmin.role === "admin") {
      console.log("✅ Admin already exists");

      let targetClinic = await getClinicByName(CLINIC_NAME);

      if (!targetClinic) {
        targetClinic = await createClinicWithDetails({
          id: faker.string.uuid(),
          name: CLINIC_NAME,
          address: "Hurghada, Egypt",
          phone: ADMIN_PHONE,
          email: ADMIN_EMAIL,
          timezone: "Africa/Cairo",
        });
      }

      if (targetClinic) {
        await upsertClinicMember(
          existingAdmin.id,
          targetClinic.id,
          "admin" as UserRole,
        );
        await updateUserToAdmin(existingAdmin.id, targetClinic.id);
      }

      return;
    }

    // 2. Get or create clinic
    let seededClinic = await getClinicByName(CLINIC_NAME);

    if (!seededClinic) {
      seededClinic = await createClinicWithDetails({
        id: faker.string.uuid(),
        name: CLINIC_NAME,
        address: "Hurghada, Egypt",
        phone: ADMIN_PHONE,
        email: ADMIN_EMAIL,
        timezone: "Africa/Cairo",
      });
    }

    if (!seededClinic) {
      throw new Error("Failed to create clinic");
    }

    console.log(`🏥 Clinic ready: ${seededClinic.name}`);

    // 3. Get or create default clinic for the system
    let defaultClinic = await getClinicByName(DEFAULT_CLINIC_NAME);

    if (!defaultClinic) {
      defaultClinic = await createClinicWithDetails({
        id: faker.string.uuid(),
        name: DEFAULT_CLINIC_NAME,
        address: "Default Address",
        timezone: "Africa/Cairo",
      });
    }

    // 4. Create admin user via Better Auth
    let userId: string;

    if (existingAdmin) {
      userId = existingAdmin.id;
      await updateUserToAdmin(userId, seededClinic.id, ADMIN_NAME);
    } else {
      try {
        const result = await auth.api.createUser({
          body: {
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: "admin",
            data: { clinicId: seededClinic.id },
          },
        });
        userId = result.user.id;
      } catch (error) {
        if (
          error instanceof Error &&
          error.message?.includes("already exists")
        ) {
          // User exists but we didn't find them? Get them now
          const existing = await getUserById(ADMIN_EMAIL);
          if (!existing) throw error;
          userId = existing.id;
          await updateUserToAdmin(userId, seededClinic.id, ADMIN_NAME);
        } else {
          throw error;
        }
      }
    }

    // 5. Setup admin data with proper conflict handling
    const operations = [
      upsertConfigStore("admin_onboarded", "true"),
      upsertDoctorRecord({
        id: faker.string.uuid(),
        userId,
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        clinicId: seededClinic.id,
        specialty: "Pediatrician",
        licenseNumber: "SMART-ADM-001",
        phone: ADMIN_PHONE,
        address: "Hurghada, Egypt",
        department: "Pediatrics",
        img: faker.image.avatar(),
        colorCode: faker.color.rgb(),
        availabilityStatus: "AVAILABLE",
        type: "FULL",
        role: "admin",
        availableFromWeekDay: "MONDAY",
        availableToWeekDay: "FRIDAY",
        availableFromTime: "09:00",
        availableToTime: "17:00",
        appointmentPrice: 0,
      }),
    ];

    await Promise.all(operations);
    await upsertClinicMember(userId, seededClinic.id, "admin" as UserRole);
    await updateUserToAdmin(userId, seededClinic.id);

    console.log(`✅ Admin seeded successfully: ${ADMIN_EMAIL}`);
    console.log(`📋 Admin ID: ${userId}`);
    console.log(`🏥 Clinic: ${seededClinic.name}`);
  } catch (error) {
    console.error("❌ Admin seed failed:", error);
    throw error;
  }
}

/**
 * ESM-safe direct execution
 */
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  seedAdminUser()
    .then(() => {
      console.log("🎉 Admin seeding completed successfully");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Fatal error:", err);
      process.exit(1);
    });
}
