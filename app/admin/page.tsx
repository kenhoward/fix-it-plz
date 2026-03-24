"use client";

import { useAdminAuth } from "@/lib/hooks/use-admin-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import Link from "next/link";

interface AdminTicket {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  room: string;
  createdBy: string;
  createdAt: string;
  memberName: string;
  memberAvatar: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-emerald-100 text-emerald-700" },
  in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-700" },
  done: { label: "Done", className: "bg-blue-100 text-blue-700" },
  cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-500" },
};

const CATEGORY_ICONS: Record<string, string> = {
  fix: "🔧",
  install: "🔨",
  replace: "🔄",
  other: "📋",
};

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function AdminDashboardPage() {
  const { authenticated, loading: authLoading } = useAdminAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"active" | "all">("active");

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.replace("/admin/login");
    }
  }, [authLoading, authenticated, router]);

  useEffect(() => {
    if (!authenticated) return;

    async function fetchTickets() {
      try {
        const res = await fetch("/api/admin/tickets");
        if (!res.ok) throw new Error("Failed to load tickets");
        const data = await res.json();
        setTickets(data.tickets);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, [authenticated]);

  if (authLoading || !authenticated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  const filteredTickets =
    filter === "active"
      ? tickets.filter((t) => t.status === "open" || t.status === "in_progress")
      : tickets;

  return (
    <div className="flex flex-1 flex-col">
      <AdminHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {/* Title + filter toggle */}
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">All Requests</h1>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {(["active", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f === "active" ? "Active" : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-lg font-medium text-slate-900">
              Couldn&apos;t load tickets
            </p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="animate-fade-in py-16 text-center">
            <p className="text-5xl">📭</p>
            <p className="mt-4 text-lg font-medium text-slate-900">
              {filter === "active" ? "No active requests" : "No requests yet"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-fade-in">
            {filteredTickets.map((ticket) => {
              const status = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
              return (
                <Link
                  key={ticket.id}
                  href={`/admin/tickets/${ticket.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold leading-snug text-slate-900">
                      {ticket.title}
                    </h3>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <span>{ticket.memberAvatar}</span>
                    <span>{ticket.memberName}</span>
                    <span className="text-slate-300">&middot;</span>
                    <span>
                      {CATEGORY_ICONS[ticket.category] ?? "📋"} {ticket.room}
                    </span>
                    <span className="ml-auto text-xs text-slate-400">
                      {timeAgo(ticket.createdAt)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
