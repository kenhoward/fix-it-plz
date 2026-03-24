"use client";

import { useAdminAuth } from "@/lib/hooks/use-admin-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { AdminHeader } from "@/components/admin/admin-header";

// ── Types ────────────────────────────────────────────────────────────

interface Member {
  id: string;
  name: string;
  avatar: string;
  order: number;
  active: boolean;
  verificationCode: string;
}

// ── Page ─────────────────────────────────────────────────────────────

export default function AdminMembersPage() {
  const { authenticated, loading: authLoading } = useAdminAuth();
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addAvatar, setAddAvatar] = useState("");
  const [addCode, setAddCode] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editCode, setEditCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.replace("/admin/login");
    }
  }, [authLoading, authenticated, router]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/members");
      if (!res.ok) throw new Error("Failed to load members");
      const data = await res.json();
      setMembers(data.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    fetchMembers();
  }, [authenticated, fetchMembers]);

  // ── Add member ───────────────────────────────────────────────────

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim() || !addAvatar.trim() || !addCode.trim()) return;
    setAdding(true);
    setAddError(null);

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addName.trim(),
          avatar: addAvatar.trim(),
          verificationCode: addCode.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add member");
      }
      setAddName("");
      setAddAvatar("");
      setAddCode("");
      setShowAddForm(false);
      await fetchMembers();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  // ── Edit member ──────────────────────────────────────────────────

  function startEdit(m: Member) {
    setEditingId(m.id);
    setEditName(m.name);
    setEditAvatar(m.avatar);
    setEditCode(m.verificationCode);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editName.trim() || !editAvatar.trim() || !editCode.trim()) return;
    setSaving(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/admin/members/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          avatar: editAvatar.trim(),
          verificationCode: editCode.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update member");
      }
      setEditingId(null);
      await fetchMembers();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle active ────────────────────────────────────────────────

  async function handleToggleActive(m: Member) {
    setTogglingId(m.id);
    try {
      const res = await fetch(`/api/admin/members/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !m.active }),
      });
      if (!res.ok) throw new Error("Failed to update member");
      await fetchMembers();
    } catch {
      // Brief visual feedback is enough — re-fetch shows current state
      await fetchMembers();
    } finally {
      setTogglingId(null);
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

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col">
      <AdminHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 animate-fade-in">
        {/* Title + add button */}
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Family Members</h1>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingId(null);
              setAddError(null);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 active:scale-[0.98]"
          >
            <span>+</span> Add
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <form
            onSubmit={handleAdd}
            className="mb-5 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 animate-slide-down"
          >
            <h2 className="text-sm font-semibold text-slate-700">
              New Family Member
            </h2>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600">
                  Avatar
                </label>
                <input
                  type="text"
                  value={addAvatar}
                  onChange={(e) => setAddAvatar(e.target.value)}
                  placeholder="🦊"
                  maxLength={4}
                  className="mt-1 block w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-center text-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600">
                  Name
                </label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Name"
                  maxLength={30}
                  className="mt-1 block w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-600">
                Verification Code
              </label>
              <input
                type="text"
                value={addCode}
                onChange={(e) => setAddCode(e.target.value)}
                placeholder="e.g. 031505 (birthday mmddyy)"
                maxLength={20}
                className="mt-1 block w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {addError && (
              <p className="mt-3 text-sm text-red-600 animate-fade-in">{addError}</p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={adding || !addName.trim() || !addAvatar.trim() || !addCode.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 active:scale-[0.98]"
              >
                {adding ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                    Adding...
                  </span>
                ) : (
                  "Add Member"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setAddError(null);
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Members list */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
                  <div className="flex-1">
                    <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                    <div className="mt-1.5 h-3 w-32 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center animate-fade-in">
            <p className="text-4xl">😕</p>
            <p className="mt-3 text-lg font-medium text-slate-900">
              Couldn&apos;t load members
            </p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 active:scale-[0.98]"
            >
              Try Again
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center animate-fade-in">
            <p className="text-5xl">👨‍👩‍👧‍👦</p>
            <p className="mt-4 text-lg font-medium text-slate-900">
              No family members yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add your first family member above.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {members.map((m) =>
              editingId === m.id ? (
                /* ── Edit mode ── */
                <form
                  key={m.id}
                  onSubmit={handleSaveEdit}
                  className="rounded-2xl border-2 border-indigo-300 bg-white p-4 shadow-sm animate-fade-in"
                >
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600">
                        Avatar
                      </label>
                      <input
                        type="text"
                        value={editAvatar}
                        onChange={(e) => setEditAvatar(e.target.value)}
                        maxLength={4}
                        className="mt-1 block w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-center text-lg focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-600">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={30}
                        className="mt-1 block w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-600">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      maxLength={20}
                      className="mt-1 block w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {editError && (
                    <p className="mt-3 text-sm text-red-600 animate-fade-in">{editError}</p>
                  )}

                  <div className="mt-3 flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 active:scale-[0.98]"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* ── Display mode ── */
                <div
                  key={m.id}
                  className={`rounded-2xl border bg-white p-4 shadow-sm transition-opacity ${
                    m.active ? "border-slate-200" : "border-slate-100 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.avatar}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{m.name}</p>
                      <p className="text-xs text-slate-400">
                        Code: {m.verificationCode}
                        {!m.active && (
                          <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">
                            Inactive
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(m)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(m)}
                        disabled={togglingId === m.id}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                          m.active
                            ? "text-red-500 hover:bg-red-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {togglingId === m.id
                          ? "..."
                          : m.active
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </main>
    </div>
  );
}
