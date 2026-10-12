
"use client";

import { useAuthStore } from "@/store/auth.store";
import { ShieldCheck, Users, Activity } from "lucide-react";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading user information...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-medium text-blue-600">
            MediCore HMS
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Welcome back, {user.username}!
          </p>
        </header>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <Users className="mb-4 text-blue-600" size={28} />

            <p className="text-sm text-slate-500">Username</p>

            <p className="mt-1 text-lg font-semibold text-slate-900">
              {user.username}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <ShieldCheck className="mb-4 text-emerald-600" size={28} />

            <p className="text-sm text-slate-500">Role</p>

            <p className="mt-1 text-lg font-semibold text-slate-900">
              {user.role}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <Activity className="mb-4 text-violet-600" size={28} />

            <p className="text-sm text-slate-500">Privileges</p>

            <p className="mt-1 text-lg font-semibold text-slate-900">
              {user.privileges.length}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Account Information
          </h2>

          <div className="mt-4 space-y-3 text-sm">
            <p className="text-slate-600">
              <span className="font-medium text-slate-900">Email:</span>{" "}
              {user.email}
            </p>

            <p className="text-slate-600">
              <span className="font-medium text-slate-900">User ID:</span>{" "}
              {user.id}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
