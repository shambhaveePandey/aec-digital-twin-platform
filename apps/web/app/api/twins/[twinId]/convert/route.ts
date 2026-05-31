import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  getTwinById,
  getWorkspaceMember,
  getModelVersionById,
  updateModelVersion,
  createJob,
} from "@/lib/db";
import { z } from "zod";

type Ctx = { params: { twinId: string } };

const schema = z.object({ modelVersionId: z.string().cuid() });

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
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const version = await getModelVersionById(parsed.data.modelVersionId);
  if (!version || version.twinId !== params.twinId) {
    return NextResponse.json({ error: "Model version not found" }, { status: 404 });
  }
  if (!version.ifcFileKey) {
    return NextResponse.json({ error: "IFC file not uploaded yet" }, { status: 422 });
  }
  if (version.status === "PROCESSING" || version.status === "READY") {
    return NextResponse.json(
      { error: `Cannot re-convert a version with status: ${version.status}` },
      { status: 409 },
    );
  }

  await updateModelVersion(version.id, { status: "PENDING" });

  const job = await createJob({
    type: "IFC_CONVERT",
    twinId: params.twinId,
    modelVersionId: version.id,
    payload: { ifcFileKey: version.ifcFileKey },
    priority: 0,
  });

  return NextResponse.json({ jobId: job.id, modelVersionId: version.id }, { status: 202 });
}
