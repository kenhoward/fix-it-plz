"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { VerifyScreen } from "@/components/verify-screen";

export default function HomePage() {
  const { authenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && authenticated) {
      router.replace("/tickets");
    }
  }, [loading, authenticated, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (authenticated) {
    return null; // Redirecting
  }

  return <VerifyScreen onVerified={() => router.replace("/tickets")} />;
}
