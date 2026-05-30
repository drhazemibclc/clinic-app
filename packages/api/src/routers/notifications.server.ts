import { notificationQueries } from "@clinic-app/db/actions/queries";
import { mutations } from "@clinic-app/db/mutations";
import { queries } from "@clinic-app/db/queries";
import { z } from "zod";
import { adminProcedure, protectedProcedure } from "../index";

export const listNotifications = protectedProcedure
  .input(
    z.object({
      status: z.enum(["all", "read", "unread"]).default("all"),
      type: z.string().nullish(),
      search: z.string().default(""),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }),
  )
  .handler(async ({ input, context }) => {
    const { status, type, search, limit, offset } = input;
    const userId = context.user?.id ?? "";
    const clinicId = context.clinicId;

    const result = await queries.notification.listNotifications({
      userId,
      clinicId: clinicId ?? undefined,
      status: status,
      type: type ?? undefined,
      search,
      limit,
      offset,
    });

    return {
      notifications: result.items,
      total: result.total,
      unreadCount: result.unreadCount,
      hasMore: offset + limit < result.total,
    };
  });

export const getUserNotifications = protectedProcedure.handler(
  async ({ context }) => {
    const userId = context.user?.id ?? "";
    const clinicId = context.clinicId;

    return await queries.notification.getUserNotifications(
      userId,
      clinicId ?? undefined,
      5,
    );
  },
);

export const createNotification = protectedProcedure
  .input(
    z.object({
      userId: z.string(),
      title: z.string(),
      clinicId: z.string().nullish(),
      type: z.string(),
      body: z.string(),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
      metadata: z.record(z.string(), z.string()).nullish(),
      actions: z
        .array(
          z.object({
            id: z.string(),
            label: z.string(),
            type: z.enum(["redirect", "workflow", "none"]),
            payload: z.record(z.string(), z.any()).optional(),
          }),
        )
        .nullish(),
    }),
  )
  .handler(async ({ input }) => {
    const { userId, clinicId, type, body, actions, title, priority, metadata } =
      input;

    const newNotification = await mutations.notification.create({
      id: crypto.randomUUID(),
      userId,
      title,
      clinicId: clinicId ?? "",
      type,
      body,
      priority,
      metadata: metadata ?? {},
      actions: actions ?? [],
      status: "unread",
      createdAt: new Date(),
    });

    return newNotification;
  });

export const markAsRead = protectedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    await queries.notification.markAsRead(input.id, context.user?.id);
    return { success: true };
  });

export const markAllAsRead = protectedProcedure.handler(async ({ context }) => {
  const userId = context.user?.id ?? "";
  const clinicId = context.clinicId;

  await queries.notification.markAllAsRead(userId, clinicId ?? undefined);
  return { success: true };
});

export const deleteNotification = protectedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    await queries.notification.deleteNotification(
      input.id,
      context.user?.id ?? "",
    );
    return { success: true };
  });

export const clearAll = protectedProcedure.handler(async ({ context }) => {
  const userId = context.user?.id ?? "";
  const clinicId = context.clinicId;

  await queries.notification.clearAll(userId, clinicId ?? undefined);
  return { success: true };
});

export const notificationRouter = {
  list: listNotifications,
  get: getUserNotifications,
  create: createNotification,
  markAsRead,
  markAllAsRead,
  delete: deleteNotification,
  clearAll,
};
export const notificationProcedures = {
  getUserNotifications: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .handler(async ({ input, context }) => {
      const clinicId = context.clinicId ?? "";
      return await notificationQueries.getUserNotifications(
        input.userId,
        clinicId,
        input.limit,
        input.offset,
      );
    }),

  markNotificationAsRead: adminProcedure
    .input(z.object({ notificationId: z.string() }))
    .handler(async ({ input }) => {
      return await notificationQueries.markAsRead(input.notificationId);
    }),

  markAllNotificationsAsRead: adminProcedure
    .input(z.object({ userId: z.string() }))
    .handler(async ({ input }) => {
      return await notificationQueries.markAllAsRead(input.userId);
    }),
} as const;
