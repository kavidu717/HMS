
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const response = await api.get("/auth/me");

        if (!active) return;

        if (response.data.success) {
          setUser(response.data.data);
        } else {
          clearUser();
        }
      } catch {
        if (active) {
          clearUser();
        }
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, [setUser, clearUser]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Checking your session...
      </div>
    );
  }

  return children;
}
