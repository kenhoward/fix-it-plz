import { verifyAdminSession } from "@/lib/auth/admin-session";
import { adminDb } from "@/lib/firebase/admin";

// GET /api/admin/me
//
// Verifies the admin session cookie and returns the admin profile,
// or 401 if not authenticated.

export async function GET() {
  const claims = await verifyAdminSession();
  if (!claims) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  const adminDoc = await adminDb.collection("admins").doc(claims.uid).get();
  if (!adminDoc.exists) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  return Response.json({
    authenticated: true,
    admin: {
      id: adminDoc.id,
      email: (claims.email as string) ?? "",
      displayName: (adminDoc.data()?.displayName as string) || claims.email || "",
    },
  });
}
