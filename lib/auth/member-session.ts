import { cookies } from "next/headers";
import crypto from "crypto";
import { requireEnv } from "@/lib/env";

// ── Family member session management ────────────────────────────────
//
// Family members don't have Firebase Auth accounts. After they verify
// with their personal code, we issue an HMAC-signed cookie that
// contains their member ID. This cookie is:
//   - httpOnly (JavaScript can't read it)
//   - signed (tamper-proof — changing the member ID invalidates the sig)
//   - sameSite=lax (basic CSRF protection)
//
// The MEMBER_SESSION_SECRET env var is used as the HMAC key. Generate
// one with: openssl rand -hex 32

const COOKIE_NAME = "member_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  return requireEnv("MEMBER_SESSION_SECRET");
}

function sign(memberId: string): string {
  const hmac = crypto.createHmac("sha256", getSecret());
  hmac.update(memberId);
  return hmac.digest("hex");
}

/** Create a signed cookie value: memberId.signature */
function encode(memberId: string): string {
  return `${memberId}.${sign(memberId)}`;
}

/** Parse and verify a signed cookie value. Returns memberId or null. */
function decode(value: string): string | null {
  const dotIndex = value.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const memberId = value.substring(0, dotIndex);
  const signature = value.substring(dotIndex + 1);

  // Timing-safe comparison to prevent timing attacks
  const expected = sign(memberId);
  if (expected.length !== signature.length) return null;

  const isValid = crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature),
  );

  return isValid ? memberId : null;
}

// ── Public API ──────────────────────────────────────────────────────

/** Set the member session cookie. Call from a route handler after verification. */
export async function setMemberSession(memberId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encode(memberId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** Read and verify the member session cookie. Returns memberId or null. */
export async function getMemberSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return null;
  return decode(cookie.value);
}

/** Clear the member session cookie. */
export async function clearMemberSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
