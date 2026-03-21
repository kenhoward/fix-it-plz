import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Ticket, TicketEvent, TicketCategory, TicketStatus } from "@/lib/types";

// ── Firestore collection structure ──────────────────────────────────
//
//   tickets/{ticketId}             → Ticket document
//   tickets/{ticketId}/events/{id} → TicketEvent (status changes, edits, comments)
//   family_members/{memberId}      → FamilyMember document
//   config/family                  → FamilyConfig (verification question)
//   admins/{uid}                   → AdminProfile
//

const ticketsCollection = collection(db, "tickets");

// ── Helpers ─────────────────────────────────────────────────────────

function toDate(value: Timestamp | Date): Date {
  return value instanceof Timestamp ? value.toDate() : value;
}

function ticketFromDoc(docSnap: { id: string; data: () => Record<string, unknown> | undefined }): Ticket {
  const d = docSnap.data()!;
  return {
    id: docSnap.id,
    title: d.title as string,
    description: d.description as string,
    category: d.category as TicketCategory,
    status: d.status as TicketStatus,
    room: d.room as string,
    createdBy: d.createdBy as string,
    createdAt: toDate(d.createdAt as Timestamp),
    updatedAt: toDate(d.updatedAt as Timestamp),
  };
}

// ── Create ──────────────────────────────────────────────────────────

interface CreateTicketInput {
  title: string;
  description: string;
  category: TicketCategory;
  room: string;
  createdBy: string; // FamilyMember.id
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const docRef = await addDoc(ticketsCollection, {
    ...input,
    status: "open" as TicketStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Return the ticket with a proper id so the caller can use it immediately
  const snap = await getDoc(docRef);
  return ticketFromDoc(snap);
}

// ── Update (admin or family member editing their own ticket) ────────

interface UpdateTicketInput {
  title?: string;
  description?: string;
  category?: TicketCategory;
  room?: string;
}

export async function updateTicket(
  ticketId: string,
  updates: UpdateTicketInput,
  actor: string,
): Promise<void> {
  const ref = doc(db, "tickets", ticketId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  await addEvent(ticketId, {
    type: "edit",
    message: "Ticket updated",
    actor,
  });
}

// ── Change status (admin workflow) ──────────────────────────────────

export async function changeTicketStatus(
  ticketId: string,
  newStatus: TicketStatus,
  actor: string,
  message?: string,
): Promise<void> {
  const ref = doc(db, "tickets", ticketId);
  const snap = await getDoc(ref);
  const oldStatus = snap.data()?.status as TicketStatus;

  await updateDoc(ref, {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });

  await addEvent(ticketId, {
    type: "status_change",
    fromStatus: oldStatus,
    toStatus: newStatus,
    message,
    actor,
  });
}

// ── Cancel (family member cancels their own request) ────────────────

export async function cancelTicket(ticketId: string, memberId: string): Promise<void> {
  await changeTicketStatus(ticketId, "cancelled", memberId, "Cancelled by requester");
}

// ── Query ───────────────────────────────────────────────────────────

export async function getTicketsForMember(memberId: string): Promise<Ticket[]> {
  const q = query(
    ticketsCollection,
    where("createdBy", "==", memberId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map(ticketFromDoc);
}

export async function getAllTickets(): Promise<Ticket[]> {
  const q = query(ticketsCollection, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(ticketFromDoc);
}

export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  const snap = await getDoc(doc(db, "tickets", ticketId));
  if (!snap.exists()) return null;
  return ticketFromDoc(snap);
}

// ── Events (ticket history) ─────────────────────────────────────────

interface AddEventInput {
  type: TicketEvent["type"];
  fromStatus?: TicketStatus;
  toStatus?: TicketStatus;
  message?: string;
  actor: string;
}

async function addEvent(ticketId: string, input: AddEventInput): Promise<void> {
  const eventsCol = collection(db, "tickets", ticketId, "events");
  await addDoc(eventsCol, {
    ticketId,
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function getTicketEvents(ticketId: string): Promise<TicketEvent[]> {
  const eventsCol = collection(db, "tickets", ticketId, "events");
  const q = query(eventsCol, orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ticketId: data.ticketId as string,
      type: data.type as TicketEvent["type"],
      fromStatus: data.fromStatus as TicketStatus | undefined,
      toStatus: data.toStatus as TicketStatus | undefined,
      message: data.message as string | undefined,
      actor: data.actor as string,
      createdAt: toDate(data.createdAt as Timestamp),
    };
  });
}
