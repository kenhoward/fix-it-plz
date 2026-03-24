import { verifyAdminSession } from "@/lib/auth/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// POST /api/admin/tickets/:ticketId/comments
//
// Adds an admin comment to a ticket's event log.

type RouteParams = { params: Promise<{ ticketId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
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
  const { message } = body as { message?: string };

  if (!message?.trim()) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  await adminDb
    .collection("tickets")
    .doc(ticketId)
    .collection("events")
    .add({
      ticketId,
      type: "comment",
      message: message.trim(),
      actor: "admin",
      createdAt: FieldValue.serverTimestamp(),
    });

  // Touch the ticket's updatedAt
  await adminDb.collection("tickets").doc(ticketId).update({
    updatedAt: FieldValue.serverTimestamp(),
  });

  return Response.json({ success: true }, { status: 201 });
}
