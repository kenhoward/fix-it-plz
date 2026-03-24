"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface Admin {
  id: string;
  email: string;
  displayName: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  loading: boolean;
  authenticated: boolean;
  setAdmin: (admin: Admin) => void;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  admin: null,
  loading: true,
  authenticated: false,
  setAdmin: () => {},
  logout: async () => {},
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdminState] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.admin) {
          setAdminState(data.admin);
        }
      }
    } catch {
      // Not authenticated
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const setAdmin = useCallback((a: Admin) => {
    setAdminState(a);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Best effort
    }
    setAdminState(null);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        authenticated: admin !== null,
        setAdmin,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
