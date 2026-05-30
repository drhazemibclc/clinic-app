// src/orpc/routers/auth.ts

import { auth } from "@clinic-app/auth";
import { mutations } from "@clinic-app/db/mutations";
import { UserCreateSchema } from "@clinic-app/db/zod";
import { ORPCError } from "@orpc/server"; // FIX: Import from server, not client
import z from "zod";
import { o as base, protectedProcedure, publicProcedure } from "../index";

export const UserAuthSchema = UserCreateSchema.omit({
  role: true,
  name: true,
  email: true,
}).extend({
  role: z.enum(["admin", "doctor", "patient", "staff"]),
  password: z.string().min(6),
  name: z.string(),
  email: z.email(),
});

const signUpSchema = UserCreateSchema.pick({ email: true }).extend({
  role: z.enum(["patient", "doctor"]),
  password: z.string().min(6),
  name: z.string(),
});

export const authRouter = base.router({
  signup: publicProcedure
    .route({
      method: "POST",
      path: "/auth/signup",
      summary: "User signup",
      tags: ["Auth"],
    })
    .input(signUpSchema)
    .handler(async ({ input, context }) => {
      const { email, password, role, name } = input;

      // Passing headers helps Better Auth manage the initial session/cookies
      const result = await auth.api.signUpEmail({
        body: { email, password, name },
        headers: context.headers,
      });

      // Better Auth returns standard objects, check for user existence
      if (!result?.user) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Registration failed. User may already exist.",
        });
      }

      // Update role using mutations
      await mutations.user.update(result.user.id, { role });

      return {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role,
      };
    }),

  signIn: publicProcedure
    .route({
      method: "POST",
      path: "/auth/signin",
      summary: "User signin",
      tags: ["Auth"],
    })
    .input(
      z.object({
        email: z.email(),
        password: z.string(),
      }),
    )
    .handler(async ({ input, context }) => {
      const result = await auth.api.signInEmail({
        body: input,
        headers: context.headers,
      });

      if (!result?.user) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Invalid email or password",
        });
      }

      return {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user?.role, // Explicit cast if role is custom
      };
    }),

  signOut: protectedProcedure
    .route({
      method: "POST",
      path: "/auth/signout",
      summary: "User signout",
      tags: ["Auth"],
    })
    .handler(async ({ context }) => {
      // Must pass headers to identify which session to kill
      await auth.api.signOut({
        headers: context.headers,
      });

      return { success: true };
    }),

  getSession: protectedProcedure
    .route({
      method: "GET",
      path: "/auth/session",
      summary: "Get current user session",
      tags: ["Auth"],
    })
    .handler(async ({ context }) => {
      const result = await auth.api.getSession({
        headers: context.headers,
      });

      if (!result?.user) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "No active session found",
        });
      }

      return {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user?.role,
        image: result.user?.image ?? null, // Include image if available
      };
    }),
});
