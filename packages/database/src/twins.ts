import type { DigitalTwin, Prisma } from "@prisma/client";
import type { TwinStatus } from "./enums";
import { prisma } from "./client";

export type CreateTwinInput = {
  workspaceId: string;
  name: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export async function createTwin(data: CreateTwinInput): Promise<DigitalTwin> {
  return prisma.digitalTwin.create({ data });
}

export async function getTwinById(
  id: string,
  workspaceId?: string,
): Promise<DigitalTwin | null> {
  return prisma.digitalTwin.findFirst({
    where: { id, ...(workspaceId ? { workspaceId } : {}) },
  });
}

/** Returns the twin with its latest ready model version and aggregate counts. */
export async function getTwinWithLatestVersion(id: string) {
  return prisma.digitalTwin.findUnique({
    where: { id },
    include: {
      modelVersions: {
        where: { status: "READY" },
        orderBy: { version: "desc" },
        take: 1,
      },
      _count: { select: { issues: true, sensors: true } },
    },
  });
}

export type ListTwinsOptions = {
  status?: TwinStatus;
  search?: string;
  skip?: number;
  take?: number;
};

export async function listTwins(workspaceId: string, options: ListTwinsOptions = {}) {
  const { status, search, skip = 0, take = 20 } = options;

  const where: Prisma.DigitalTwinWhereInput = {
    workspaceId,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.digitalTwin.findMany({
      where,
      include: {
        modelVersions: {
          where: { status: "READY" },
          orderBy: { version: "desc" },
          take: 1,
          select: { id: true, version: true, status: true, processedAt: true },
        },
        _count: { select: { issues: true, sensors: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
    prisma.digitalTwin.count({ where }),
  ]);

  return { items, total };
}

export type UpdateTwinInput = Partial<
  Pick<
    DigitalTwin,
    "name" | "description" | "address" | "latitude" | "longitude" | "status"
  >
>;

export async function updateTwin(id: string, data: UpdateTwinInput): Promise<DigitalTwin> {
  return prisma.digitalTwin.update({ where: { id }, data });
}

export async function deleteTwin(id: string): Promise<void> {
  await prisma.digitalTwin.delete({ where: { id } });
}
