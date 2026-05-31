import type { TwinFile, TwinModelVersion } from "@prisma/client";
import type { TwinFileType } from "./enums";
import { prisma } from "./client";

// ─── Model Versions ───────────────────────────────────────────────────────────

export type CreateModelVersionInput = {
  twinId: string;
  version?: number;
  label?: string;
  ifcFileKey?: string;
  ifcFileName?: string;
  ifcFileSizeBytes?: number;
};

/**
 * Creates a new model version. If `version` is omitted it is auto-incremented
 * based on the highest existing version for the twin.
 * Note: auto-increment is not atomic — on version conflict Prisma will throw
 * a unique-constraint error; retry with explicit version in that case.
 */
export async function createModelVersion(
  input: CreateModelVersionInput,
): Promise<TwinModelVersion> {
  let { version } = input;

  if (version === undefined) {
    const latest = await prisma.twinModelVersion.findFirst({
      where: { twinId: input.twinId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    version = (latest?.version ?? 0) + 1;
  }

  return prisma.twinModelVersion.create({ data: { ...input, version } });
}

export async function getModelVersionById(id: string): Promise<TwinModelVersion | null> {
  return prisma.twinModelVersion.findUnique({ where: { id } });
}

export async function getLatestModelVersion(
  twinId: string,
): Promise<TwinModelVersion | null> {
  return prisma.twinModelVersion.findFirst({
    where: { twinId, status: "READY" },
    orderBy: { version: "desc" },
  });
}

export async function listModelVersions(twinId: string): Promise<TwinModelVersion[]> {
  return prisma.twinModelVersion.findMany({
    where: { twinId },
    orderBy: { version: "desc" },
  });
}

export type UpdateModelVersionInput = Partial<
  Pick<
    TwinModelVersion,
    | "status"
    | "label"
    | "fragFileKey"
    | "fragFileSizeBytes"
    | "elementCount"
    | "ifcSchema"
    | "boundingBox"
    | "processedAt"
  >
>;

export async function updateModelVersion(
  id: string,
  data: UpdateModelVersionInput,
): Promise<TwinModelVersion> {
  return prisma.twinModelVersion.update({ where: { id }, data });
}

export async function markModelVersionReady(
  id: string,
  fragFileKey: string,
  fragFileSizeBytes: number,
  elementCount: number,
): Promise<TwinModelVersion> {
  return prisma.twinModelVersion.update({
    where: { id },
    data: {
      status: "READY",
      fragFileKey,
      fragFileSizeBytes,
      elementCount,
      processedAt: new Date(),
    },
  });
}

export async function markModelVersionFailed(id: string): Promise<TwinModelVersion> {
  return prisma.twinModelVersion.update({
    where: { id },
    data: { status: "FAILED" },
  });
}

// ─── Twin Files ────────────────────────────────────────────────────────────────

export type CreateTwinFileInput = {
  twinId: string;
  fileType: TwinFileType;
  name: string;
  s3Key: string;
  sizeBytes: number;
  mimeType?: string;
  checksum?: string;
  uploadedById?: string;
};

export async function createTwinFile(data: CreateTwinFileInput): Promise<TwinFile> {
  return prisma.twinFile.create({ data });
}

export async function getTwinFiles(
  twinId: string,
  fileType?: TwinFileType,
): Promise<TwinFile[]> {
  return prisma.twinFile.findMany({
    where: { twinId, ...(fileType ? { fileType } : {}) },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function getTwinFileByS3Key(s3Key: string): Promise<TwinFile | null> {
  return prisma.twinFile.findUnique({ where: { s3Key } });
}

export async function deleteTwinFile(id: string): Promise<void> {
  await prisma.twinFile.delete({ where: { id } });
}

// ─── Element Property Cache ───────────────────────────────────────────────────

export type PropertySets = Record<string, Record<string, unknown>>;

export type UpsertPropertyCacheInput = {
  modelVersionId: string;
  ifcGuid: string;
  expressId: number;
  ifcClass: string;
  name?: string;
  propertySets: PropertySets;
  classifications?: Record<string, unknown>;
  spatialPath?: string;
};

export async function upsertPropertyCache(data: UpsertPropertyCacheInput) {
  const { modelVersionId, ifcGuid, propertySets, classifications, ...rest } = data;
  const serialised = {
    propertySets: JSON.stringify(propertySets),
    ...(classifications != null ? { classifications: JSON.stringify(classifications) } : {}),
  };
  return prisma.elementPropertyCache.upsert({
    where: { modelVersionId_ifcGuid: { modelVersionId, ifcGuid } },
    create: { modelVersionId, ifcGuid, ...rest, ...serialised },
    update: { ...rest, ...serialised },
  });
}

export async function getElementProperties(modelVersionId: string, ifcGuid: string) {
  return prisma.elementPropertyCache.findUnique({
    where: { modelVersionId_ifcGuid: { modelVersionId, ifcGuid } },
  });
}

export async function queryElementsByClass(modelVersionId: string, ifcClass: string) {
  return prisma.elementPropertyCache.findMany({
    where: { modelVersionId, ifcClass },
    select: { ifcGuid: true, expressId: true, name: true, spatialPath: true },
  });
}

/**
 * Bulk upsert in chunks to avoid transaction size limits.
 * For large models (>10k elements) consider using raw SQL COPY instead.
 */
export async function bulkUpsertPropertyCache(
  items: UpsertPropertyCacheInput[],
  chunkSize = 100,
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await prisma.$transaction(
      chunk.map(({ modelVersionId, ifcGuid, propertySets, classifications, ...rest }) => {
        const serialised = {
          propertySets: JSON.stringify(propertySets),
          ...(classifications != null
            ? { classifications: JSON.stringify(classifications) }
            : {}),
        };
        return prisma.elementPropertyCache.upsert({
          where: { modelVersionId_ifcGuid: { modelVersionId, ifcGuid } },
          create: { modelVersionId, ifcGuid, ...rest, ...serialised },
          update: { ...rest, ...serialised },
        });
      }),
    );
  }
}
