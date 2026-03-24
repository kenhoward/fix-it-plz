import { adminDb } from "@/lib/firebase/admin";
import { getMemberSession } from "@/lib/auth/member-session";
import { FieldValue } from "firebase-admin/firestore";
import type { TicketCategory } from "@/lib/types";

// GET    /api/tickets/:ticketId — get a single ticket (member can only see their own)
// PATCH  /api/tickets/:ticketId — update a ticket (member can only edit their own, only while open)
// DELETE /api/tickets/:ticketId — cancel a ticket (member can only cancel their own)

type RouteParams = { params: Promise<{ ticketId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const memberId = await getMemberSession();
  if (!memberId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { ticketId } = await params;
  const doc = await adminDb.collection("tickets").doc(ticketId).get();

  if (!doc.exists || doc.data()?.createdBy !== memberId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch events subcollection for the activity timeline
  const eventsSnap = await adminDb
    .collection("tickets")
    .doc(ticketId)
    .collection("events")
    .orderBy("createdAt", "desc")
    .get();

  const events = eventsSnap.docs.map((e) => ({
    id: e.id,
    ...e.data(),
    createdAt: e.data().createdAt?.toDate().toISOString(),
  }));

  return Response.json({
    ticket: {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate().toISOString(),
      updatedAt: doc.data()?.updatedAt?.toDate().toISOString(),
    },
    events,
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const memberId = await getMemberSession();
  if (!memberId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { ticketId } = await params;
  const doc = await adminDb.collection("tickets").doc(ticketId).get();

  if (!doc.exists || doc.data()?.createdBy !== memberId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (doc.data()?.status !== "open") {
    return Response.json(
      { error: "Can only edit tickets that are still open" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { title, description, category, room } = body as {
    title?: string;
    description?: string;
    category?: TicketCategory;
    room?: string;
  };

  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;
  if (room !== undefined) updates.room = room;

  await adminDb.collection("tickets").doc(ticketId).update(updates);

  // Log the edit event
  await adminDb
    .collection("tickets")
    .doc(ticketId)
    .collection("events")
    .add({
      ticketId,
      type: "edit",
      message: "Ticket updated",
      actor: memberId,
      createdAt: FieldValue.serverTimestamp(),
    });

  return Response.json({ success: true });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const memberId = await getMemberSession();
  if (!memberId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { ticketId } = await params;
  const doc = await adminDb.collection("tickets").doc(ticketId).get();

  if (!doc.exists || doc.data()?.createdBy !== memberId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const currentStatus = doc.data()?.status;
  if (currentStatus !== "open" && currentStatus !== "in_progress") {
    return Response.json(
      { error: "Can only cancel open or in-progress tickets" },
      { status: 403 },
    );
  }

  const oldStatus = currentStatus;

  await adminDb.collection("tickets").doc(ticketId).update({
    status: "cancelled",
    updatedAt: FieldValue.serverTimestamp(),
  });

  await adminDb
    .collection("tickets")
    .doc(ticketId)
    .collection("events")
    .add({
      ticketId,
      type: "status_change",
      fromStatus: oldStatus,
      toStatus: "cancelled",
      message: "Cancelled by requester",
      actor: memberId,
      createdAt: FieldValue.serverTimestamp(),
    });

  return Response.json({ success: true });
}
