import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  getTwinById,
  getWorkspaceMember,
  getLatestModelVersion,
  getElementProperties,
  queryElementsByClass,
} from "@/lib/db";

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
  const ifcGuid = searchParams.get("ifcGuid");
  const ifcClass = searchParams.get("ifcClass");

  const version = await getLatestModelVersion(params.twinId);
  if (!version) {
    return NextResponse.json({ error: "No ready model version found" }, { status: 404 });
  }

  if (ifcGuid) {
    const props = await getElementProperties(version.id, ifcGuid);
    if (!props) return NextResponse.json({ error: "Element not found" }, { status: 404 });
    return NextResponse.json(props);
  }

  if (ifcClass) {
    const elements = await queryElementsByClass(version.id, ifcClass);
    return NextResponse.json({ elements });
  }

  return NextResponse.json(
    { error: "Provide ?ifcGuid=… or ?ifcClass=… query param" },
    { status: 400 },
  );
}
