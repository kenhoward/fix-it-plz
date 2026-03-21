import { clearMemberSession } from "@/lib/auth/member-session";

// POST /api/auth/logout
//
// Clears the member session cookie so they can switch to a different
// family member or re-verify.

export async function POST() {
  await clearMemberSession();
  return Response.json({ success: true });
}
