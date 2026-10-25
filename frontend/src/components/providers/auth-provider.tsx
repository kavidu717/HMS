
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuthStore, type AuthUser } from "@/store/auth.store";

type AuthMeResponse = {
  success: boolean;
  data: AuthUser;
};

let authMeRequest: Promise<{ data: AuthMeResponse }> | null = null;

function getAuthMe() {
  if (!authMeRequest) {
    authMeRequest = api
      .get<AuthMeResponse>("/auth/me")
      .finally(() => {
        authMeRequest = null;
      });
  }

  return authMeRequest;
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);
  const isPublicRoute = pathname === "/login" || pathname === "/activate-account";

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const response = await getAuthMe();

        if (!active) return;

        if (response.data.success && response.data.data) {
          setUser(response.data.data);
        } else {
          clearUser();
        }
      } catch {
        if (active) {
          clearUser();
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, [setUser, clearUser]);

  useEffect(() => {
    if (isCheckingAuth) return;

    if (isAuthenticated && pathname === "/login") {
      router.replace("/dashboard");
      return;
    }

    if (!isAuthenticated && !isPublicRoute) {
      router.replace("/login");
    }
  }, [isAuthenticated, isCheckingAuth, isPublicRoute, pathname, router]);

  if (
    isCheckingAuth ||
    (!isAuthenticated && !isPublicRoute) ||
    (isAuthenticated && pathname === "/login")
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Checking your session...
      </div>
    );
  }

  return children;
}
