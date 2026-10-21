"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  Menu,
  Pill,
  Stethoscope,
  Users,
  UserCog,
  FileHeart,
  Building2,
  X,
  LogOut,
} from "lucide-react";

import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    privilege: null,
  },
  {
    label: "Patients",
    href: "/patients",
    icon: Users,
    privilege: "patient:read",
  },
  {
    label: "Doctors",
    href: "/doctors",
    icon: Stethoscope,
    privilege: "doctor:read",
  },
  {
    label: "Appointments",
    href: "/appointments",
    icon: CalendarDays,
    privilege: "appointment:read",
  },
  {
    label: "Medical Records",
    href: "/medical-records",
    icon: FileHeart,
    privilege: "medical_record:read",
  },
  {
    label: "Laboratory",
    href: "/laboratory",
    icon: FlaskConical,
    privilege: "laboratory:read",
  },
  {
    label: "Pharmacy",
    href: "/pharmacy",
    icon: Pill,
    privilege: "pharmacy:read",
  },
  {
    label: "Billing",
    href: "/billing",
    icon: CreditCard,
    privilege: "billing:read",
  },
  {
    label: "Staff",
    href: "/staff",
    icon: UserCog,
    privilege: "staff:read",
  },
  {
    label: "User Management",
    href: "/users",
    icon: ClipboardList,
    privilege: "user:read",
  },
  {
    label: "Departments",
    href: "/departments",
    icon: Building2,
    privilege: "department:read",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const privileges = user?.privileges ?? [];

  const visibleNavigation = navigation.filter((item) => {
    if (item.privilege === null) {
      return true;
    }

    return privileges.includes(item.privilege);
  });

  // Logout handler
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      useAuthStore.getState().clearUser();

      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[1px] md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        id="workspace-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-72 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white transition-transform duration-200 md:z-20 md:w-64 md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center  bg-emerald-700 text-white">
            <HeartPulse size={23} />
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900">
              MediCore
            </h1>

            <p className="text-xs text-slate-500">
              Hospital Management
            </p>
          </div>

          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
            className="ml-auto flex h-9 w-9 items-center justify-center  text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 md:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* Navigation */}
        <div className="px-4 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          <nav className="space-y-1">
            {visibleNavigation.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3  px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={19} />

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

       {/* Logged-in User / Profile Link */}
<div className="mt-auto border-t border-slate-100 p-4">
  <Link
    href="/profile"
    onClick={() => setMobileMenuOpen(false)}
    className="flex items-center gap-3  bg-slate-50 p-3 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
  >
    <div className="flex h-10 w-10 shrink-0 items-center justify-center  bg-emerald-100 font-semibold text-emerald-700">
      {user?.username?.charAt(0).toUpperCase() ?? "U"}
    </div>

    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-slate-800">
        {user?.username ?? "User"}
      </p>

      <p className="truncate text-xs text-slate-500">
        {user?.role ?? "Account"}
      </p>
    </div>

    <span className="text-xs font-medium text-emerald-700">
      Profile
    </span>
  </Link>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-3  px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <LogOut size={19} />

            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="min-w-0 flex-1 md:ml-64 md:h-screen md:overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-controls="workspace-sidebar"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center  bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/15 md:hidden"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                MediCore HMS
              </p>

              <p className="text-xs text-slate-500">
                Hospital Management System
              </p>
            </div>
          </div>

          {/* User Information */}
          <div className="flex items-center gap-2  border border-slate-200 px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center  bg-emerald-100 text-sm font-semibold text-emerald-700">
              {user?.username?.charAt(0).toUpperCase() ?? "U"}
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-800">
                {user?.username ?? "User"}
              </p>

              <p className="text-xs text-slate-500">
                {user?.role ?? "Account"}
              </p>
            </div>

            <ChevronDown size={16} className="text-slate-400" />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}