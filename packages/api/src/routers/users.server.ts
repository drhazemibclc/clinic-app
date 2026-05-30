// src/orpc/router/users.ts

import {
  createUser,
  mutations,
  deleteUser as permanentlyDeleteUser,
} from "@clinic-app/db/mutations";
import { queries } from "@clinic-app/db/queries";
import { UserCreateSchema, UserUpdateSchema } from "@clinic-app/db/zod";
import { z } from "zod";
import { adminProcedure, protectedProcedure } from "../index";

const userListFiltersSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum(["admin", "doctor", "patient", "staff"]).optional(),
  clinicId: z.string().optional(),
});

const createUserSchema = UserCreateSchema.extend({
  password: z.string().min(6).optional(),
});

const updateUserSchema = UserUpdateSchema.partial();

const bulkUserUpdateSchema = z.object({
  ids: z.array(z.string()),
  data: z.object({
    role: z.enum(["admin", "doctor", "patient", "staff"]).optional(),
    clinicId: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const usersRouter = {
  // List users with pagination and filters
  list: protectedProcedure
    .input(userListFiltersSchema)
    .output(z.any())
    .handler(async ({ input, context }) => {
      // Check permissions
      if (context.user?.role !== "admin" && context.user?.role !== "staff") {
        throw new Error("Unauthorized: Only admins and staff can list users");
      }

      return await queries.user.getUserWithAllRelations(
        input.clinicId || context.clinicId || "",
      );
    }),

  // Get user by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .handler(async ({ input, context }) => {
      // Users can view their own profile, admins can view any
      if (context.user?.id !== input.id && context.user?.role !== "admin") {
        throw new Error("Unauthorized: You can only view your own profile");
      }

      return await queries.user.getUserWithAllRelations(input.id);
    }),

  // Create new user (admin only)
  create: adminProcedure
    .input(createUserSchema)
    .output(z.any())
    .handler(async ({ input }) => {
      return await createUser(input);
    }),

  // Update user
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateUserSchema,
      }),
    )
    .output(z.any())
    .handler(async ({ input, context }) => {
      // Users can update themselves, admins can update any
      if (context.user?.id !== input.id && context.user?.role !== "admin") {
        throw new Error("Unauthorized: You can only update your own profile");
      }

      return await mutations.user.update(input.id, input.data);
    }),

  // Delete user (soft delete)
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean(), id: z.string() }))
    .handler(async ({ input }) => {
      await mutations.user.delete(input.id);
      return { success: true, id: input.id };
    }),

  // Permanently delete user (admin only)
  permanentDelete: adminProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean(), id: z.string() }))
    .handler(async ({ input }) => {
      const deleted = await permanentlyDeleteUser(input.id);
      return { success: !!deleted, id: deleted?.id || input.id };
    }),

  // Bulk update users (admin only)
  bulkUpdate: adminProcedure
    .input(bulkUserUpdateSchema)
    .output(z.any())
    .handler(async ({ input }) => {
      return await mutations.user.updateMany(input.ids, input.data);
    }),

  // Get user statistics (admin only)
  stats: adminProcedure.output(z.any()).handler(async ({ context }) => {
    return await queries.clinic.getClinicDashboard(context.clinicId || "");
  }),

  // Get current user profile
  me: protectedProcedure.output(z.any()).handler(async ({ context }) => {
    const userData = await queries.user.getUserWithAllRelations(
      context.user?.id || "",
    );
    if (!userData) {
      throw new Error("User not found");
    }
    return userData;
  }),

  // Update current user's own profile
  updateMe: protectedProcedure
    .input(updateUserSchema)
    .output(z.any())
    .handler(async ({ input, context }) => {
      return await mutations.user.update(context.user?.id || "", input);
    }),
};
