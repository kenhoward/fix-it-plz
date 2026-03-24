"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface Member {
  id: string;
  name: string;
  avatar: string;
}

interface AuthContextType {
  member: Member | null;
  loading: boolean;
  authenticated: boolean;
  setMember: (member: Member) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  member: null,
  loading: true,
  authenticated: false,
  setMember: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [member, setMemberState] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.member) {
          setMemberState(data.member);
        }
      }
    } catch {
      // Not authenticated or network error — stay logged out
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const setMember = useCallback((m: Member) => {
    setMemberState(m);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Best-effort — clear local state regardless
    }
    setMemberState(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        member,
        loading,
        authenticated: member !== null,
        setMember,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
