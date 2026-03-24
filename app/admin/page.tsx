"use client";

import { useAdminAuth } from "@/lib/hooks/use-admin-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { CATEGORY_CONFIG, timeAgo } from "@/lib/utils";

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
              <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="h-5 w-3/5 animate-pulse rounded bg-slate-200" />
                  <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="h-4 w-6 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center animate-fade-in">
            <p className="text-4xl">😕</p>
            <p className="mt-3 text-lg font-medium text-slate-900">
              Couldn&apos;t load tickets
            </p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 active:scale-[0.98]"
            >
              Try Again
            </button>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="animate-fade-in py-16 text-center">
            <p className="text-5xl">📭</p>
            <p className="mt-4 text-lg font-medium text-slate-900">
              {filter === "active" ? "No active requests" : "No requests yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {filter === "active"
                ? "All requests are resolved. Switch to \"All\" to see history."
                : "Requests from family members will appear here."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-fade-in">
            {filteredTickets.map((ticket) => {
              const cat = CATEGORY_CONFIG[ticket.category] ?? CATEGORY_CONFIG.other;
              return (
                <Link
                  key={ticket.id}
                  href={`/admin/tickets/${ticket.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold leading-snug text-slate-900">
                      {ticket.title}
                    </h3>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <span>{ticket.memberAvatar}</span>
                    <span>{ticket.memberName}</span>
                    <span className="text-slate-300">&middot;</span>
                    <span>
                      {cat.icon} {ticket.room}
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
