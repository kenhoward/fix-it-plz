import { adminDb } from "@/lib/firebase/admin";
import { getMemberSession } from "@/lib/auth/member-session";
import { FieldValue } from "firebase-admin/firestore";
import { checkRateLimit } from "@/lib/rate-limit";
import type { TicketCategory } from "@/lib/types";

// GET /api/tickets — list the current family member's tickets
// POST /api/tickets — create a new ticket

const CREATE_RATE_LIMIT = { windowMs: 60 * 1000, maxRequests: 5 }; // 5 per minute

export async function GET() {
  const memberId = await getMemberSession();
  if (!memberId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const snap = await adminDb
    .collection("tickets")
    .where("createdBy", "==", memberId)
    .get();

  const tickets = snap.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }))
    .sort((a, b) => (b.createdAt as string).localeCompare(a.createdAt as string));

  return Response.json({ tickets });
}

export async function POST(request: Request) {
  const memberId = await getMemberSession();
  if (!memberId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Rate limit ticket creation
  const limit = checkRateLimit(`create-ticket:${memberId}`, CREATE_RATE_LIMIT);
  if (!limit.allowed) {
    return Response.json(
      { error: "Slow down! Try again in a minute." },
      { status: 429 },
    );
  }

  const body = await request.json();
  const { title, description, category, room } = body as {
    title?: string;
    description?: string;
    category?: TicketCategory;
    room?: string;
  };

  if (!title || !category || !room) {
    return Response.json(
      { error: "Missing required fields: title, category, room" },
      { status: 400 },
    );
  }

  const ticketData = {
    title,
    description: description ?? "",
    category,
    room,
    status: "open",
    createdBy: memberId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const docRef = await adminDb.collection("tickets").add(ticketData);
  const doc = await docRef.get();

  return Response.json(
    {
      ticket: {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate().toISOString(),
        updatedAt: doc.data()?.updatedAt?.toDate().toISOString(),
      },
    },
    { status: 201 },
  );
}
