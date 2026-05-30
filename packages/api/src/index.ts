import { ORPCError, os } from "@orpc/server";

import z from "zod";
import type { Context } from "./context";

export const o = os.$context<Context>().errors({
  UNAUTHORIZED: {
    message: "Unauthorized access",
    statusCode: 401,
  },
  FORBIDDEN: {
    message: "Forbidden access",
    statusCode: 403,
  },
  RATE_LIMITED: {
    data: z.object({ retryAfter: z.number() }),
    message: "You are being rate limited",
    statusCode: 429,
  },
});

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({
    context,
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);

const requireAdmin = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  if (context.session.user.role !== "admin") {
    throw new ORPCError("FORBIDDEN");
  }
  return next({
    context,
  });
});

export const adminProcedure = publicProcedure.use(requireAdmin);
export const requireClinicId = (clinicId?: string | null) => {
  if (!clinicId) {
    throw new ORPCError("FORBIDDEN", { message: "Clinic ID is required" });
  }
  return clinicId;
};

export const clinicProcedure = protectedProcedure.use(
  async ({ context, next }) => {
    const clinicId = requireClinicId(context.user?.clinicId);
    return next({
      context: {
        ...context,
        clinicId,
      },
    });
  },
);

export function requireRole(role: "admin" | "doctor" | "patient" | "staff") {
  return o.middleware(({ context, next }) => {
    if (context.user?.role !== role) {
      throw new ORPCError("FORBIDDEN", {
        message: `Requires ${role} role. Current role: ${context.user?.role}`,
      });
    }
    return next({});
  });
}
