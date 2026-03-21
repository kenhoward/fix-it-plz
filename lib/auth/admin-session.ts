import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

// ── Admin session management ────────────────────────────────────────
//
// The admin signs in with Firebase Auth (email/password). The client
// SDK gets an ID token, then sends it to a login API route. We verify
// the token with the Admin SDK and issue a Firebase session cookie.
//
// This is Firebase's recommended approach for server-side auth:
// https://firebase.google.com/docs/auth/admin/manage-cookies

const COOKIE_NAME = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 5; // 5 days (Firebase max is 14 days)

/** Verify a Firebase ID token and create a session cookie. */
export async function createAdminSession(idToken: string): Promise<void> {
  // This throws if the token is invalid or expired
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: MAX_AGE * 1000, // Firebase wants milliseconds
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** Verify the admin session cookie. Returns the decoded claims or null. */
export async function verifyAdminSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return null;

  try {
    return await adminAuth.verifySessionCookie(cookie.value, true);
  } catch {
    return null;
  }
}

/** Clear the admin session cookie. */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
