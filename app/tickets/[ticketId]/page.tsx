"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/header";
import { StatusBadge } from "@/components/status-badge";
import { CATEGORY_CONFIG, formatDate, timeAgo } from "@/lib/utils";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────

interface TicketDetail {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  room: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketEvent {
  id: string;
  type: "status_change" | "comment" | "edit";
  fromStatus?: string;
  toStatus?: string;
  message?: string;
  actor: string;
  createdAt: string;
}

// ── Page ─────────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const { authenticated, loading: authLoading, member } = useAuth();
  const router = useRouter();
  const params = useParams();
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRoom, setEditRoom] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Cancel state
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.replace("/");
    }
  }, [authLoading, authenticated, router]);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Request not found");
        throw new Error("Failed to load request");
      }
      const data = await res.json();
      setTicket(data.ticket);
      setEvents(data.events ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (!authenticated) return;
    fetchTicket();
  }, [authenticated, fetchTicket]);

  // ── Edit handlers ──────────────────────────────────────────────────

  function startEdit() {
    if (!ticket) return;
    setEditTitle(ticket.title);
    setEditDescription(ticket.description ?? "");
    setEditRoom(ticket.room);
    setEditError(null);
    setEditing(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTitle.trim() || !editRoom.trim()) {
      setEditError("Title and room are required");
      return;
    }
    setSaving(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          room: editRoom.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save changes");
      }
      setEditing(false);
      await fetchTicket();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  // ── Cancel handler ─────────────────────────────────────────────────

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel request");
      }
      setShowCancelConfirm(false);
      await fetchTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCancelling(false);
    }
  }

  // ── Permission helpers ─────────────────────────────────────────────

  const canEdit = ticket?.status === "open";
  const canCancel = ticket?.status === "open" || ticket?.status === "in_progress";

  // ── Guards ─────────────────────────────────────────────────────────

  if (authLoading || !authenticated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
          <div className="h-6 w-24 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-4 h-44 animate-pulse rounded-2xl bg-slate-200" />
          <div className="mt-4 h-28 animate-pulse rounded-2xl bg-slate-200" />
        </main>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-12 text-center">
          <p className="text-4xl">😕</p>
          <p className="mt-3 text-lg font-medium text-slate-900">
            {error ?? "Request not found"}
          </p>
          <Link
            href="/tickets"
            className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Back to My Requests
          </Link>
        </main>
      </div>
    );
  }

  const cat = CATEGORY_CONFIG[ticket.category] ?? CATEGORY_CONFIG.other;

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 animate-fade-in">
        {/* Back link */}
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          &larr; My Requests
        </Link>

        {/* Ticket info card */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {editing ? (
            /* ── Edit form ── */
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-slate-700">
                  Title
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={100}
                  className="mt-1.5 block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="edit-desc" className="block text-sm font-medium text-slate-700">
                  Details <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="edit-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="mt-1.5 block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label htmlFor="edit-room" className="block text-sm font-medium text-slate-700">
                  Room
                </label>
                <input
                  id="edit-room"
                  type="text"
                  value={editRoom}
                  onChange={(e) => setEditRoom(e.target.value)}
                  maxLength={50}
                  className="mt-1.5 block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {editError && (
                <p className="text-center text-sm text-red-600">{editError}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving || !editTitle.trim() || !editRoom.trim()}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* ── Display mode ── */
            <>
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-lg font-bold text-slate-900">{ticket.title}</h1>
                <StatusBadge status={ticket.status} />
              </div>

              {ticket.description && (
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {ticket.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                <span>{cat.icon} {cat.label}</span>
                <span>📍 {ticket.room}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 text-xs text-slate-400">
                <span>Created {formatDate(ticket.createdAt)}</span>
                {ticket.updatedAt !== ticket.createdAt && (
                  <span>Updated {formatDate(ticket.updatedAt)}</span>
                )}
              </div>

              {/* Action buttons */}
              {(canEdit || canCancel) && (
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                  {canEdit && (
                    <button
                      onClick={startEdit}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.98]"
                    >
                      Edit
                    </button>
                  )}
                  {canCancel && !showCancelConfirm && (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 active:scale-[0.98]"
                    >
                      Cancel Request
                    </button>
                  )}
                  {showCancelConfirm && (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <span className="text-sm text-slate-500">Are you sure?</span>
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="rounded-xl bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {cancelling ? "Cancelling..." : "Yes, cancel it"}
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="rounded-xl px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Activity timeline */}
        {events.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-700">Activity</h2>
            <div className="mt-3 space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3"
                >
                  <span className="mt-0.5 text-base">
                    {event.type === "status_change"
                      ? "🔄"
                      : event.type === "comment"
                        ? "💬"
                        : "✏️"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">
                      {event.type === "status_change" && (
                        <>
                          Status changed to{" "}
                          <span className="font-medium">{event.toStatus?.replace("_", " ")}</span>
                        </>
                      )}
                      {event.type === "comment" && event.message}
                      {event.type === "edit" && (event.message || "Details updated")}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {event.actor === "admin" ? "Admin" : (member?.name ?? "You")}
                      {" · "}
                      {timeAgo(event.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
