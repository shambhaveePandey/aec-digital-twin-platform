const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export type UploadTarget = {
  uploadUrl: string;
  s3Key: string;
  modelVersionId: string;
};

/**
 * Requests a pre-signed upload URL from the API then uploads the file
 * directly to S3. Returns the modelVersionId to use for conversion.
 */
export async function uploadIfc(
  twinId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  // Step 1: get a pre-signed target
  const res = await fetch(`${BASE}/api/uploads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      twinId,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    }),
  });
  if (!res.ok) throw new Error(`Failed to create upload target: ${res.status}`);
  const { uploadUrl, modelVersionId } = (await res.json()) as UploadTarget;

  // Step 2: PUT the file directly to S3
  await uploadWithProgress(uploadUrl, file, onProgress);

  return modelVersionId;
}

function uploadWithProgress(
  url: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.send(file);
  });
}

/** Enqueues the IFC → Fragments conversion job for a model version. */
export async function requestConversion(
  twinId: string,
  modelVersionId: string,
): Promise<{ jobId: string }> {
  const res = await fetch(`${BASE}/api/twins/${twinId}/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelVersionId }),
  });
  if (!res.ok) throw new Error(`Failed to enqueue conversion: ${res.status}`);
  return res.json();
}
