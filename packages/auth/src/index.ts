import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@clinic-app/db";
import {
  addUserToClinic,
  createClinic,
  createDoctorRecord,
  createPatientRecord,
  createStaffRecord,
  createUserQuota,
  getAdminCount,
  getAdminOnboardedStatus,
  getClinicById,
  getDefaultClinic,
  getInviteByCode,
  getUserById,
  getUserClinics,
  getUserFiles,
  getUserQuota,
  markInviteAsUsed,
  setAdminOnboarded,
  updateUserClinicId,
} from "@clinic-app/db/actions";
import * as schema from "@clinic-app/db/schema";
import { env } from "@clinic-app/env/server";
import { generateId } from "@clinic-app/utils";
import { betterAuth, isProduction } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { admin, customSession, openAPI, twoFactor } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { ac, admin as adminRole, doctor, patient, staff } from "./permissions";
import { getSettings } from "./settings.server";
import type { UserRole } from "./types";

export function createAuth() {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN],

    appName: "Clinic",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    user: {
      deleteUser: { enabled: true },
      additionalFields: {
        role: {
          type: ["doctor", "staff", "patient", "admin"],
          required: false,
          input: false,
        },
        apiKey: { type: "string", required: false, input: false },
        clinicId: { type: "string", required: false, input: true },
        address: { type: "string", required: false, input: true },
        phone: { type: "string", required: false, input: true },
      },
    },

    databaseHooks: {
      user: {
        create: {
          before: async (user, ctx) => {
            const [settings, isOnboarded] = await Promise.all([
              getSettings(),
              getAdminOnboardedStatus(),
            ]);

            if (settings.requireInvite) {
              const invite = ctx?.body?.invite as string | undefined;
              if (!invite) {
                throw new APIError("BAD_REQUEST", {
                  message: "Invite code is required for registration.",
                });
              }

              const inviteRecord = await getInviteByCode(invite);

              if (
                !inviteRecord ||
                (inviteRecord.expiresAt &&
                  inviteRecord.expiresAt < new Date()) ||
                inviteRecord.usedBy !== null
              ) {
                throw new APIError("BAD_REQUEST", {
                  message: "Invite code is invalid or has expired.",
                });
              }
            }

            // Determine role based on onboarding status
            const role = isOnboarded ? "patient" : "admin";

            return {
              data: { ...user, role },
            };
          },

          after: async (user, ctx) => {
            try {
              const userRole = user.role as UserRole;
              const clinicData = ctx?.body?.clinicData as
                | { name?: string; address?: string }
                | undefined;
              const inviteCode = ctx?.body?.invite as string | undefined;

              // Find or create clinic
              let clinicId: string;
              if (clinicData?.name) {
                clinicId = await createClinic(
                  clinicData.name,
                  clinicData.address ?? "",
                  user.email,
                );
              } else {
                const defaultClinic = await getDefaultClinic();

                if (defaultClinic) {
                  clinicId = defaultClinic.id;
                } else {
                  clinicId = await createClinic(
                    "Default Clinic",
                    "Default Address",
                    user.email,
                  );
                }
              }

              // Connect user to clinic
              await addUserToClinic(
                user.id,
                userRole as schema.UserRole,
                clinicId,
              );

              // Update user with clinic ID
              await updateUserClinicId(user.id, clinicId);

              // Create role-specific records
              const roleRecordData = {
                id: crypto.randomUUID(),
                userId: user.id,
                email: user.email,
                clinicId,
                role: userRole as schema.UserRole,
              };

              if (userRole === "doctor") {
                await createDoctorRecord({
                  ...roleRecordData,
                  name: user.name || "",
                });
              } else if (userRole === "staff") {
                await createStaffRecord({
                  ...roleRecordData,
                  name: user.name || "",
                });
              } else if (userRole === "patient") {
                const [firstName, ...lastParts] = (user.name || "").split(" ");
                await createPatientRecord({
                  ...roleRecordData,
                  firstName: firstName ?? "",
                  lastName: lastParts.join(" ") || "",
                });
              }

              // Mark invite as used
              if (inviteCode) {
                await markInviteAsUsed(inviteCode, user.id);
              }

              // Set onboarding flag if first admin
              if (userRole === "admin") {
                const adminCount = await getAdminCount();

                if (adminCount === 1) {
                  await setAdminOnboarded();
                }
              }

              // Create user quota
              const settings = await getSettings();
              await createUserQuota(
                user.id,
                userRole === "admin" ? -1 : settings.defaultUserQuota,
                userRole === "admin" ? -1 : settings.defaultUserFileCountQuota,
                userRole === "admin" ? -1 : settings.defaultInvitesQuota,
              );
            } catch (error) {
              console.error(`Post-create error for ${user.email}:`, error);
            }
          },
        },

        delete: {
          before: async (user) => {
            const userFiles = await getUserFiles(user.id);

            if (userFiles.length > 0) {
              console.log(
                `Would delete ${userFiles.length} files for user ${user.id}`,
              );
            }
          },
        },
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    experimental: {
      joins: false,
    },

    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-up/email") {
          const settings = await getSettings();
          if (!settings.signUpEnabled) {
            throw new APIError("FORBIDDEN", {
              message: "User sign-up is disabled at the moment.",
            });
          }
        }
      }),
    },

    plugins: [
      admin({
        ac,
        roles: {
          admin: adminRole,
          doctor,
          staff,
          patient,
        },
      }),
      openAPI({
        theme: "deepSpace",
      }),
      twoFactor(),
      customSession(async ({ user, session }) => {
        const [fullUser, userQuota, userClinics] = await Promise.all([
          getUserById(user.id),
          getUserQuota(user.id),
          getUserClinics(user.id),
        ]);

        const primaryClinic = fullUser?.clinicId
          ? await getClinicById(fullUser.clinicId as string)
          : null;

        return {
          user: {
            ...user,
            role: fullUser?.role,
            clinicId: fullUser?.clinicId,
            phone: fullUser?.phone,
            address: fullUser?.address,
            quota: userQuota,
            primaryClinic: primaryClinic ?? undefined,
            clinics:
              userClinics?.map((cm) => ({
                id: cm.id,
                name: cm.name,
                email: cm.email,
                memberRole: cm.role,
                joinedAt: cm.createdAt,
                isPrimary: cm.id === fullUser?.clinicId,
              })) || [],
          },
          session,
        };
      }),
      tanstackStartCookies(),
    ],

    advanced: {
      cookiePrefix: "__bauth",
      ipAddress: {
        ipAddressHeaders: [
          "x-forwarded-for",
          "x-real-ip",
          "cf-connecting-ip",
          "true-client-ip",
        ],
      },
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: isProduction ? "strict" : "none",
        secure: true,
      },
      telemetry: {
        enabled: false,
      },
      database: {
        generateId: () => generateId(),
      },
    },
  });
}

export const auth = createAuth();

export type AuthSession = typeof auth.$Infer.Session;
export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
export type Role = User["role"];
export type Auth = typeof auth;
