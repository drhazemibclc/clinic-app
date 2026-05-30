// #region Config

import { checkIsDbReady } from "@clinic-app/db";
import { env } from "@clinic-app/env/server";
import z from "zod";
import { publicProcedure } from "../index";

const HEALTHCHECK_TIMEOUT_MS = 1500;

// #region Utils

const CheckResultSchema = z
  .object({
    error: z.string().optional(),
    latencyMs: z.number(),
    status: z.enum(["healthy", "unhealthy"]),
  })
  .loose();

type CheckResult = z.infer<typeof CheckResultSchema>;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`Timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function runCheck(
  check: () => object | Promise<object>,
): Promise<CheckResult> {
  const startedAt = performance.now();
  try {
    const data = await withTimeout(
      Promise.resolve(check()),
      HEALTHCHECK_TIMEOUT_MS,
    );
    const latencyMs = Math.round(performance.now() - startedAt);
    const result = data as { status?: string };
    if (result.status === "unhealthy") {
      return { ...data, latencyMs, status: "unhealthy" };
    }
    return { ...data, latencyMs, status: "healthy" };
  } catch (error) {
    return {
      error: getErrorMessage(error),
      latencyMs: Math.round(performance.now() - startedAt),
      status: "unhealthy",
    };
  }
}

function buildBaseHealth() {
  return {
    buildSha: process.env.SOURCE_COMMIT,
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptimeMs: Math.floor(process.uptime() * 1000),
    url: env.BETTER_AUTH_URL,
  };
}

// #region Service Checks
async function checkDatabase() {
  const isReady = await checkIsDbReady();
  return { status: isReady ? "healthy" : "unhealthy" };
}

function checkSystem() {
  return {
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    nodeVersion: process.version,
    platform: process.platform,
    status: "healthy" as const,
  };
}

const serviceChecks = {
  database: checkDatabase,
  system: checkSystem,
} satisfies Record<string, () => object | Promise<object>>;

// #region Router

export const healthRouter = {
  live: publicProcedure
    .route({
      description: "Check if the server is alive",
      method: "GET",
      spec: (spec) => {
        return { ...spec, security: [] };
      },
    })
    .errors({})
    .handler(() => {
      return { status: "healthy", ...buildBaseHealth() };
    }),
  ready: publicProcedure
    .route({
      description:
        "Check if the server is ready to handle requests and connect to external services",
      method: "GET",
      spec: (spec) => {
        return { ...spec, security: [] };
      },
    })
    .errors({
      SERVICE_UNAVAILABLE: {
        data: z.object({
          checks: z.record(z.string(), CheckResultSchema),
        }),
        description: "One or more services are unhealthy",
        status: 503,
      },
    })
    .handler(async ({ errors }) => {
      const entries = await Promise.all(
        Object.entries(serviceChecks).map(async ([name, check]) => [
          name,
          await runCheck(check),
        ]),
      );
      const checks = Object.fromEntries(entries) as Record<string, CheckResult>;
      const allHealthy = Object.values(checks).every(
        (r) => r.status === "healthy",
      );

      if (!allHealthy) {
        throw errors.SERVICE_UNAVAILABLE({ data: { checks } });
      }

      return {
        status: "healthy" as const,
        ...buildBaseHealth(),
        checks,
      };
    }),
};
