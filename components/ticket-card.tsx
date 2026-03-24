import Link from "next/link";
import { StatusBadge } from "./status-badge";
import { CATEGORY_CONFIG, timeAgo } from "@/lib/utils";

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

export function TicketCard({ ticket }: TicketCardProps) {
  const cat = CATEGORY_CONFIG[ticket.category] ?? CATEGORY_CONFIG.other;

  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
    >
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
    </Link>
  );
}
