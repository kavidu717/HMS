"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Hash,
  LoaderCircle,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  UserRound,
} from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/store/auth.store";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  email: string;
  phone: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: AttendanceStatus;
  employee?: Employee | null;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const statusStyles: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  ABSENT: "bg-rose-50 text-rose-700 ring-rose-600/15",
  LATE: "bg-amber-50 text-amber-700 ring-amber-600/15",
};

const formatDate = (value?: string | null) => {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not recorded";

  return date.toLocaleDateString("en-LK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (value?: string | null) => {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not recorded";

  return date.toLocaleTimeString("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const DetailItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) => (
  <div className="flex min-w-0 gap-3 border border-slate-200/80 bg-white p-4">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700">
      {icon}
    </span>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value || "Not available"}
      </p>
    </div>
  </div>
);

export default function AttendanceDetailsPage() {
  const params = useParams<{ id: string }>();
  const attendanceId = params.id;
  const canUpdateAttendance = useAuthStore((state) =>
    state.user?.privileges.includes("attendance:update") ?? false,
  );

  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAttendance = useCallback(async () => {
    if (!attendanceId) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.get<ApiResponse<AttendanceRecord>>(
        `/attendance/${attendanceId}`,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(
          response.data.message || "Failed to load attendance details.",
        );
      }

      setAttendance(response.data.data);
    } catch (loadError) {
      console.error("Failed to fetch attendance details:", loadError);
      setAttendance(null);
      setError(
        axios.isAxiosError(loadError)
          ? loadError.response?.data?.message ||
              "Unable to load attendance details."
          : loadError instanceof Error
            ? loadError.message
            : "Something went wrong while loading this record.",
      );
    } finally {
      setLoading(false);
    }
  }, [attendanceId]);

  useEffect(() => {
    void fetchAttendance();
  }, [fetchAttendance]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center bg-emerald-50 text-emerald-700">
              <LoaderCircle size={25} className="animate-spin" />
            </span>
            <p className="text-sm font-medium text-slate-600">
              Loading attendance details...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !attendance) {
    return (
      <DashboardLayout>
        <div className="mx-auto flex min-h-[55vh] max-w-3xl items-center justify-center">
          <div className="w-full border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center bg-rose-50 text-rose-600">
              <AlertCircle size={25} />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-rose-600">
              Attendance record
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Unable to load details
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {error || "The requested attendance record could not be found."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => void fetchAttendance()}
                className="inline-flex items-center gap-2 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                <RefreshCw size={15} />
                Try again
              </button>
              <Link
                href="/attendance"
                className="inline-flex items-center gap-2 border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back to attendance
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const employee = attendance.employee;
  const employeeName = employee
    ? `${employee.firstName} ${employee.lastName}`
    : `Employee #${attendance.employeeId}`;
  const statusLabel =
    attendance.status.charAt(0) + attendance.status.slice(1).toLowerCase();
  const statusIsPresent = attendance.status === "PRESENT";
  const initials = employee
    ? `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase()
    : "?";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/attendance"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
            >
              <ArrowLeft size={16} />
              Back to attendance
            </Link>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <CalendarDays size={14} />
              Workforce <span className="text-slate-300">/</span> Attendance
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Attendance record
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Attendance and employee details for this record.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canUpdateAttendance && (
              <Link
                href={`/attendance/${attendance.id}/edit`}
                className="inline-flex h-10 items-center justify-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                <Pencil size={15} />
                Edit attendance
              </Link>
            )}
            <button
              type="button"
              onClick={() => void fetchAttendance()}
              className="inline-flex h-10 items-center justify-center gap-2 border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw size={15} />
              Refresh details
            </button>
          </div>
        </header>

        <section className="relative isolate overflow-hidden border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.035]">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 -z-10 w-1/2 bg-gradient-to-l from-emerald-50/70 to-transparent"
          />
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center bg-emerald-700 text-lg font-bold tracking-wide text-white sm:h-[72px] sm:w-[72px]">
                {initials}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {employeeName}
                </h2>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {employee?.position || "Employee attendance"}
                  <span className="mx-2 text-slate-300">·</span>
                  {formatDate(attendance.date)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[attendance.status]}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 ${
                        statusIsPresent ? "bg-emerald-500" : "bg-current opacity-60"
                      }`}
                    />
                    {statusLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                    <Hash size={12} />
                    Record {attendance.id}
                  </span>
                </div>
              </div>
            </div>

            {employee && (
              <Link
                href={`/employees/${employee.id}`}
                className="inline-flex h-10 w-fit items-center gap-2 border border-emerald-200 bg-white px-3.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Employee profile
                <ArrowUpRight size={15} />
              </Link>
            )}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.85fr)]">
          <section className="border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
            <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700">
                <Clock3 size={19} />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">
                  Attendance information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Date, status, and recorded working hours.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DetailItem
                icon={<CalendarDays size={18} />}
                label="Attendance date"
                value={formatDate(attendance.date)}
              />
              <DetailItem
                icon={<CheckCircle2 size={18} />}
                label="Status"
                value={statusLabel}
              />
              <DetailItem
                icon={<Clock3 size={18} />}
                label="Check-in time"
                value={formatTime(attendance.checkIn)}
              />
              <DetailItem
                icon={<Clock3 size={18} />}
                label="Check-out time"
                value={formatTime(attendance.checkOut)}
              />
            </div>
          </section>

          <section className="border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
            <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700">
                <UserRound size={19} />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">
                  Employee information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Employee linked to this attendance record.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <DetailItem
                icon={<UserRound size={18} />}
                label="Full name"
                value={employeeName}
              />
              <DetailItem
                icon={<Hash size={18} />}
                label="Employee number"
                value={employee?.employeeNumber}
              />
              <DetailItem
                icon={<BriefcaseBusiness size={18} />}
                label="Position"
                value={employee?.position}
              />
              <DetailItem
                icon={<Mail size={18} />}
                label="Work email"
                value={employee?.email}
              />
              <DetailItem
                icon={<Phone size={18} />}
                label="Phone number"
                value={employee?.phone}
              />
            </div>
          </section>
        </div>

        <div className="border-t border-slate-200 pt-5">
          <Link
            href="/attendance"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
          >
            <ArrowLeft size={16} />
            Return to attendance list
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
