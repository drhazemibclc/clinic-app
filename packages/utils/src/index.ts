console.log("Hello via Bun!");

export * from "./decimal";
export * from "./formDate";
export * from "./growth";
export * from "./id";
export function mapActionToType(
  action: string,
): "appointment" | "patient" | "payment" | "prescription" {
  const lowerAction = action.toLowerCase();
  if (lowerAction.includes("appointment")) {
    return "appointment";
  }
  if (lowerAction.includes("patient")) {
    return "patient";
  }
  if (lowerAction.includes("payment")) {
    return "payment";
  }
  if (lowerAction.includes("prescription")) {
    return "prescription";
  }
  return "appointment";
}

export function mapActionToActivity(
  action: string,
): "created" | "updated" | "cancelled" | "completed" {
  const lowerAction = action.toLowerCase();
  if (lowerAction.includes("create")) {
    return "created";
  }
  if (lowerAction.includes("update")) {
    return "updated";
  }
  if (lowerAction.includes("cancel")) {
    return "cancelled";
  }
  if (lowerAction.includes("complete")) {
    return "completed";
  }
  return "updated";
}

export function calculatePatientSatisfaction(): number {
  // Implement based on your survey/review data
  // For now, return a default or calculate from database
  return 4.5;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Helper to calculate age in years/months from date of birth
export const getAgeString = (dateOfBirth: Date | string) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let ageMonths = (today.getFullYear() - birthDate.getFullYear()) * 12;
  ageMonths += today.getMonth() - birthDate.getMonth();
  if (today.getDate() < birthDate.getDate()) {
    ageMonths--;
  }
  if (ageMonths < 24) {
    return `${ageMonths} months`;
  }
  const years = Math.floor(ageMonths / 12);
  return `${years} years`;
};
