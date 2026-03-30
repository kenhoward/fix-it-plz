"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAdminAuth } from "@/lib/hooks/use-admin-auth";

export default function AdminLoginPage() {
  const { authenticated, loading, setAdmin } = useAdminAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && authenticated) {
      router.replace("/admin");
    }
  }, [loading, authenticated, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setSubmitting(true);
    setError(null);

    try {
      // Sign in with Firebase client SDK to get an ID token
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await cred.user.getIdToken();

      // Exchange the ID token for a server session cookie
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setSubmitting(false);
        return;
      }

      setAdmin(data.admin);
      router.replace("/admin");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("wrong-password") || message.includes("user-not-found") || message.includes("invalid-credential")) {
        setError("Invalid email or password");
      } else if (message.includes("too-many-requests")) {
        setError("Too many attempts. Try again later.");
      } else {
        setError("Login failed. Please try again.");
      }
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (authenticated) return null;

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12 animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">🔧 Admin Login</h1>
          <p className="mt-2 text-sm text-slate-500">Fix It Plz dashboard</p>
          <Link href="/" className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-700">
            &larr; Back to family login
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              className="mt-1.5 block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="mt-1.5 block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm text-red-600 animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !email.trim() || !password}
            className="mt-2 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
