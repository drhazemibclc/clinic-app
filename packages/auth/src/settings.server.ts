import { db } from "@clinic-app/db";
import { configStore } from "@clinic-app/db/schema/clinic";
import z from "zod";
export type SnakeToCamelCase<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Lowercase<Head>}${Capitalize<SnakeToCamelCase<Tail>>}`
    : Lowercase<S>;

export type CamelCaseKeys<T> =
  T extends Array<infer U>
    ? CamelCaseKeys<U>[]
    : T extends object
      ? {
          [K in keyof T as SnakeToCamelCase<K & string>]: CamelCaseKeys<T[K]>;
        }
      : T;

export const snakeToCamel = (str: string): string =>
  str.replace(/_([a-z])/g, (g) => g[1]?.toUpperCase() ?? "");

export const camelToSnake = (str: string): string =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

// ... (CONFIG_DEF and type definitions remain the same as they are logic-pure)
const CONFIG_DEF = {
  require_invite: z.boolean().default(false),
  sign_up_enabled: z.boolean().default(true),
  blacklisted_extensions: z.string().default(""),
  max_invite_age: z.number().default(1000 * 60 * 60 * 24 * 7),
  allow_user_create_invites: z.boolean().default(true),
  default_user_file_count_quota: z.number().default(1000),
  default_user_quota: z.number().default(1024 * 1024 * 1024),
  default_invites_quota: z.number().default(10),
  upload_file_chunk_size: z.number().default(1024 * 1024 * 25),
  upload_file_max_size: z.number().default(1024 * 1024 * 1024 * 5),
  cdn_url: z.url().or(z.literal("")).default(""),
};

type ConfigDef = typeof CONFIG_DEF;
export type ConfigKey = keyof ConfigDef;
type ConfigState = z.infer<z.ZodObject<ConfigDef>>;
export type AppSettings = CamelCaseKeys<ConfigState> & {
  baseUrl: string;
  appName: string;
};

const getDefaults = (): AppSettings => {
  const defaults: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(CONFIG_DEF)) {
    defaults[snakeToCamel(key)] = schema.parse(undefined);
  }
  return {
    ...(defaults as CamelCaseKeys<ConfigState>),
    baseUrl: process.env.AUTH_BASE_URL ?? "",
    appName: process.env.APP_NAME ?? "",
  };
};

// ... (Logic for zShape, keyMap, and defaults remains the same)

// 1. Convert Data Fetching to a Server Function
export const getSettings = async (): Promise<AppSettings> => {
  let rows: { key: string; value: string }[];
  try {
    rows = await db.select().from(configStore);
  } catch {
    return getDefaults();
  }

  const finalConfig: Record<string, unknown> = {};
  const rawMap = new Map(rows.map((r) => [r.key, r.value]));

  for (const [snakeKey, value] of Object.entries(CONFIG_DEF)) {
    const camelKey = snakeToCamel(snakeKey);
    const dbValue = rawMap.get(snakeKey);
    const schema = value as z.ZodTypeAny;

    if (dbValue === undefined) {
      finalConfig[camelKey] = schema.parse(undefined);
    } else if (schema instanceof z.ZodDefault) {
      const innerType = (schema as z.ZodDefault<z.ZodTypeAny>).def.innerType;
      if (innerType instanceof z.ZodNumber) {
        finalConfig[camelKey] = Number(dbValue);
      } else if (innerType instanceof z.ZodBoolean) {
        finalConfig[camelKey] = dbValue === "true";
      } else {
        finalConfig[camelKey] = dbValue;
      }
    } else if (dbValue !== undefined) {
      finalConfig[camelKey] = dbValue;
    }
  }

  // Ensure database has all current keys
  const missing = Object.keys(CONFIG_DEF).filter(
    (k) => !new Set(rows.map((r) => r.key)).has(k),
  );
  if (missing.length > 0) {
    const inserts = missing.map((k) => {
      return {
        key: k,
        value: String(
          (CONFIG_DEF as Record<string, z.ZodTypeAny | undefined>)[k]?.parse(
            undefined,
          ),
        ),
      };
    });
    await db
      .insert(configStore)
      .values(inserts)
      .onConflictDoNothing()
      .execute();
  }

  return {
    ...(finalConfig as AppSettings),
    baseUrl: process.env.AUTH_BASE_URL ?? "",
    appName: process.env.APP_NAME ?? "",
  };
};
