export type ApplicationStatus =
  | "applied"
  | "screening"
  | "interview"
  | "technical"
  | "offer"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type WorkMode = "remote" | "onsite" | "hybrid" | "wfh";

export interface JobApplication {
  id: string;
  userId: string;
  company: string;
  position: string;
  location: string;
  workMode: WorkMode;
  status: ApplicationStatus;
  dateApplied: string;
  salary?: string;
  jobUrl?: string;
  contactPerson?: string;
  contactEmail?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  technical: "Technical",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: "#6366f1",
  screening: "#f59e0b",
  interview: "#3b82f6",
  technical: "#8b5cf6",
  offer: "#10b981",
  accepted: "#059669",
  rejected: "#ef4444",
  withdrawn: "#6b7280",
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  onsite: "On-site",
  hybrid: "Hybrid",
  wfh: "Work From Home",
};
