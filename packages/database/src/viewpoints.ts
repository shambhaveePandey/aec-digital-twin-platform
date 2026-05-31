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
  const { cameraPosition, cameraTarget, cameraUp, hiddenGuids, selectedGuids, ...rest } =
    data;
  return prisma.viewpoint.create({
    data: {
      ...rest,
      cameraPosition: JSON.stringify(cameraPosition),
      cameraTarget: JSON.stringify(cameraTarget),
      cameraUp: JSON.stringify(cameraUp),
      ...(hiddenGuids != null ? { hiddenGuids: JSON.stringify(hiddenGuids) } : {}),
      ...(selectedGuids != null ? { selectedGuids: JSON.stringify(selectedGuids) } : {}),
    },
  });
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

export type UpdateViewpointInput = {
  label?: string | null;
  snapshotKey?: string | null;
  hiddenGuids?: string[] | null;
  selectedGuids?: string[] | null;
};

export async function updateViewpoint(
  id: string,
  data: UpdateViewpointInput,
): Promise<Viewpoint> {
  const { hiddenGuids, selectedGuids, ...rest } = data;
  return prisma.viewpoint.update({
    where: { id },
    data: {
      ...rest,
      ...(hiddenGuids !== undefined
        ? { hiddenGuids: hiddenGuids != null ? JSON.stringify(hiddenGuids) : null }
        : {}),
      ...(selectedGuids !== undefined
        ? { selectedGuids: selectedGuids != null ? JSON.stringify(selectedGuids) : null }
        : {}),
    },
  });
}

export async function deleteViewpoint(id: string): Promise<void> {
  await prisma.viewpoint.delete({ where: { id } });
}
