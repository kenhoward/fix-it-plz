import { adminDb } from "@/lib/firebase/admin";

// GET /api/members
//
// Returns the list of active family members (id, name, avatar) so the
// verification screen can display them. No authentication required.
// Verification codes are never exposed.

export async function GET() {
  const snap = await adminDb
    .collection("family_members")
    .orderBy("order", "asc")
    .get();

  const members = snap.docs
    .filter((doc) => doc.data().active === true)
    .map((doc) => ({
      id: doc.id,
      name: doc.data().name as string,
      avatar: doc.data().avatar as string,
    }));

  return Response.json({ members });
}
