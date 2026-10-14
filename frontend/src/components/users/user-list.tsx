"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Activity,
  ArrowUpRight,
  AlertCircle,
  Clock3,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

type UserRecord = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const statusOptions = [
  { value: "ALL", label: "All accounts" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
];

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/15",
  INACTIVE: "bg-slate-100 text-slate-600 ring-slate-500/15",
  SUSPENDED: "bg-rose-50 text-rose-700 ring-rose-600/15",
};

const statusDots: Record<string, string> = {
  ACTIVE: "bg-emerald-500",
  PENDING: "bg-amber-500",
  INACTIVE: "bg-slate-400",
  SUSPENDED: "bg-rose-500",
};

const formatDate = (date: string | null) => {
  if (!date) return "Never signed in";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
};

const getInitials = (username: string) => {
  const parts = username.trim().split(/[._\s-]+/).filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }

  return username.slice(0, 2).toUpperCase() || "U";
};

const formatLabel = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const StatusBadge = ({ status }: { status: string }) => {
  const normalizedStatus = status.toUpperCase();

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        statusStyles[normalizedStatus] ||
        "bg-slate-100 text-slate-600 ring-slate-500/15"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          statusDots[normalizedStatus] || "bg-slate-400"
        }`}
      />
      {formatLabel(status)}
    </span>
  );
};

export default function UserList() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/users");

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to retrieve users.");
      }

      const fetchedUsers = response.data.data;

      if (!Array.isArray(fetchedUsers)) {
        throw new Error("Invalid users response received from the server.");
      }

      setUsers(fetchedUsers);
      return true;
    } catch (err) {
      let message = "Failed to load users.";

      if (axios.isAxiosError(err)) {
        message =
          err.response?.data?.message ||
          "Unable to load users. Please check your connection and permissions.";
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const counts = useMemo(() => {
    const initialCounts: Record<string, number> = {
      ALL: users.length,
      ACTIVE: 0,
      PENDING: 0,
      INACTIVE: 0,
      SUSPENDED: 0,
    };

    return users.reduce((result, user) => {
      const status = user.status.toUpperCase();
      if (status in result && status !== "ALL") result[status] += 1;
      return result;
    }, initialCounts);
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesFilter =
        activeFilter === "ALL" || user.status.toUpperCase() === activeFilter;
      const matchesSearch =
        !query ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.status.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [users, searchTerm, activeFilter]);

  const handleRefresh = async () => {
    const refreshed = await fetchUsers();

    if (refreshed) {
      toast.success("User list refreshed.");
    }
  };

  const activeUsers = counts.ACTIVE;
  const pendingUsers = counts.PENDING;

  return (
    <section className="mt-8 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.035]">
      <div className="flex flex-col gap-5 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm shadow-blue-900/15">
            <Users size={21} strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
              User directory
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage accounts, access and recent activity.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {!loading && !error && (
        <div className="grid grid-cols-3 gap-3 border-b border-slate-100 bg-slate-50/65 px-5 py-4 sm:gap-4 sm:px-7 sm:py-5">
          {[
            {
              label: "Total accounts",
              mobileLabel: "Total",
              value: users.length,
              icon: Users,
              iconStyle: "bg-blue-50 text-blue-700",
            },
            {
              label: "Active",
              mobileLabel: "Active",
              value: activeUsers,
              icon: Activity,
              iconStyle: "bg-emerald-50 text-emerald-700",
            },
            {
              label: "Pending activation",
              mobileLabel: "Pending",
              value: pendingUsers,
              icon: ShieldCheck,
              iconStyle: "bg-amber-50 text-amber-700",
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-900/[0.02] sm:flex sm:items-center sm:gap-3.5 sm:px-4 sm:py-3.5"
              >
                <span
                  className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:flex ${stat.iconStyle}`}
                >
                  <Icon size={18} />
                </span>
                <div>
                  <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
                    <span className="sm:hidden">{stat.mobileLabel}</span>
                    <span className="hidden sm:inline">{stat.label}</span>
                  </p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                    {stat.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-4 px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-md">
            <span className="sr-only">Search users</span>
            <Search
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, email or role..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            {searchTerm && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X size={15} />
              </button>
            )}
          </label>

          {!loading && !error && (
            <p className="text-sm text-slate-500 sm:text-right">
              <span className="font-semibold text-slate-800">
                {filteredUsers.length}
              </span>{" "}
              {filteredUsers.length === 1 ? "result" : "results"}
            </p>
          )}
        </div>

        {!loading && !error && users.length > 0 && (
          <div
            role="group"
            aria-label="Filter users by status"
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          >
            {statusOptions.map((option) => {
              const selected = activeFilter === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActiveFilter(option.value)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10 ${
                    selected
                      ? "border-blue-700 bg-blue-700 text-white shadow-sm shadow-blue-900/10"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                      selected
                        ? "bg-white/15 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {counts[option.value]}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-12">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Loader2 size={22} className="animate-spin" />
          </span>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">Loading directory</p>
            <p className="mt-1 text-xs text-slate-500">Getting the latest account details.</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertCircle size={22} />
          </span>
          <div>
            <h3 className="font-semibold text-slate-900">Unable to load users</h3>
            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => void fetchUsers()}
            className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/15"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && filteredUsers.length > 0 && (
        <>
          <div className="hidden overflow-x-auto border-t border-slate-100 md:block">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="bg-slate-50/75">
                  <th className="px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    User
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Access role
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Last sign in
                  </th>
                  <th className="px-7 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Added
                  </th>
                  <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-blue-50/35">
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold tracking-wide text-blue-800 ring-1 ring-inset ring-blue-100">
                          {getInitials(user.username)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {user.username}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <ShieldCheck size={15} className="text-slate-400" />
                        {formatLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={14} className="shrink-0 text-slate-400" />
                        {formatDate(user.lastLoginAt)}
                      </span>
                    </td>
                    <td className="px-7 py-4 text-sm text-slate-600">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/users/${user.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10"
                      >
                        View details
                        <ArrowUpRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-slate-100 border-t border-slate-100 md:hidden">
            {filteredUsers.map((user) => (
              <li key={user.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold tracking-wide text-blue-800 ring-1 ring-inset ring-blue-100">
                    {getInitials(user.username)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {user.username}
                      </p>
                      <StatusBadge status={user.status} />
                    </div>
                    <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-xs text-slate-500">
                      <Mail size={13} className="shrink-0" />
                      {user.email}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                        <ShieldCheck size={13} className="text-slate-400" />
                        {formatLabel(user.role)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={13} className="text-slate-400" />
                        {user.lastLoginAt
                          ? `Last sign in ${formatDate(user.lastLoginAt)}`
                          : "Never signed in"}
                      </span>
                    </div>
                    <Link
                      href={`/users/${user.id}`}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10"
                    >
                      View details
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {!loading && !error && filteredUsers.length === 0 && (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            {searchTerm || activeFilter !== "ALL" ? <Search size={21} /> : <UserRound size={21} />}
          </span>
          <h3 className="mt-4 font-semibold text-slate-900">
            {users.length === 0
              ? "Your directory is ready"
              : searchTerm.trim() || activeFilter !== "ALL"
                ? "No users match these filters"
                : "No users found"}
          </h3>
          <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
            {users.length === 0
              ? "New accounts will appear here once they’ve been created."
              : "Try a different search or choose another account status."}
          </p>
          {(searchTerm || activeFilter !== "ALL") && users.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setActiveFilter("ALL");
              }}
              className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <span>
            Showing <span className="font-semibold text-slate-700">{filteredUsers.length}</span> of {users.length} accounts
          </span>
          <span>Dates and times shown in your local timezone.</span>
        </div>
      )}
    </section>
  );
}
