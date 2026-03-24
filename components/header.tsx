"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";

export function Header() {
  const { member, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (!member) return null;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{member.avatar}</span>
          <span className="text-sm font-medium text-slate-700">
            {member.name}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Switch
        </button>
      </div>
    </header>
  );
}
