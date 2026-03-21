// ── Ticket domain types ──────────────────────────────────────────────

export type TicketStatus =
  | "open"        // just created
  | "in_progress" // parent is working on it
  | "done"        // completed
  | "cancelled";  // family member cancelled their own request

export type TicketCategory =
  | "fix"         // something is broken
  | "install"     // help setting something up
  | "replace"     // swap out a part (lightbulb, battery, etc.)
  | "other";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  room: string;               // e.g. "kitchen", "my bedroom"
  createdBy: string;           // FamilyMember.id
  createdAt: Date;
  updatedAt: Date;
}

// A lightweight log entry so kids can see what happened and the admin
// has an audit trail. Stored as a subcollection under each ticket.
export interface TicketEvent {
  id: string;
  ticketId: string;
  type: "status_change" | "comment" | "edit";
  fromStatus?: TicketStatus;
  toStatus?: TicketStatus;
  message?: string;            // optional note from admin or family member
  actor: string;               // FamilyMember.id or "admin"
  createdAt: Date;
}
