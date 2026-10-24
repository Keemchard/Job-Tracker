import { ApplicationStatus, WorkMode } from "@/types/application";

const VALID_STATUSES: ApplicationStatus[] = [
  "applied",
  "screening",
  "interview",
  "technical",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
];

const VALID_WORK_MODES: WorkMode[] = ["remote", "onsite", "hybrid"];

const FIELD_LIMITS: Record<string, number> = {
  company: 200,
  position: 200,
  location: 200,
  salary: 100,
  jobUrl: 500,
  contactPerson: 200,
  contactEmail: 200,
  notes: 2000,
  dateApplied: 20,
};

function sanitizeString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function sanitizeApplicationData(data: Record<string, unknown>) {
  const status = data.status as string;
  const workMode = data.workMode as string;

  if (!VALID_STATUSES.includes(status as ApplicationStatus)) {
    throw new Error(`Invalid status: ${status}`);
  }
  if (!VALID_WORK_MODES.includes(workMode as WorkMode)) {
    throw new Error(`Invalid work mode: ${workMode}`);
  }

  const sanitized: Record<string, string> = {
    company: sanitizeString(data.company, FIELD_LIMITS.company),
    position: sanitizeString(data.position, FIELD_LIMITS.position),
    location: sanitizeString(data.location, FIELD_LIMITS.location),
    workMode: workMode,
    status: status,
    dateApplied: sanitizeString(data.dateApplied, FIELD_LIMITS.dateApplied),
  };

  if (!sanitized.company || !sanitized.position || !sanitized.location || !sanitized.dateApplied) {
    throw new Error("Company, position, location, and date applied are required");
  }

  const optionalFields = ["salary", "jobUrl", "contactPerson", "contactEmail", "notes"] as const;
  for (const field of optionalFields) {
    const value = sanitizeString(data[field], FIELD_LIMITS[field]);
    if (value) {
      sanitized[field] = value;
    }
  }

  if (sanitized.jobUrl && !isValidUrl(sanitized.jobUrl)) {
    delete sanitized.jobUrl;
  }

  if (sanitized.contactEmail && !isValidEmail(sanitized.contactEmail)) {
    delete sanitized.contactEmail;
  }

  return sanitized;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
