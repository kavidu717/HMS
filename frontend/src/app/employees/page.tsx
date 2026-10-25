
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  AlertCircle,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/store/auth.store";
import { hasPrivilege } from "@/lib/permissions";

type Employee = {
  id: string;
  userId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  phone: string;
  email: string;
  departmentId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const statusOptions = [
  { value: "ALL", label: "All employees" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  INACTIVE: "bg-slate-100 text-slate-600 ring-slate-500/15",
};

const statusDots: Record<string, string> = {
  ACTIVE: "bg-emerald-500",
  INACTIVE: "bg-slate-400",
};

const formatDate = (date: string) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(parsedDate);
};

const formatLabel = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const getInitials = (firstName: string, lastName: string) =>
  `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();

const StatusBadge = ({ status }: { status: string }) => {
  const normalizedStatus = status.toUpperCase();

  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        statusStyles[normalizedStatus] ??
        "bg-slate-100 text-slate-600 ring-slate-500/15"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 ${
          statusDots[normalizedStatus] ?? "bg-slate-400"
        }`}
      />
      {formatLabel(status)}
    </span>
  );
};

export default function EmployeeListPage() {
  const user = useAuthStore((state) => state.user);
  const canCreateEmployee = hasPrivilege(user, "employee:create");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/employees");

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to retrieve employees.",
        );
      }

      const fetchedEmployees = response.data.data;

      if (!Array.isArray(fetchedEmployees)) {
        throw new Error("Invalid employees response received from the server.");
      }

      setEmployees(fetchedEmployees);
      return true;
    } catch (err) {
      let message = "Failed to load employees.";

      if (axios.isAxiosError(err)) {
        message =
          err.response?.data?.message ||
          "Unable to load employees. Check your connection and permissions.";
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
    void fetchEmployees();
  }, [fetchEmployees]);

  const counts = useMemo(() => {
    const result: Record<string, number> = {
      ALL: employees.length,
      ACTIVE: 0,
      INACTIVE: 0,
    };

    employees.forEach((employee) => {
      const status = employee.status.toUpperCase();

      if (status in result && status !== "ALL") {
        result[status] += 1;
      }
    });

    return result;
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return employees.filter((employee) => {
      const status = employee.status.toUpperCase();

      const matchesFilter =
        activeFilter === "ALL" || status === activeFilter;

      const fullName =
        `${employee.firstName} ${employee.lastName}`.toLowerCase();

      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        employee.employeeNumber.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        employee.position.toLowerCase().includes(query) ||
        employee.phone.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [employees, searchTerm, activeFilter]);

  const handleRefresh = async () => {
    const refreshed = await fetchEmployees();

    if (refreshed) {
      toast.success("Employee list refreshed.");
    } else {
      toast.error("Failed to refresh employee list.");
    }
  };

  return (
    <DashboardLayout>
    <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.035]">
      <div className="flex flex-col gap-5 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-emerald-700 text-white shadow-sm shadow-emerald-900/15">
            <Users size={21} strokeWidth={1.9} />
          </span>

          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
              Employee directory
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage employee information and employment status.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          {canCreateEmployee && (
            <Link
              href="/employees/new"
              className="inline-flex h-10 items-center justify-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              <Users size={16} />
              Add employee
            </Link>
          )}
        </div>
      </div>

      {!loading && !error && (
        <div className="grid grid-cols-3 gap-3 border-b border-slate-100 bg-slate-50/65 px-5 py-4 sm:gap-4 sm:px-7 sm:py-5">
          {[
            {
              label: "Total employees",
              value: employees.length,
              icon: Users,
              iconStyle: "bg-emerald-50 text-emerald-700",
            },
            {
              label: "Active employees",
              value: counts.ACTIVE,
              icon: BriefcaseBusiness,
              iconStyle: "bg-emerald-50 text-emerald-700",
            },
            {
              label: "Inactive employees",
              value: counts.INACTIVE,
              icon: Building2,
              iconStyle: "bg-slate-100 text-slate-600",
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="min-w-0 border border-slate-200/80 bg-white p-3.5 shadow-sm shadow-slate-900/[0.02] sm:flex sm:items-center sm:gap-3.5 sm:px-4 sm:py-3.5"
              >
                <span
                  className={`hidden h-10 w-10 shrink-0 items-center justify-center sm:flex ${stat.iconStyle}`}
                >
                  <Icon size={18} />
                </span>

                <div>
                  <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
                    {stat.label}
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
            <span className="sr-only">Search employees</span>

            <Search
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, employee number, email..."
              className="h-11 w-full border border-slate-200 bg-slate-50/70 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />

            {searchTerm && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={15} />
              </button>
            )}
          </label>

          {!loading && !error && (
            <p className="text-sm text-slate-500 sm:text-right">
              <span className="font-semibold text-slate-800">
                {filteredEmployees.length}
              </span>{" "}
              {filteredEmployees.length === 1 ? "result" : "results"}
            </p>
          )}
        </div>

        {!loading && !error && employees.length > 0 && (
          <div
            role="group"
            aria-label="Filter employees by status"
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
                  className={`inline-flex shrink-0 items-center gap-2 border px-3 py-2 text-xs font-semibold transition ${
                    selected
                      ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                  <span
                    className={`px-1.5 py-0.5 text-[10px] leading-none ${
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
          <span className="flex h-12 w-12 items-center justify-center bg-emerald-50 text-emerald-700">
            <Loader2 size={22} className="animate-spin" />
          </span>

          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              Loading employees
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Getting the latest employee records.
            </p>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center bg-rose-50 text-rose-600">
            <AlertCircle size={22} />
          </span>

          <div>
            <h3 className="font-semibold text-slate-900">
              Unable to load employees
            </h3>
            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchEmployees()}
            className="bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && filteredEmployees.length > 0 && (
        <>
          <div className="hidden overflow-x-auto border-t border-slate-100 md:block">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="bg-slate-50/75">
                  {[
                    "Employee",
                    "Employee number",
                    "Position",
                    "Contact",
                    "Status",
                    "Added",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 first:pl-7 last:pr-7"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="transition-colors hover:bg-emerald-50/35"
                  >
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-50 text-xs font-bold tracking-wide text-emerald-800 ring-1 ring-inset ring-emerald-100">
                          {getInitials(employee.firstName, employee.lastName)}
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {employee.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-700">
                      {employee.employeeNumber}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {employee.position}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-sm text-slate-700">
                        {employee.phone}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail size={12} />
                        <span className="max-w-40 truncate">
                          {employee.email}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={employee.status} />
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(employee.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/employees/${employee.id}`}
                        className="inline-flex items-center gap-1.5 border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
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
            {filteredEmployees.map((employee) => (
              <li key={employee.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-emerald-50 text-xs font-bold tracking-wide text-emerald-800 ring-1 ring-inset ring-emerald-100">
                    {getInitials(employee.firstName, employee.lastName)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <StatusBadge status={employee.status} />
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {employee.employeeNumber}
                    </p>

                    <p className="mt-1 break-all text-xs text-slate-500">
                      {employee.email}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <BriefcaseBusiness size={13} />
                        {employee.position}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <UserRound size={13} />
                        {employee.phone}
                      </span>
                    </div>

                    <Link
                      href={`/employees/${employee.id}`}
                      className="mt-3 inline-flex items-center gap-1.5 border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
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

      {!loading && !error && filteredEmployees.length === 0 && (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center bg-slate-100 text-slate-500">
            {searchTerm || activeFilter !== "ALL" ? (
              <Search size={21} />
            ) : (
              <UserRound size={21} />
            )}
          </span>

          <h3 className="mt-4 font-semibold text-slate-900">
            {employees.length === 0
              ? "No employees registered"
              : "No employees match your filters"}
          </h3>

          <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
            {employees.length === 0
              ? "Registered employees will appear here."
              : "Try a different search or choose another status."}
          </p>

          {(searchTerm || activeFilter !== "ALL") && employees.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setActiveFilter("ALL");
              }}
              className="mt-4 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {!loading && !error && employees.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <span>
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredEmployees.length}
            </span>{" "}
            of {employees.length} employees
          </span>
          <span>Dates are displayed in your local timezone.</span>
        </div>
      )}
    </section>
    </DashboardLayout>
  );
}
