// ── Shared UI utilities ────────────────────────────────────────────────

export function timeAgo(dateString: string): string {
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

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

// ── Category config ──────────────────────────────────────────────────

export const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  fix: { label: "Fix", icon: "🔧" },
  install: { label: "Install", icon: "🔨" },
  replace: { label: "Replace", icon: "🔄" },
  other: { label: "Other", icon: "📋" },
};

// ── Status config ────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-emerald-100 text-emerald-700" },
  in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-700" },
  done: { label: "Done", className: "bg-blue-100 text-blue-700" },
  cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-500" },
};
