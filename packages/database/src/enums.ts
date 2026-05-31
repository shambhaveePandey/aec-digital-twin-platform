// String union types replacing Prisma enums for SQLite compatibility.
// Revert to Prisma enum imports when switching back to PostgreSQL.

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type TwinStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type ModelVersionStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";
export type TwinFileType = "IFC_SOURCE" | "FRAGMENT" | "PREVIEW_IMAGE" | "DOCUMENT" | "OTHER";
export type SensorStatus = "ACTIVE" | "INACTIVE" | "STALE" | "ERROR";
export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "WONT_FIX";
export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "UPLOAD" | "CONVERT" | "SHARE" | "LOGIN" | "LOGOUT";
export type JobType = "IFC_CONVERT" | "PROPERTY_EXTRACT" | "PREVIEW_GENERATE" | "FRAGMENT_UPLOAD";
export type JobStatus = "QUEUED" | "RUNNING" | "DONE" | "FAILED" | "CANCELLED";
