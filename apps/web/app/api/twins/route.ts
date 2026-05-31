import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { createTwin, listTwins, getWorkspaceMember } from "@/lib/db";
import { createTwinSchema, listTwinsSchema } from "@/lib/validation/twin";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = req.nextUrl;
  const parsed = listTwinsSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const member = await getWorkspaceMember(parsed.data.workspaceId, userId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await listTwins(parsed.data.workspaceId, {
    status: parsed.data.status,
    search: parsed.data.search,
    skip: parsed.data.skip,
    take: parsed.data.take,
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json().catch(() => null);
  const parsed = createTwinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const member = await getWorkspaceMember(parsed.data.workspaceId, userId);
  if (!member || member.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const twin = await createTwin(parsed.data);
  return NextResponse.json(twin, { status: 201 });
}
