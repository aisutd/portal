import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "./prisma";

function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
}

function getBucketName(): string {
  return process.env.R2_BUCKET_NAME ?? "";
}

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
  const bucket = getBucketName();
  if (!bucket) {
    console.error("R2 configuration missing: R2_BUCKET_NAME is not set.");
    return null;
  }
  const cleanKey = normalizeKey(key);
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: cleanKey,
    ResponseContentDisposition: filename
      ? `inline; filename="${filename.replace(/["\\]/g, "_")}"`
      : "inline",
  });
  return await getSignedUrl(getR2Client(), command, { expiresIn: expiresInSeconds });
}

// Generate an upload URL for client-side direct uploading
export async function getUploadUrl(
  key: string,
  mimeType: string,
  expiresInSeconds = 600
) {
  const bucket = getBucketName();
  if (!bucket) {
    console.error("R2 configuration missing: R2_BUCKET_NAME is not set.");
    return null;
  }
  const cleanKey = normalizeKey(key);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: cleanKey,
    ContentType: mimeType,
  });
  return await getSignedUrl(getR2Client(), command, { expiresIn: expiresInSeconds });
}

export async function putObjectToR2(
  key: string,
  body: Buffer | Uint8Array,
  mimeType: string
): Promise<string | null> {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = getBucketName();
  const publicBase =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL;

  const missing: string[] = [];
  if (!endpoint) missing.push("R2_ENDPOINT");
  if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!bucketName) missing.push("R2_BUCKET_NAME");
  if (!publicBase) missing.push("R2_PUBLIC_URL (or NEXT_PUBLIC_R2_PUBLIC_URL)");

  if (missing.length > 0) {
    console.error(
      `[R2 Error] Missing required environment variable(s): ${missing.join(", ")}`
    );
    return null;
  }

  const cleanKey = normalizeKey(key);

  try {
    const r2 = getR2Client();
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: cleanKey,
        Body: Buffer.from(body),
        ContentType: mimeType,
      })
    );

    const normalizedBase = (publicBase ?? "").replace(/\/$/, "");
    return `${normalizedBase}/${cleanKey}`;
  } catch (error) {
    console.error("Failed to upload object to Cloudflare R2:", error);
    return null;
  }
}

export async function deleteObjectFromR2(storageKey: string): Promise<boolean> {
  const bucketName = getBucketName();
  if (!bucketName) {
    console.error("R2 configuration missing: R2_BUCKET_NAME is not set.");
    return false;
  }

  const cleanKey = normalizeKey(storageKey);

  try {
    const r2 = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: cleanKey,
    });
    await r2.send(command);
    
    await prisma.file.deleteMany({
      where: {
        OR: [{ storageKey }, { storageKey: cleanKey }],
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to delete object from R2:", error);
    return false;
  }
}

export async function setR2Cors() {
  const bucket = getBucketName();
  if (!bucket) {
    console.error("R2 configuration missing: R2_BUCKET_NAME is not set.");
    return;
  }
  const command = new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: [
            "http://localhost:3000",
            "https://portal.aisutd.org",
          ],
          AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
          AllowedHeaders: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  });

  try {
    const r2 = getR2Client();
    await r2.send(command);
    console.log("CORS policy successfully updated on R2 bucket");
  } catch (err) {
    console.error("Failed to set CORS policy:", err);
  }
}