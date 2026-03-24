"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Header } from "@/components/header";
import { TicketForm } from "@/components/ticket-form";
import Link from "next/link";

export default function NewTicketPage() {
  const { authenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !authenticated) {
      router.replace("/");
    }
  }, [loading, authenticated, router]);

  if (loading || !authenticated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/tickets"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            &larr;
          </Link>
          <h1 className="text-xl font-bold text-slate-900">New Request</h1>
        </div>

        <TicketForm />
      </main>
    </div>
  );
}
