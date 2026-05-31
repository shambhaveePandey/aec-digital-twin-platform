import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  getTwinWithLatestVersion,
  updateTwin,
  deleteTwin,
  getWorkspaceMember,
} from "@/lib/db";
import { updateTwinSchema } from "@/lib/validation/twin";

type Ctx = { params: { twinId: string } };

async function resolveTwinAccess(twinId: string, userId: string) {
  const twin = await getTwinWithLatestVersion(twinId);
  if (!twin) return null;
  const member = await getWorkspaceMember(twin.workspaceId, userId);
  if (!member) return null;
  return { twin, member };
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const access = await resolveTwinAccess(params.twinId, userId);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(access.twin);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const access = await resolveTwinAccess(params.twinId, userId);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (access.member.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateTwinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await updateTwin(params.twinId, parsed.data);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const access = await resolveTwinAccess(params.twinId, userId);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!["OWNER", "ADMIN"].includes(access.member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteTwin(params.twinId);
  return new NextResponse(null, { status: 204 });
}
