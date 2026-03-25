"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/use-auth";

interface MemberOption {
  id: string;
  name: string;
  avatar: string;
}

const LAST_MEMBER_KEY = "fix-it-plz-last-member";

export function VerifyScreen({ onVerified }: { onVerified: () => void }) {
  const { setMember } = useAuth();
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);

  // Measure the fixed bottom panel so we can add matching padding to the grid.
  // Uses a ref callback + ResizeObserver to stay in sync if the panel resizes
  // (e.g. error message appears).
  const panelRef = useCallback((node: HTMLFormElement | null) => {
    if (!node) {
      setPanelHeight(0);
      return;
    }
    setPanelHeight(node.getBoundingClientRect().height);
    const observer = new ResizeObserver(() => {
      setPanelHeight(node.getBoundingClientRect().height);
    });
    observer.observe(node);
  }, []);

  // Reset scroll to top on mount so a remembered member doesn't cause
  // the page to load partway down the list.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch("/api/members");
        if (!res.ok) throw new Error("Failed to load family members");
        const data = await res.json();
        setMembers(data.members);

        // Pre-select last verified member for convenience
        try {
          const lastId = localStorage.getItem(LAST_MEMBER_KEY);
          if (lastId && data.members.some((m: MemberOption) => m.id === lastId)) {
            setSelectedId(lastId);
          }
        } catch {
          // localStorage might be unavailable
        }
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoadingMembers(false);
      }
    }
    fetchMembers();
  }, []);

  const selectedMember = members.find((m) => m.id === selectedId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !code.trim()) return;

    setVerifying(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: selectedId, code: code.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        setVerifying(false);
        return;
      }

      // Remember this member for next visit
      try {
        localStorage.setItem(LAST_MEMBER_KEY, selectedId);
      } catch {
        // Ignore storage errors
      }

      setMember(data.member);
      onVerified();
    } catch {
      setError("Something went wrong. Please try again.");
      setVerifying(false);
    }
  }

  function handleSelectMember(id: string) {
    setSelectedId(id);
    setCode("");
    setError(null);
  }

  // ── Loading state ──────────────────────────────────────────────────
  if (loadingMembers) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Fetch error ────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-medium text-slate-900">Oops!</p>
          <p className="mt-1 text-sm text-slate-500">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── No members configured ─────────────────────────────────────────
  if (members.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <p className="text-4xl">👨‍👩‍👧‍👦</p>
          <p className="mt-3 text-lg font-medium text-slate-900">
            No family members yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Ask the admin to add family members first.
          </p>
        </div>
      </div>
    );
  }

  // ── Main verification flow ─────────────────────────────────────────
  return (
    <div className="flex flex-1 flex-col items-center justify-start md:justify-center px-6 py-12 animate-fade-in">
      {/* App title */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          🔧 Fix It Plz
        </h1>
        <p className="mt-2 text-slate-500">Who&apos;s reporting?</p>
      </div>

      {/* Member grid — dynamic bottom padding on mobile matches panel height */}
      <div
        className="grid w-full max-w-sm grid-cols-2 gap-3 md:!pb-0"
        style={selectedMember && panelHeight > 0 ? { paddingBottom: `${panelHeight + 16}px` } : undefined}
      >
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => handleSelectMember(m.id)}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all active:scale-95 last:odd:col-span-2 last:odd:mx-auto last:odd:w-1/2 ${
              selectedId === m.id
                ? "border-indigo-500 bg-indigo-50 shadow-md"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            <span className="text-4xl">{m.avatar}</span>
            <span
              className={`text-sm font-medium ${
                selectedId === m.id ? "text-indigo-700" : "text-slate-700"
              }`}
            >
              {m.name}
            </span>
          </button>
        ))}
      </div>

      {/* Code input — fixed bottom panel on mobile, inline on desktop */}
      {selectedMember && (
        <form
          ref={panelRef}
          onSubmit={handleSubmit}
          className="
            fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-sm
            px-6 pt-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]
            [padding-bottom:calc(1.5rem+env(safe-area-inset-bottom))]
            animate-slide-up
            md:static md:inset-auto md:z-auto md:border-t-0 md:bg-transparent md:backdrop-blur-none
            md:mt-6 md:w-full md:max-w-sm md:px-0 md:pt-0 md:pb-0 md:shadow-none md:animate-slide-down
          "
        >
          <label
            htmlFor="code"
            className="block text-sm font-medium text-slate-600"
          >
            Enter your code, {selectedMember.name}
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            placeholder="••••••"
            autoComplete="off"
            className="mt-2 block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-center text-lg tracking-widest placeholder:text-slate-300 focus:border-indigo-500 focus:outline-none"
          />

          {error && (
            <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm text-red-600 animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={verifying || code.trim().length === 0}
            className="mt-3 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
          >
            {verifying ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Verifying...
              </span>
            ) : (
              "Let's go!"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
