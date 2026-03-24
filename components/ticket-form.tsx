"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "fix", label: "Fix", icon: "🔧" },
  { value: "install", label: "Install", icon: "🔨" },
  { value: "replace", label: "Replace", icon: "🔄" },
  { value: "other", label: "Other", icon: "📋" },
] as const;

export function TicketForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [room, setRoom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isValid = title.trim() && category && room.trim();

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Mark all fields as touched on submit attempt
    setTouched({ title: true, category: true, room: true });
    if (!isValid) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          room: room.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create request");
        setSubmitting(false);
        return;
      }

      // Signal success to the tickets list page
      try {
        sessionStorage.setItem("ticket-created", "1");
      } catch {
        // Ignore storage errors
      }

      router.push("/tickets");
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 animate-fade-in">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-slate-700"
        >
          What needs fixing?
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => handleBlur("title")}
          placeholder="e.g. Kitchen light is flickering"
          maxLength={100}
          className={`mt-1.5 block w-full rounded-xl border-2 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none transition-colors ${
            touched.title && !title.trim()
              ? "border-red-300"
              : "border-slate-200"
          }`}
        />
        {touched.title && !title.trim() && (
          <p className="mt-1 text-xs text-red-500">Please enter a title</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-slate-700"
        >
          Details <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add any extra info..."
          rows={3}
          maxLength={500}
          className="mt-1.5 block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none resize-none transition-colors"
        />
        {description.length > 400 && (
          <p className="mt-1 text-xs text-slate-400 text-right">
            {description.length}/500
          </p>
        )}
      </div>

      {/* Category */}
      <div>
        <span className="block text-sm font-medium text-slate-700">
          Category
        </span>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                setCategory(cat.value);
                setTouched((prev) => ({ ...prev, category: true }));
              }}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-sm transition-all active:scale-95 ${
                category === cat.value
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : touched.category && !category
                    ? "border-red-200 bg-white text-slate-600 hover:border-slate-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="text-xs font-medium">{cat.label}</span>
            </button>
          ))}
        </div>
        {touched.category && !category && (
          <p className="mt-1 text-xs text-red-500">Please select a category</p>
        )}
      </div>

      {/* Room */}
      <div>
        <label
          htmlFor="room"
          className="block text-sm font-medium text-slate-700"
        >
          Room
        </label>
        <input
          id="room"
          type="text"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          onBlur={() => handleBlur("room")}
          placeholder="e.g. Kitchen, Bathroom, Garage"
          maxLength={50}
          className={`mt-1.5 block w-full rounded-xl border-2 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none transition-colors ${
            touched.room && !room.trim()
              ? "border-red-300"
              : "border-slate-200"
          }`}
        />
        {touched.room && !room.trim() && (
          <p className="mt-1 text-xs text-red-500">Please enter a room</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || submitting}
        className="mt-2 w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Submitting...
          </span>
        ) : (
          "Submit Request"
        )}
      </button>
    </form>
  );
}
