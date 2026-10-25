"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/store/auth.store";

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Employee {
  id: string;
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  position?: string;
}

interface LeaveRecord {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  status: LeaveStatus;
  approvedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  employee?: Employee;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const statusConfig: Record<
  LeaveStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 ring-amber-600/15",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 ring-rose-600/15",
    icon: XCircle,
  },
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getEmployeeName = (record: LeaveRecord) =>
  record.employee
    ? `${record.employee.firstName} ${record.employee.lastName}`
    : `Employee #${record.employeeId}`;

const formatLeaveType = (leaveType: string) =>
  leaveType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

export default function LeaveRecordsPage() {
  const canCreateLeaveRecord = useAuthStore((state) =>
    state.user?.privileges.includes("employee_leave_record:create") ?? false,
  );

  const [records, setRecords] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "ALL">("ALL");

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<ApiResponse<LeaveRecord[]>>(
        "/employee-leave-records",
      );

      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error(
          response.data.message || "Failed to load leave records.",
        );
      }

      setRecords(response.data.data);
    } catch (loadError) {
      const message = axios.isAxiosError(loadError)
        ? loadError.response?.data?.message || "Failed to load leave records."
        : loadError instanceof Error
          ? loadError.message
          : "Something went wrong while loading leave records.";

      setError(message);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  const searchText = search.trim().toLowerCase();
  const filteredRecords = records.filter((record) => {
    const matchesSearch = [
      getEmployeeName(record),
      record.leaveType,
      record.employeeId,
      record.employee?.employeeNumber ?? "",
    ].some((value) => value.toLowerCase().includes(searchText));

    const matchesStatus =
      statusFilter === "ALL" || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const summaryCards = [
    {
      label: "Total requests",
      value: records.length,
      helper: "All leave requests",
      icon: CalendarDays,
      style: "bg-slate-100 text-slate-600",
    },
    {
      label: "Pending",
      value: records.filter((record) => record.status === "PENDING").length,
      helper: "Awaiting review",
      icon: Clock,
      style: "bg-amber-50 text-amber-700",
    },
    {
      label: "Approved",
      value: records.filter((record) => record.status === "APPROVED").length,
      helper: "Approved requests",
      icon: CheckCircle2,
      style: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Rejected",
      value: records.filter((record) => record.status === "REJECTED").length,
      helper: "Declined requests",
      icon: XCircle,
      style: "bg-rose-50 text-rose-700",
    },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <Users size={14} />
              Workforce <span className="text-slate-300">/</span> Leave management
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Leave records
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Review employee leave requests and track their approval status.
            </p>
          </div>

          {canCreateLeaveRecord && (
            <Link
              href="/leave-records/new"
              className="inline-flex h-10 w-fit items-center justify-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              <Plus size={16} />
              New leave request
            </Link>
          )}
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((summary) => {
            const Icon = summary.icon;

            return (
              <article
                key={summary.label}
                className="border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.025] sm:p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    {summary.label}
                  </p>
                  <span
                    className={`flex h-10 w-10 items-center justify-center ${summary.style}`}
                  >
                    <Icon size={19} />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {summary.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{summary.helper}</p>
              </article>
            );
          })}
        </section>

        <section className="overflow-hidden border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.025]">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-semibold text-slate-950">All leave requests</h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredRecords.length} request
                {filteredRecords.length === 1 ? "" : "s"} found
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void fetchRecords();
                toast.info("Refreshing leave records...");
              }}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh records
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 border-b border-slate-100 p-4 sm:p-5 md:grid-cols-2">
            <label className="relative block">
              <span className="sr-only">Search leave records</span>
              <Search
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee, number, or leave type..."
                className="h-11 w-full border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as LeaveStatus | "ALL")
              }
              aria-label="Filter leave requests by status"
              className="h-11 w-full border border-slate-200 bg-slate-50/70 px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw size={25} className="animate-spin text-emerald-700" />
              <p className="text-sm">Loading leave records...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center bg-rose-50 text-rose-600">
                <AlertCircle size={22} />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">
                Leave records could not be loaded
              </h3>
              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                {error}
              </p>
              <button
                type="button"
                onClick={() => void fetchRecords()}
                className="mt-4 inline-flex items-center gap-2 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center bg-slate-100 text-slate-500">
                <CalendarDays size={24} />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">
                No leave requests found
              </h3>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                {search || statusFilter !== "ALL"
                  ? "Try changing your search or status filter."
                  : "Leave requests will appear here once they are submitted."}
              </p>
              {!search && statusFilter === "ALL" && canCreateLeaveRecord && (
                <Link
                  href="/leave-records/new"
                  className="mt-5 inline-flex items-center gap-2 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  <Plus size={16} />
                  New leave request
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50/80 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5 pl-6 font-semibold">Employee</th>
                      <th className="px-5 py-3.5 font-semibold">Leave type</th>
                      <th className="px-5 py-3.5 font-semibold">Start date</th>
                      <th className="px-5 py-3.5 font-semibold">End date</th>
                      <th className="px-5 py-3.5 font-semibold">Status</th>
                      <th className="px-5 py-3.5 pr-6 text-right font-semibold">
                        Record
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((record) => {
                      const status =
                        statusConfig[record.status] ?? statusConfig.PENDING;
                      const StatusIcon = status.icon;

                      return (
                        <tr
                          key={record.id}
                          className="transition-colors hover:bg-emerald-50/35"
                        >
                          <td className="px-5 py-4 pl-6">
                            <p className="font-semibold text-slate-900">
                              {getEmployeeName(record)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {record.employee?.employeeNumber ||
                                `ID: ${record.employeeId}`}
                            </p>
                          </td>
                          <td className="px-5 py-4 font-medium text-slate-700">
                            {formatLeaveType(record.leaveType)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            {formatDate(record.startDate)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            {formatDate(record.endDate)}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.className}`}
                            >
                              <StatusIcon size={14} />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 pr-6 text-right">
                            <Link
                              href={`/leave-records/${record.id}`}
                              aria-label={`View leave request for ${getEmployeeName(record)}`}
                              className="inline-flex items-center gap-1.5 border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                            >
                              View
                              <ArrowUpRight size={14} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {filteredRecords.map((record) => {
                  const status =
                    statusConfig[record.status] ?? statusConfig.PENDING;
                  const StatusIcon = status.icon;

                  return (
                    <article key={record.id} className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {getEmployeeName(record)}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {record.employee?.employeeNumber ||
                              `Employee ID: ${record.employeeId}`}
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.className}`}
                        >
                          <StatusIcon size={13} />
                          {status.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Leave type</p>
                          <p className="mt-1 font-medium text-slate-800">
                            {formatLeaveType(record.leaveType)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Start date</p>
                          <p className="mt-1 text-slate-800">
                            {formatDate(record.startDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">End date</p>
                          <p className="mt-1 text-slate-800">
                            {formatDate(record.endDate)}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/leave-records/${record.id}`}
                        className="inline-flex items-center gap-1.5 border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                      >
                        <Eye size={14} />
                        View request
                      </Link>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
