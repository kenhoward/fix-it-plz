import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { createAdminSession } from "@/lib/auth/admin-session";

// POST /api/admin/login
//
// Accepts a Firebase ID token from the client SDK, verifies it,
// checks the user exists in the `admins` collection, then creates
// a server-side session cookie.

export async function POST(request: Request) {
  const body = await request.json();
  const { idToken } = body as { idToken?: string };

  if (!idToken) {
    return Response.json({ error: "Missing ID token" }, { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Only allow users who have a document in the admins collection
    const adminDoc = await adminDb.collection("admins").doc(decoded.uid).get();
    if (!adminDoc.exists) {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    await createAdminSession(idToken);

    return Response.json({
      success: true,
      admin: {
        id: adminDoc.id,
        email: decoded.email ?? "",
        displayName: (adminDoc.data()?.displayName as string) || decoded.email || "",
      },
    });
  } catch {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }
}
