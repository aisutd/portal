import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!, // e.g., https://<accountid>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

// Generate an expiration URL to view/download a private file safely
export async function getDownloadUrl(
  key: string,
  expiresInSeconds = 3600,
  filename?: string,
) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: filename
      ? `inline; filename="${filename.replace(/["\\]/g, "_")}"`
      : "inline",
  });
  return await getSignedUrl(r2, command, { expiresIn: expiresInSeconds });
}

// Generate an upload URL for client-side direct uploading
export async function getUploadUrl(key: string, mimeType: string, expiresInSeconds = 600) {
  const command = new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key, ContentType: mimeType });
  return await getSignedUrl(r2, command, { expiresIn: expiresInSeconds });
}

export async function putObjectToR2(
  key: string,
  body: Buffer | Uint8Array,
  mimeType: string,
): Promise<string | null> {
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL;

  if (!process.env.R2_ENDPOINT || !BUCKET_NAME || !publicBase) {
    console.error("R2 configuration missing: Ensure R2_ENDPOINT, R2_BUCKET_NAME, and NEXT_PUBLIC_R2_PUBLIC_URL are set.");
    return null;
  }

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: Buffer.from(body),
        ContentType: mimeType,
      })
    );

    const normalizedBase = publicBase.replace(/\/$/, "");
    return `${normalizedBase}/${key}`;
  } catch (error) {
    console.error("Failed to upload object to Cloudflare R2:", error);
    return null;
  }
}