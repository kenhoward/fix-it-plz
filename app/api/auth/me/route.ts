import { getMemberSession } from "@/lib/auth/member-session";
import { adminDb } from "@/lib/firebase/admin";

// GET /api/auth/me
//
// Returns the currently authenticated family member's profile (from
// the session cookie), or 401 if not verified. Used by the client to
// check if the browser already has a valid session on app load.

export async function GET() {
  const memberId = await getMemberSession();

  if (!memberId) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  const memberDoc = await adminDb.collection("family_members").doc(memberId).get();

  if (!memberDoc.exists || !(memberDoc.data()!.active as boolean)) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  const member = memberDoc.data()!;

  return Response.json({
    authenticated: true,
    member: {
      id: memberDoc.id,
      name: member.name as string,
      avatar: member.avatar as string,
    },
  });
}
