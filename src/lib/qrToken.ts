import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import crypto from "crypto";

const secret = process.env.QR_TOKEN_SECRET ?? (process.env.NODE_ENV === "development" ? "dev-qr-token-secret" : undefined);

if (!secret) {
  throw new Error("QR_TOKEN_SECRET is not set");
}

const SECRET_KEY = new TextEncoder().encode(secret);
const ALG = "HS256";
const TTL = 60 * 60 * 24 * 7;

//This is what the QR token will carry
export interface QRTokenPayload {
  user_id: string;
  event_id: string;
  nonce?: string;
  iat?: number;
  exp?: number;
}

export interface GenerateQRTokenOptions {
  userId: string;
  eventId: string;
  ttl?: number;
  nonce?: string;
}

export interface VerifiedQRToken {
  userId: string;
  eventId: string;
  issuedAt: Date;
  expiresAt: Date;
  raw: JWTPayload & QRTokenPayload;
}

export async function generateQRToken({
  userId,
  eventId,
  ttl = TTL,
  nonce,
}: GenerateQRTokenOptions): Promise<string> {
  if (!userId?.trim()) throw new Error("userId is required");
  if (!eventId?.trim()) throw new Error("eventId is required");
  if (ttl <= 0) throw new Error("ttlSeconds must be positive");

  const now = Math.floor(Date.now() / 1000);
  const uniqueNonce = nonce ?? `${userId}:${eventId}:${now}:${crypto.randomUUID()}`;

  return new SignJWT({
    user_id: userId,
    event_id: eventId,
    nonce: uniqueNonce,
  } satisfies QRTokenPayload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt(now)
    .setExpirationTime(now + ttl)
    .sign(SECRET_KEY);
}

// Verify the token signature and decode its payload.
// jwtVerify will throw if the token is invalid, expired,
// or signed with an unexpected algorithm/secret.
export async function verifyQRToken(token: string): Promise<VerifiedQRToken> {
  const { payload } = await jwtVerify<QRTokenPayload>(token, SECRET_KEY, {
    algorithms: [ALG],
  });

  const { user_id, event_id, nonce, iat, exp } = payload;

  if (!user_id) throw new Error("Token missing user_id");
  if (!event_id) throw new Error("Token missing event_id");
  if (!iat) throw new Error("Token missing issuedAt time");
  if (!exp) throw new Error("Token missing expiration time");

  return {
    userId: user_id,
    eventId: event_id,
    issuedAt: new Date(iat * 1000),
    expiresAt: new Date(exp * 1000),
    raw: payload,
  };
}