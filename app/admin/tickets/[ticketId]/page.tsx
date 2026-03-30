"use client";

import { useAdminAuth } from "@/lib/hooks/use-admin-auth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { CATEGORY_CONFIG, formatDate } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────

interface TicketDetail {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  room: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberName: string;
  memberAvatar: string;
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

// ── Constants ────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "open", label: "Open", className: "border-emerald-300 bg-emerald-50 text-emerald-700", active: "ring-2 ring-emerald-500" },
  { value: "in_progress", label: "In Progress", className: "border-amber-300 bg-amber-50 text-amber-700", active: "ring-2 ring-amber-500" },
  { value: "done", label: "Done", className: "border-blue-300 bg-blue-50 text-blue-700", active: "ring-2 ring-blue-500" },
  { value: "cancelled", label: "Cancelled", className: "border-slate-300 bg-slate-50 text-slate-500", active: "ring-2 ring-slate-400" },
];

// ── Page ─────────────────────────────────────────────────────────────

export default function AdminTicketDetailPage() {
  const { authenticated, loading: authLoading } = useAdminAuth();
  const router = useRouter();
  const params = useParams();
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [changingStatus, setChangingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.replace("/admin/login");
    }
  }, [authLoading, authenticated, router]);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`);
      if (!res.ok) throw new Error("Failed to load ticket");
      const data = await res.json();
      setTicket(data.ticket);
      setEvents(data.events);
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

  async function handleStatusChange(newStatus: string) {
    if (!ticket || newStatus === ticket.status || changingStatus) return;
    setChangingStatus(true);
    setStatusError(null);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await fetchTicket();
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to update status");
      await fetchTicket();
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || addingComment) return;
    setAddingComment(true);
    setCommentError(null);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: comment.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      setComment("");
      await fetchTicket();
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setAddingComment(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete ticket");
      router.replace("/admin");
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  // ── Guards ───────────────────────────────────────────────────────

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
        <AdminHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
          <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="h-6 w-3/5 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-slate-100" />
            <div className="mt-4 flex gap-3">
              <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
          <div className="mt-6 h-10 animate-pulse rounded-xl bg-slate-100" />
        </main>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex flex-1 flex-col">
        <AdminHeader />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 text-center animate-fade-in">
          <p className="text-4xl">😕</p>
          <p className="mt-3 text-lg font-medium text-slate-900">
            {error ?? "Ticket not found"}
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  const cat = CATEGORY_CONFIG[ticket.category] ?? CATEGORY_CONFIG.other;

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col">
      <AdminHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 animate-fade-in">
        {/* Back link */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          &larr; All requests
        </Link>

        {/* Ticket info card */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg font-bold text-slate-900">{ticket.title}</h1>
            <StatusBadge status={ticket.status} />
          </div>

          {ticket.description && (
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{ticket.description}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
            <span>{cat.icon} {cat.label}</span>
            <span>📍 {ticket.room}</span>
            <span>
              {ticket.memberAvatar} {ticket.memberName}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 text-xs text-slate-400">
            <span>Created {formatDate(ticket.createdAt)}</span>
            <span>Updated {formatDate(ticket.updatedAt)}</span>
          </div>
        </div>

        {/* Status controls */}
        <div className="mt-5">
          <h2 className="text-sm font-semibold text-slate-700">Status</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                disabled={changingStatus}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${opt.className} ${
                  ticket.status === opt.value ? opt.active : "opacity-60 hover:opacity-100"
                } disabled:cursor-not-allowed`}
              >
                {opt.label}
              </button>
            ))}
            {changingStatus && (
              <span className="flex items-center text-xs text-slate-400">
                <span className="mr-1.5 h-3 w-3 animate-spin rounded-full border border-slate-300 border-t-slate-600" />
                Updating...
              </span>
            )}
          </div>
          {statusError && (
            <p className="mt-2 text-xs text-red-500 animate-fade-in">{statusError}</p>
          )}
        </div>

        {/* Delete */}
        <div className="mt-5">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-all hover:bg-red-50 hover:text-red-600"
            >
              Delete ticket
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 animate-fade-in">
              <p className="text-sm text-red-600">Permanently delete this ticket?</p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Add comment */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-700">Add a note</h2>
          <form onSubmit={handleAddComment} className="mt-2 flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setCommentError(null);
              }}
              placeholder="e.g. Ordered the part, arriving Thursday"
              maxLength={500}
              className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!comment.trim() || addingComment}
              className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
            >
              {addingComment ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                  Posting
                </span>
              ) : (
                "Post"
              )}
            </button>
          </form>
          {commentError && (
            <p className="mt-2 text-xs text-red-500 animate-fade-in">{commentError}</p>
          )}
        </div>

        {/* Event timeline */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-700">Activity</h2>

          {events.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No activity yet.</p>
          ) : (
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
                          Status changed from{" "}
                          <span className="font-medium">{event.fromStatus?.replace("_", " ")}</span>
                          {" "}to{" "}
                          <span className="font-medium">{event.toStatus?.replace("_", " ")}</span>
                        </>
                      )}
                      {event.type === "comment" && event.message}
                      {event.type === "edit" && (event.message || "Ticket updated")}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {event.actor === "admin" ? "Admin" : ticket.memberName}
                      {" · "}
                      {formatDate(event.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
