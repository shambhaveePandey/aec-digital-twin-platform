import type { BackgroundJob, JobStatus, JobType } from "@prisma/client";
import { prisma } from "./client";

export type CreateJobInput = {
  type: JobType;
  twinId?: string;
  modelVersionId?: string;
  priority?: number;
  payload?: Record<string, unknown>;
  maxAttempts?: number;
  scheduledAt?: Date;
};

export async function createJob(data: CreateJobInput): Promise<BackgroundJob> {
  return prisma.backgroundJob.create({ data });
}

export async function getJobById(id: string): Promise<BackgroundJob | null> {
  return prisma.backgroundJob.findUnique({ where: { id } });
}

/**
 * Atomically claims the next available job and marks it as RUNNING.
 * Uses a transaction to prevent two workers from claiming the same job.
 * For very high throughput consider raw SQL with SKIP LOCKED.
 */
export async function claimNextJob(
  type?: JobType,
  workerId?: string,
): Promise<BackgroundJob | null> {
  return prisma.$transaction(async (tx) => {
    const job = await tx.backgroundJob.findFirst({
      where: {
        status: "QUEUED",
        scheduledAt: { lte: new Date() },
        ...(type ? { type } : {}),
      },
      orderBy: [{ priority: "desc" }, { scheduledAt: "asc" }],
    });

    if (!job || job.attempts >= job.maxAttempts) return null;

    return tx.backgroundJob.update({
      where: { id: job.id },
      data: {
        status: "RUNNING",
        startedAt: new Date(),
        workerId: workerId ?? null,
        attempts: { increment: 1 },
      },
    });
  });
}

export async function markJobDone(
  id: string,
  result?: Record<string, unknown>,
): Promise<BackgroundJob> {
  return prisma.backgroundJob.update({
    where: { id },
    data: { status: "DONE", completedAt: new Date(), result: result ?? undefined },
  });
}

export async function markJobFailed(
  id: string,
  errorMessage: string,
): Promise<BackgroundJob> {
  const job = await prisma.backgroundJob.findUniqueOrThrow({ where: { id } });

  // Retry if attempts remain, otherwise permanently fail
  const nextStatus: JobStatus = job.attempts < job.maxAttempts ? "QUEUED" : "FAILED";

  return prisma.backgroundJob.update({
    where: { id },
    data: {
      status: nextStatus,
      errorMessage,
      workerId: null,
      startedAt: null,
    },
  });
}

export async function cancelJob(id: string): Promise<BackgroundJob> {
  return prisma.backgroundJob.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}

export async function getJobsForTwin(twinId: string): Promise<BackgroundJob[]> {
  return prisma.backgroundJob.findMany({
    where: { twinId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingJobs(type?: JobType): Promise<BackgroundJob[]> {
  return prisma.backgroundJob.findMany({
    where: {
      status: "QUEUED",
      ...(type ? { type } : {}),
    },
    orderBy: [{ priority: "desc" }, { scheduledAt: "asc" }],
  });
}

export async function getJobCountByStatus(): Promise<Record<JobStatus, number>> {
  const rows = await prisma.backgroundJob.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const defaults: Record<JobStatus, number> = {
    QUEUED: 0,
    RUNNING: 0,
    DONE: 0,
    FAILED: 0,
    CANCELLED: 0,
  };

  return rows.reduce((acc, row) => {
    acc[row.status] = row._count.status;
    return acc;
  }, defaults);
}
