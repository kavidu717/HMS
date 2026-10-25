"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  FilterX,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/store/auth.store";

interface Attendance {
  id: string | number;
  employeeId: string | number;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: "PRESENT" | "ABSENT" | "LATE";
  employee?: {
    id: string | number;
    employeeNumber?: string;
    firstName?: string;
    lastName?: string;
  } | null;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

type StatusFilter = "ALL" | "PRESENT" | "ABSENT" | "LATE";

const statusStyles: Record<Attendance["status"], string> = {
  PRESENT: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  ABSENT: "bg-rose-50 text-rose-700 ring-rose-600/15",
  LATE: "bg-amber-50 text-amber-700 ring-amber-600/15",
};

export default function AttendancePage() {
  const canUpdateAttendance = useAuthStore((state) =>
    state.user?.privileges.includes("attendance:update") ?? false,
  );
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");
  const [dateFilter, setDateFilter] = useState("");

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response =
        await api.get<ApiResponse<Attendance[]>>("/attendance");

      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error(
          response.data.message || "Invalid attendance response received.",
        );
      }

      const data = response.data.data;

      setRecords(data);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);

      setLoadError(
        axios.isAxiosError(error)
          ? error.response?.data?.message ||
              "Unable to load attendance records."
          : error instanceof Error
            ? error.message
            : "Something went wrong while loading attendance.",
      );

      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAttendance();
  }, [fetchAttendance]);

  const filteredRecords = records.filter((record) => {
    const employeeName = record.employee
      ? `${record.employee.firstName ?? ""} ${
          record.employee.lastName ?? ""
        }`.trim()
      : "";

    const searchValue = search.trim().toLowerCase();

    const matchesSearch = [
      String(record.employeeId),
      String(record.id),
      record.employee?.employeeNumber ?? "",
      employeeName,
      record.status,
    ].some((value) => value.toLowerCase().includes(searchValue));

    const matchesStatus =
      statusFilter === "ALL" || record.status === statusFilter;

    const recordDate = record.date ? record.date.slice(0, 10) : "";

    const matchesDate =
      !dateFilter || recordDate === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const presentCount = records.filter(
    (record) => record.status === "PRESENT",
  ).length;

  const absentCount = records.filter(
    (record) => record.status === "ABSENT",
  ).length;

  const lateCount = records.filter(
    (record) => record.status === "LATE",
  ).length;

  const formatDate = (value: string) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (value?: string | null) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleTimeString("en-LK", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getEmployeeName = (record: Attendance) => {
    if (!record.employee) {
      return `Employee #${record.employeeId}`;
    }

    const name =
      `${record.employee.firstName ?? ""} ${
        record.employee.lastName ?? ""
      }`.trim();

    return name || `Employee #${record.employeeId}`;
  };

  const summaryCards = [
    {
      label: "Total records",
      value: records.length,
      helper: "Attendance entries",
      icon: CalendarDays,
      iconStyle: "bg-slate-100 text-slate-600",
    },
    {
      label: "Present",
      value: presentCount,
      helper: "Marked present",
      icon: CheckCircle2,
      iconStyle: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Absent",
      value: absentCount,
      helper: "Marked absent",
      icon: XCircle,
      iconStyle: "bg-rose-50 text-rose-700",
    },
    {
      label: "Late",
      value: lateCount,
      helper: "Arrived after schedule",
      icon: Clock,
      iconStyle: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <Activity size={14} />
              Workforce <span className="text-slate-300">/</span> Attendance
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Attendance overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Review employee attendance, track daily status, and find records by date.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void fetchAttendance()}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh records
            </button>

            <Link
              href="/attendance/new"
              className="inline-flex h-10 items-center justify-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              <Plus size={17} />
              Mark attendance
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((summary) => {
            const Icon = summary.icon;

            return (
              <div
                key={summary.label}
                className="border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.025] sm:p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    {summary.label}
                  </p>
                  <span className={`flex h-10 w-10 items-center justify-center ${summary.iconStyle}`}>
                    <Icon size={19} />
                  </span>
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {summary.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{summary.helper}</p>
              </div>
            );
          })}
        </div>

        <section className="border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.025] sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Search size={16} className="text-emerald-700" />
            Find attendance records
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(160px,0.8fr)_minmax(220px,1fr)]">
            <div className="relative">
              <Search
                size={18}
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee or record..."
                aria-label="Search attendance records"
                className="h-11 w-full border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              aria-label="Filter by attendance status"
              className="h-11 w-full border border-slate-200 bg-slate-50/70 px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late</option>
            </select>

            <div className="flex gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                aria-label="Filter by attendance date"
                className="h-11 min-w-0 flex-1 border border-slate-200 bg-slate-50/70 px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setDateFilter("");
                }}
                className="inline-flex h-11 shrink-0 items-center gap-1.5 border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <FilterX size={15} />
                Clear
              </button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.025]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-semibold text-slate-950">
                Attendance records
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredRecords.length} record
                {filteredRecords.length === 1 ? "" : "s"} found
              </p>
            </div>

            <span className="flex h-10 w-10 items-center justify-center bg-emerald-50 text-emerald-700">
              <Users size={19} />
            </span>
          </div>

          {loadError ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center bg-rose-50 text-rose-600">
                <ShieldAlert size={22} />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">
                Attendance records could not be loaded
              </h3>
              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => void fetchAttendance()}
                className="mt-4 inline-flex items-center gap-2 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <LoaderCircle
                size={32}
                className="animate-spin text-emerald-700"
              />
              <p className="mt-3 text-sm text-slate-500">
                Loading attendance records...
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center bg-slate-100 text-slate-500">
                <CalendarDays size={24} />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">
                No attendance records found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your filters or mark a new attendance record.
              </p>
              <Link
                href="/attendance/new"
                className="mt-5 inline-flex items-center gap-2 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                <Plus size={16} />
                Mark attendance
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-slate-50/80 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold first:pl-6">
                        Employee
                      </th>
                      <th className="px-5 py-3.5 font-semibold">
                        Date
                      </th>
                      <th className="px-5 py-3.5 font-semibold">
                        Check In
                      </th>
                      <th className="px-5 py-3.5 font-semibold">
                        Check Out
                      </th>
                      <th className="px-5 py-3.5 font-semibold">
                        Status
                      </th>
                      <th className="px-5 py-3.5 pr-6 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((record) => (
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

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatDate(record.date)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatTime(record.checkIn)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatTime(record.checkOut)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                              statusStyles[record.status] ??
                              "bg-slate-100 text-slate-700 ring-slate-500/15"
                            }`}
                          >
                            <span className="h-1.5 w-1.5 bg-current opacity-60" />
                            {record.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-5 py-4 pr-6 text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/attendance/${record.id}`}
                              aria-label={`View attendance details for ${getEmployeeName(record)}`}
                              className="inline-flex items-center gap-1.5 border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                            >
                              View
                              <ArrowUpRight size={14} />
                            </Link>
                            {canUpdateAttendance && (
                              <Link
                                href={`/attendance/${record.id}/edit`}
                                aria-label={`Edit attendance for ${getEmployeeName(record)}`}
                                className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                              >
                                Edit
                                <Pencil size={13} />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {getEmployeeName(record)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {record.employee?.employeeNumber ||
                            `Employee ID: ${record.employeeId}`}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          statusStyles[record.status] ??
                          "bg-slate-100 text-slate-700 ring-slate-500/15"
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Date</p>
                        <p className="mt-1 text-slate-800">
                          {formatDate(record.date)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Check in</p>
                        <p className="mt-1 text-slate-800">
                          {formatTime(record.checkIn)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Check out</p>
                        <p className="mt-1 text-slate-800">
                          {formatTime(record.checkOut)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Record ID</p>
                        <p className="mt-1 text-slate-800">
                          {record.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/attendance/${record.id}`}
                        className="inline-flex items-center gap-1.5 border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                      >
                        View details
                        <ArrowUpRight size={14} />
                      </Link>
                      {canUpdateAttendance && (
                        <Link
                          href={`/attendance/${record.id}/edit`}
                          className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Edit
                          <Pencil size={13} />
                        </Link>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
