import { StatusBadge } from "./status-badge";

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  fix: { label: "Fix", icon: "🔧" },
  install: { label: "Install", icon: "🔨" },
  replace: { label: "Replace", icon: "🔄" },
  other: { label: "Other", icon: "📋" },
};

interface TicketCardProps {
  ticket: {
    id: string;
    title: string;
    description?: string;
    category: string;
    status: string;
    room: string;
    createdAt: string;
  };
}

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

export function TicketCard({ ticket }: TicketCardProps) {
  const cat = CATEGORY_LABELS[ticket.category] ?? CATEGORY_LABELS.other;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 leading-snug">
          {ticket.title}
        </h3>
        <StatusBadge status={ticket.status} />
      </div>

      {ticket.description && (
        <p className="mt-1.5 text-sm text-slate-500 line-clamp-2">
          {ticket.description}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
        <span>
          {cat.icon} &nbsp; {cat.label}
        </span>
        <span className="flex items-center gap-1">
          📍 {ticket.room}
        </span>
        <span className="ml-auto">{timeAgo(ticket.createdAt)}</span>
      </div>
    </div>
  );
}
