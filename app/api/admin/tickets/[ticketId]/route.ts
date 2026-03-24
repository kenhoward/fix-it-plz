import { verifyAdminSession } from "@/lib/auth/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// GET  /api/admin/tickets/:ticketId — ticket detail + events + member info
// PATCH /api/admin/tickets/:ticketId — change ticket status

type RouteParams = { params: Promise<{ ticketId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const claims = await verifyAdminSession();
  if (!claims) {
    return Response.json({ error: "Not authorized" }, { status: 401 });
  }

  const { ticketId } = await params;
  const doc = await adminDb.collection("tickets").doc(ticketId).get();

  if (!doc.exists) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const data = doc.data()!;

  // Get creator's info
  const memberDoc = await adminDb
    .collection("family_members")
    .doc(data.createdBy as string)
    .get();
  const member = memberDoc.exists
    ? { name: memberDoc.data()!.name as string, avatar: memberDoc.data()!.avatar as string }
    : { name: "Unknown", avatar: "👤" };

  // Get events sorted by creation time
  const eventsSnap = await adminDb
    .collection("tickets")
    .doc(ticketId)
    .collection("events")
    .get();

  const events = eventsSnap.docs
    .map((e) => ({
      id: e.id,
      ...e.data(),
      createdAt: e.data().createdAt?.toDate().toISOString(),
    }))
    .sort((a, b) => (a.createdAt as string).localeCompare(b.createdAt as string));

  return Response.json({
    ticket: {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString(),
      memberName: member.name,
      memberAvatar: member.avatar,
    },
    events,
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const claims = await verifyAdminSession();
  if (!claims) {
    return Response.json({ error: "Not authorized" }, { status: 401 });
  }

  const { ticketId } = await params;
  const doc = await adminDb.collection("tickets").doc(ticketId).get();

  if (!doc.exists) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { status } = body as { status?: string };
  const validStatuses = ["open", "in_progress", "done", "cancelled"];

  if (!status || !validStatuses.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const oldStatus = doc.data()!.status as string;

  await adminDb.collection("tickets").doc(ticketId).update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Log status change event
  await adminDb
    .collection("tickets")
    .doc(ticketId)
    .collection("events")
    .add({
      ticketId,
      type: "status_change",
      fromStatus: oldStatus,
      toStatus: status,
      message: `Status changed from ${oldStatus} to ${status}`,
      actor: "admin",
      createdAt: FieldValue.serverTimestamp(),
    });

  return Response.json({ success: true });
}
