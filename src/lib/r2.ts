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

// Generate an expiration URL to view/download a file safely.
// The optional filename nudges browsers to download instead of inline-open.
export async function getDownloadUrl(
  key: string,
  expiresInSeconds = 3600,
  filename?: string,
) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: filename
      ? `attachment; filename="${filename.replace(/["\\]/g, "_")}"`
      : "attachment",
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
) {
  if (!process.env.R2_ENDPOINT || !process.env.R2_BUCKET_NAME) {
    return null;
  }

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: Buffer.from(body),
      ContentType: mimeType,
    })
  );

  const publicBase =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ??
    process.env.R2_PUBLIC_URL ??
    process.env.R2_ENDPOINT;

  if (!publicBase) {
    return null;
  }

  const normalizedBase = publicBase.replace(/\/$/, "");
  const bucketUrl = normalizedBase.endsWith(`/${BUCKET_NAME}`)
    ? normalizedBase
    : `${normalizedBase}/${BUCKET_NAME}`;

  return `${bucketUrl}/${key}`;
}
