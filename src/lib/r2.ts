import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME ?? "";

/**
 * Ensures object keys do not start with a leading slash.
 */
function normalizeKey(key: string): string {
  return key.replace(/^\//, "");
}

// Generate an expiration URL to view/download a private file safely
export async function getDownloadUrl(
  key: string,
  expiresInSeconds = 3600,
  filename?: string
) {
  const cleanKey = normalizeKey(key);
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: cleanKey,
    ResponseContentDisposition: filename
      ? `inline; filename="${filename.replace(/["\\]/g, "_")}"`
      : "inline",
  });
  return await getSignedUrl(r2, command, { expiresIn: expiresInSeconds });
}

// Generate an upload URL for client-side direct uploading
export async function getUploadUrl(
  key: string,
  mimeType: string,
  expiresInSeconds = 600
) {
  const cleanKey = normalizeKey(key);
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: cleanKey,
    ContentType: mimeType,
  });
  return await getSignedUrl(r2, command, { expiresIn: expiresInSeconds });
}

export async function putObjectToR2(
  key: string,
  body: Buffer | Uint8Array,
  mimeType: string
): Promise<string | null> {
  const publicBase =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL;

  if (!process.env.R2_ENDPOINT || !BUCKET_NAME || !publicBase) {
    console.error(
      "R2 configuration missing: Ensure R2_ENDPOINT, R2_BUCKET_NAME, and NEXT_PUBLIC_R2_PUBLIC_URL or R2_PUBLIC_URL are set."
    );
    return null;
  }

  const cleanKey = normalizeKey(key);

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: cleanKey,
        Body: Buffer.from(body),
        ContentType: mimeType,
      })
    );

    const normalizedBase = publicBase.replace(/\/$/, "");
    return `${normalizedBase}/${cleanKey}`;
  } catch (error) {
    console.error("Failed to upload object to Cloudflare R2:", error);
    return null;
  }
}

export async function deleteObjectFromR2(storageKey: string): Promise<boolean> {
  if (!BUCKET_NAME) {
    console.error("R2 configuration missing: R2_BUCKET_NAME is not set.");
    return false;
  }

  const cleanKey = normalizeKey(storageKey);

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: cleanKey,
    });
    // FIXED: Changed r2Client to r2
    await r2.send(command);
    return true;
  } catch (error) {
    console.error("Failed to delete object from R2:", error);
    return false;
  }
}