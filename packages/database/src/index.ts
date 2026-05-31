// Prisma client singleton
export { prisma } from "./client";
export type { PrismaClient } from "./client";

// Prisma-generated enums
export {
  WorkspaceRole,
  TwinStatus,
  ModelVersionStatus,
  TwinFileType,
  SensorStatus,
  IssueStatus,
  IssuePriority,
  AuditAction,
  JobType,
  JobStatus,
} from "@prisma/client";

// Prisma-generated model types
export type {
  User,
  Account,
  Session,
  Workspace,
  WorkspaceMember,
  DigitalTwin,
  TwinModelVersion,
  TwinFile,
  ElementPropertyCache,
  Sensor,
  SensorReading,
  Issue,
  IssueComment,
  Viewpoint,
  AuditEvent,
  BackgroundJob,
} from "@prisma/client";

// Repository helpers
export * from "./users";
export * from "./workspaces";
export * from "./twins";
export * from "./uploads";
export * from "./issues";
export * from "./sensors";
export * from "./viewpoints";
export * from "./jobs";
