import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export function parseBytes(input: string): number | null {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
  };
  const match = input.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  if (!match) return null;
  const value = Number.parseFloat(match[1] ?? "0");
  const unit = match[2] || "b";
  if (!units[unit]) return null;
  return Math.floor(value * units[unit]);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = 1000;
  const m = s * 60;
  const h = m * 60;
  const d = h * 24;

  if (ms >= d) return `${Number.parseFloat((ms / d).toFixed(2))}d`;
  if (ms >= h) return `${Number.parseFloat((ms / h).toFixed(2))}h`;
  if (ms >= m) return `${Number.parseFloat((ms / m).toFixed(2))}m`;
  return `${Number.parseFloat((ms / s).toFixed(2))}s`;
}

export function parseDuration(input: string): number | null {
  const units: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 1000 * 60,
    h: 1000 * 60 * 60,
    d: 1000 * 60 * 60 * 24,
  };
  const match = input.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  if (!match) return null;
  const value = Number.parseFloat(match[1] ?? "0");
  const unit = match[2] || "ms";
  if (!units[unit]) return null;
  return Math.floor(value * units[unit]);
}

export function normalize(s: string) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractError(err: string): {
  status_code: number | null;
  message: string;
} {
  const status = err.match(/response code:\s*(\d+)/i);
  const message = err.match(/response text:\s*(.*?)\s*,\s*request id/i);

  return {
    status_code: status ? Number(status[1]) : null,
    message: message ? (message[1] ?? "Unknown error") : err,
  };
}

export const snakeToCamel = (str: string): string =>
  str.replace(/_([a-z])/g, (_, g) => g.toUpperCase());

export const camelToSnake = (str: string): string =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const SLUG_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_LENGTH = 6;
const MAX_SLUG_RETRIES = 10;

export function generateSlug(): string {
  let result = "";
  const randomValues = crypto.getRandomValues(new Uint8Array(SLUG_LENGTH));
  for (let i = 0; i < SLUG_LENGTH; i++) {
    const rv = randomValues[i] ?? 0;
    const ch = SLUG_CHARS[rv % SLUG_CHARS.length] ?? "a";
    result += ch;
  }
  return result;
}

export async function generateUniqueSlug(
  checkExists: (slug: string) => boolean | Promise<boolean>,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    const slug = generateSlug();
    const exists = await checkExists(slug);
    if (!exists) {
      return slug;
    }
  }
  throw new Error("Failed to generate unique slug after maximum retries");
}

export function ring(color = "ring-primary") {
  return `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${color}`;
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase();
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}
