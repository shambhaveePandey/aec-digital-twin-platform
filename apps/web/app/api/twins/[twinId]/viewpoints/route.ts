import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  getTwinById,
  getWorkspaceMember,
  createViewpoint,
  listViewpoints,
} from "@/lib/db";
import { z } from "zod";

type Ctx = { params: { twinId: string } };

const vec3 = z.object({ x: z.number(), y: z.number(), z: z.number() });

const createViewpointSchema = z.object({
  label: z.string().max(100).optional(),
  cameraPosition: vec3,
  cameraTarget: vec3,
  cameraUp: vec3,
  isOrthographic: z.boolean().default(false),
  orthographicSize: z.number().optional(),
  hiddenGuids: z.array(z.string()).optional(),
  selectedGuids: z.array(z.string()).optional(),
  issueId: z.string().cuid().optional(),
});

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const twin = await getTwinById(params.twinId);
  if (!twin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await getWorkspaceMember(twin.workspaceId, userId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const viewpoints = await listViewpoints(params.twinId);
  return NextResponse.json({ viewpoints });
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
  const parsed = createViewpointSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const viewpoint = await createViewpoint({ ...parsed.data, twinId: params.twinId });
  return NextResponse.json(viewpoint, { status: 201 });
}
