import { clearAdminSession } from "@/lib/auth/admin-session";

// POST /api/admin/logout
//
// Clears the admin session cookie.

export async function POST() {
  await clearAdminSession();
  return Response.json({ success: true });
}
