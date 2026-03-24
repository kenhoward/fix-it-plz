import { verifyAdminSession } from "@/lib/auth/admin-session";
import { adminDb } from "@/lib/firebase/admin";

// GET /api/admin/tickets
//
// Returns all tickets across all family members, enriched with
// the member's name and avatar. Admin-only.

export async function GET() {
  const claims = await verifyAdminSession();
  if (!claims) {
    return Response.json({ error: "Not authorized" }, { status: 401 });
  }

  // Fetch all tickets and all members in parallel
  const [ticketSnap, memberSnap] = await Promise.all([
    adminDb.collection("tickets").get(),
    adminDb.collection("family_members").get(),
  ]);

  // Build member lookup map
  const memberMap = new Map<string, { name: string; avatar: string }>();
  memberSnap.docs.forEach((doc) => {
    memberMap.set(doc.id, {
      name: doc.data().name as string,
      avatar: doc.data().avatar as string,
    });
  });

  const tickets = ticketSnap.docs
    .map((doc) => {
      const data = doc.data();
      const member = memberMap.get(data.createdBy as string);
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
        memberName: member?.name ?? "Unknown",
        memberAvatar: member?.avatar ?? "👤",
      };
    })
    .sort((a, b) => (b.createdAt as string).localeCompare(a.createdAt as string));

  return Response.json({ tickets });
}
