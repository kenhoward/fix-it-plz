import { adminDb } from "@/lib/firebase/admin";
import { setMemberSession } from "@/lib/auth/member-session";
import { checkRateLimit } from "@/lib/rate-limit";

// POST /api/auth/verify-member
//
// Body: { memberId: string, code: string }
//
// Verifies a family member's personal code against what's stored in Firestore.
// On success, sets a signed httpOnly cookie so the browser remembers them.
// The verification code never leaves the server.

const RATE_LIMIT = { windowMs: 15 * 60 * 1000, maxRequests: 20 }; // 20 attempts per 15 min

export async function POST(request: Request) {
  // Rate limit by IP
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = checkRateLimit(`verify:${ip}`, RATE_LIMIT);
  if (!limit.allowed) {
    return Response.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  const body = await request.json();
  const { memberId, code } = body as { memberId?: string; code?: string };

  if (!memberId || !code) {
    return Response.json(
      { error: "Missing memberId or code" },
      { status: 400 },
    );
  }

  // Look up the family member in Firestore
  const memberDoc = await adminDb.collection("family_members").doc(memberId).get();

  if (!memberDoc.exists) {
    return Response.json({ error: "Invalid" }, { status: 401 });
  }

  const member = memberDoc.data()!;

  if (!member.active) {
    return Response.json({ error: "Invalid" }, { status: 401 });
  }

  // Compare codes — normalize to lowercase/trimmed
  const storedCode = (member.verificationCode as string).toLowerCase().trim();
  const providedCode = code.toLowerCase().trim();

  if (storedCode !== providedCode) {
    // Generic message — don't reveal whether the member ID exists
    return Response.json({ error: "Invalid" }, { status: 401 });
  }

  // Success — set the session cookie
  await setMemberSession(memberId);

  return Response.json({
    success: true,
    member: {
      id: memberDoc.id,
      name: member.name as string,
      avatar: member.avatar as string,
    },
  });
}
