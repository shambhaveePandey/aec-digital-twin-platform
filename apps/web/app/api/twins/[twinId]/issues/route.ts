import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getTwinById, getWorkspaceMember, createIssue, listIssues } from "@/lib/db";
import { createIssueSchema, listIssuesSchema } from "@/lib/validation/issue";

type Ctx = { params: { twinId: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const twin = await getTwinById(params.twinId);
  if (!twin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await getWorkspaceMember(twin.workspaceId, userId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const parsed = listIssuesSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await listIssues(params.twinId, parsed.data);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const twin = await getTwinById(params.twinId);
  if (!twin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await getWorkspaceMember(twin.workspaceId, userId);
  if (!member || member.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createIssueSchema.safeParse({ ...body, twinId: params.twinId });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const issue = await createIssue({ ...parsed.data, reportedById: userId });
  return NextResponse.json(issue, { status: 201 });
}
