import type { Workspace, WorkspaceMember, WorkspaceRole } from "@prisma/client";
import { prisma } from "./client";

export async function getWorkspaceById(id: string): Promise<Workspace | null> {
  return prisma.workspace.findUnique({ where: { id } });
}

export async function getWorkspaceBySlug(slug: string): Promise<Workspace | null> {
  return prisma.workspace.findUnique({ where: { slug } });
}

export type CreateWorkspaceInput = {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  ownerId: string;
};

/** Creates the workspace and adds the owner as a member in one transaction. */
export async function createWorkspace(data: CreateWorkspaceInput): Promise<Workspace> {
  const { ownerId, ...workspaceData } = data;
  return prisma.workspace.create({
    data: {
      ...workspaceData,
      members: {
        create: {
          userId: ownerId,
          role: "OWNER",
          acceptedAt: new Date(),
        },
      },
    },
  });
}

export type UpdateWorkspaceInput = Partial<
  Pick<Workspace, "name" | "description" | "logoUrl">
>;

export async function updateWorkspace(
  id: string,
  data: UpdateWorkspaceInput,
): Promise<Workspace> {
  return prisma.workspace.update({ where: { id }, data });
}

export async function deleteWorkspace(id: string): Promise<void> {
  await prisma.workspace.delete({ where: { id } });
}

export async function getWorkspaceMembers(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: true },
    orderBy: { invitedAt: "asc" },
  });
}

export async function getWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceMember | null> {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole = "MEMBER",
): Promise<WorkspaceMember> {
  return prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId, userId } },
    create: { workspaceId, userId, role, acceptedAt: new Date() },
    update: { role, acceptedAt: new Date() },
  });
}

export async function updateWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
): Promise<WorkspaceMember> {
  return prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId } },
    data: { role },
  });
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<void> {
  await prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

/** Returns all workspaces where the user has accepted membership. */
export async function getUserWorkspaces(userId: string) {
  return prisma.workspace.findMany({
    where: {
      members: { some: { userId, acceptedAt: { not: null } } },
    },
    include: {
      _count: { select: { twins: true, members: true } },
    },
    orderBy: { name: "asc" },
  });
}
