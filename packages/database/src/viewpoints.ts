import type { Viewpoint } from "@prisma/client";
import { prisma } from "./client";

export type Vec3 = { x: number; y: number; z: number };

export type CreateViewpointInput = {
  twinId: string;
  issueId?: string;
  label?: string;
  cameraPosition: Vec3;
  cameraTarget: Vec3;
  cameraUp: Vec3;
  isOrthographic?: boolean;
  orthographicSize?: number;
  hiddenGuids?: string[];
  selectedGuids?: string[];
  snapshotKey?: string;
};

export async function createViewpoint(data: CreateViewpointInput): Promise<Viewpoint> {
  return prisma.viewpoint.create({ data });
}

export async function getViewpointById(id: string): Promise<Viewpoint | null> {
  return prisma.viewpoint.findUnique({ where: { id } });
}

/** Returns standalone viewpoints not linked to any issue. */
export async function listViewpoints(twinId: string): Promise<Viewpoint[]> {
  return prisma.viewpoint.findMany({
    where: { twinId, issueId: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function getIssueViewpoints(issueId: string): Promise<Viewpoint[]> {
  return prisma.viewpoint.findMany({
    where: { issueId },
    orderBy: { createdAt: "asc" },
  });
}

export type UpdateViewpointInput = Partial<
  Pick<Viewpoint, "label" | "snapshotKey" | "hiddenGuids" | "selectedGuids">
>;

export async function updateViewpoint(
  id: string,
  data: UpdateViewpointInput,
): Promise<Viewpoint> {
  return prisma.viewpoint.update({ where: { id }, data });
}

export async function deleteViewpoint(id: string): Promise<void> {
  await prisma.viewpoint.delete({ where: { id } });
}
