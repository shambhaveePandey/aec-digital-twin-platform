import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "",
  },
});

const BUCKET = process.env.S3_BUCKET ?? "aec-twin-uploads";

/** Returns a pre-signed PUT URL for direct browser-to-S3 upload. */
export async function getUploadPresignedUrl(
  key: string,
  contentType: string,
  expiresIn = 900,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

/** Returns a pre-signed GET URL for private asset download. */
export async function getDownloadPresignedUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

/** Deletes an object from S3. */
export async function deleteS3Object(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/** Builds the S3 key for an IFC source file. */
export function ifcSourceKey(twinId: string, versionId: string, filename: string): string {
  return `twins/${twinId}/versions/${versionId}/source/${filename}`;
}

/** Builds the S3 key for a converted .frag file. */
export function fragOutputKey(twinId: string, versionId: string): string {
  return `twins/${twinId}/versions/${versionId}/model.frag`;
}

/** Builds the S3 key for a preview image. */
export function previewImageKey(twinId: string, versionId: string): string {
  return `twins/${twinId}/versions/${versionId}/preview.webp`;
}
