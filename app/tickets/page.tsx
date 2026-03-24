"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { TicketCard } from "@/components/ticket-card";
import Link from "next/link";

interface Ticket {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  room: string;
  createdAt: string;
}

export default function TicketsPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.replace("/");
    }
  }, [authLoading, authenticated, router]);

  // Fetch tickets
  useEffect(() => {
    if (!authenticated) return;

    async function fetchTickets() {
      try {
        const res = await fetch("/api/tickets");
        if (!res.ok) throw new Error("Failed to load requests");
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

  // Check for success banner from ticket creation
  useEffect(() => {
    try {
      if (sessionStorage.getItem("ticket-created") === "1") {
        sessionStorage.removeItem("ticket-created");
        setShowSuccess(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Auto-dismiss success banner
  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  if (authLoading || !authenticated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header />

      {/* Success toast — overlays content */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-center text-sm font-medium text-emerald-700 shadow-lg animate-fade-in">
          Request submitted!
        </div>
      )}

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {/* Title + new request button */}
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">My Requests</h1>
          <Link
            href="/tickets/new"
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 active:scale-[0.98]"
          >
            <span>+</span> New
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-lg font-medium text-slate-900">
              Couldn&apos;t load requests
            </p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="animate-fade-in py-16 text-center">
            <p className="text-5xl">🏠</p>
            <p className="mt-4 text-lg font-medium text-slate-900">
              All good around here!
            </p>
            <p className="mt-1 text-sm text-slate-500">
              No requests yet. Tap the button above to submit one.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-fade-in">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
