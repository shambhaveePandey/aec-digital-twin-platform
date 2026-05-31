import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getTwinById, getWorkspaceMember, createSensor, listSensors } from "@/lib/db";
import { createSensorSchema } from "@/lib/validation/upload";

type Ctx = { params: { twinId: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const twin = await getTwinById(params.twinId);
  if (!twin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await getWorkspaceMember(twin.workspaceId, userId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sensors = await listSensors(params.twinId);
  return NextResponse.json({ sensors });
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
  const parsed = createSensorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const sensor = await createSensor({ ...parsed.data, twinId: params.twinId });
  return NextResponse.json(sensor, { status: 201 });
}
