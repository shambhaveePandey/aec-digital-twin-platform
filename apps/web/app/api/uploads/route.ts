import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getTwinById, getWorkspaceMember, createModelVersion, createTwinFile } from "@/lib/db";
import { getUploadPresignedUrl, ifcSourceKey } from "@/lib/storage/s3";
import { requestUploadSchema } from "@/lib/validation/upload";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json().catch(() => null);
  const parsed = requestUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { twinId, filename, contentType, sizeBytes } = parsed.data;

  const twin = await getTwinById(twinId);
  if (!twin) return NextResponse.json({ error: "Twin not found" }, { status: 404 });

  const member = await getWorkspaceMember(twin.workspaceId, userId);
  if (!member || member.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Create a pending model version to track the upload
  const modelVersion = await createModelVersion({
    twinId,
    ifcFileName: filename,
    ifcFileSizeBytes: BigInt(sizeBytes),
  });

  const s3Key = ifcSourceKey(twinId, modelVersion.id, filename);

  // Record the file metadata
  await createTwinFile({
    twinId,
    fileType: "IFC_SOURCE",
    name: filename,
    s3Key,
    sizeBytes: BigInt(sizeBytes),
    mimeType: contentType,
    uploadedById: userId,
  });

  // Generate pre-signed URL for direct browser → S3 upload
  const uploadUrl = await getUploadPresignedUrl(s3Key, contentType);

  return NextResponse.json({
    uploadUrl,
    s3Key,
    modelVersionId: modelVersion.id,
  });
}
