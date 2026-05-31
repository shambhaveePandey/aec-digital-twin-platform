import type { Issue, IssueComment, Prisma } from "@prisma/client";
import type { IssuePriority, IssueStatus } from "./enums";
import { prisma } from "./client";

// ─── Issues ───────────────────────────────────────────────────────────────────

export type CreateIssueInput = {
  twinId: string;
  title: string;
  description?: string;
  priority?: IssuePriority;
  assigneeId?: string;
  reportedById?: string;
  ifcGuid?: string;
  expressId?: number;
  dueDate?: Date;
};

export async function createIssue(data: CreateIssueInput): Promise<Issue> {
  return prisma.issue.create({ data });
}

export async function getIssueById(id: string) {
  return prisma.issue.findUnique({
    where: { id },
    include: {
      comments: { orderBy: { createdAt: "asc" } },
      viewpoints: true,
    },
  });
}

export type ListIssuesOptions = {
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: string;
  skip?: number;
  take?: number;
};

export async function listIssues(twinId: string, options: ListIssuesOptions = {}) {
  const { status, priority, assigneeId, skip = 0, take = 50 } = options;

  const where: Prisma.IssueWhereInput = {
    twinId,
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(assigneeId ? { assigneeId } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.issue.findMany({
      where,
      include: {
        _count: { select: { comments: true } },
        viewpoints: { select: { id: true, snapshotKey: true }, take: 1 },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    prisma.issue.count({ where }),
  ]);

  return { items, total };
}

export type UpdateIssueInput = Partial<
  Pick<
    Issue,
    "title" | "description" | "status" | "priority" | "assigneeId" | "dueDate"
  >
>;

const CLOSED_STATUSES: IssueStatus[] = ["CLOSED", "RESOLVED", "WONT_FIX"];

export async function updateIssue(id: string, data: UpdateIssueInput): Promise<Issue> {
  const shouldClose =
    data.status !== undefined && (CLOSED_STATUSES as string[]).includes(data.status);
  return prisma.issue.update({
    where: { id },
    data: {
      ...data,
      ...(shouldClose ? { closedAt: new Date() } : {}),
    },
  });
}

export async function deleteIssue(id: string): Promise<void> {
  await prisma.issue.delete({ where: { id } });
}

// ─── Issue Comments ───────────────────────────────────────────────────────────

export type CreateIssueCommentInput = {
  issueId: string;
  authorId?: string;
  body: string;
};

export async function createIssueComment(
  data: CreateIssueCommentInput,
): Promise<IssueComment> {
  return prisma.issueComment.create({ data });
}

export async function getIssueComments(issueId: string): Promise<IssueComment[]> {
  return prisma.issueComment.findMany({
    where: { issueId },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateIssueComment(id: string, body: string): Promise<IssueComment> {
  return prisma.issueComment.update({ where: { id }, data: { body } });
}

export async function deleteIssueComment(id: string): Promise<void> {
  await prisma.issueComment.delete({ where: { id } });
}
