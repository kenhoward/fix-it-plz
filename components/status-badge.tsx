const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open: {
    label: "Open",
    className: "bg-emerald-100 text-emerald-700",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-100 text-amber-700",
  },
  done: {
    label: "Done",
    className: "bg-blue-100 text-blue-700",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-500",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-500",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
