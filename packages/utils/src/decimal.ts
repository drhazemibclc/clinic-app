import { Decimal } from "decimal.js";

/**
 * Ensures value is a valid Decimal instance
 */
export function toDecimal(value: unknown): Decimal {
  if (value instanceof Decimal) {
    return value;
  }
  if (value === null || value === undefined || value === "") {
    return new Decimal(0);
  }

  try {
    return new Decimal(value as string | number);
  } catch {
    return new Decimal(0);
  }
}

/**
 * Converts any input (Decimal, string, null) to a plain JS number.
 * Essential for sending data from Server (ORPC) to Client (React).
 */
export function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  // If it's already a native number
  if (typeof value === "number") {
    return value;
  }

  // If it's a Decimal.js instance or similar object
  if (
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  // Handle strings (Postgres numeric types often come back as strings)
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0; // Final fallback to avoid crashing the UI
}
