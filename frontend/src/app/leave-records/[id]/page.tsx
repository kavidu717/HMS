"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  UserRound,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Pencil,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/store/auth.store";
import { hasPrivilege } from "@/lib/permissions";

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Employee {
  id: string;
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  position?: string;
  email?: string;
  phone?: string;
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
  {
    label: string;
    className: string;
    icon: typeof Clock;
  }
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

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getEmployeeName(record: LeaveRecord) {
  if (!record.employee) {
    return `Employee ID: ${record.employeeId}`;
  }

  return `${record.employee.firstName} ${record.employee.lastName}`;
}

export default function LeaveRecordDetailsPage() {
  const params = useParams();
  const leaveRecordId = params.id as string;
  const user = useAuthStore((state) => state.user);
  const canUpdateLeaveRecord = hasPrivilege(user, "employee_leave_record:update");

  const [record, setRecord] = useState<LeaveRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchRecord = useCallback(async () => {
    if (!leaveRecordId) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.get<ApiResponse<LeaveRecord>>(
        `/employee-leave-records/${leaveRecordId}`,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(
          response.data.message || "Failed to load leave record.",
        );
      }

      setRecord(response.data.data);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || "Failed to load leave record."
        : err instanceof Error
          ? err.message
          : "Something went wrong.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [leaveRecordId]);

  useEffect(() => {
    void fetchRecord();
  }, [fetchRecord]);

  const handleStatusChange = async (newStatus: "APPROVED" | "REJECTED") => {
    if (!record || record.status !== "PENDING" || updatingStatus) {
      return;
    }

    const action = newStatus === "APPROVED" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this leave request?`,
    );

    if (!confirmed) return;

    try {
      setUpdatingStatus(true);

      const response = await api.put<ApiResponse<LeaveRecord>>(
        `/employee-leave-records/${leaveRecordId}`,
        { status: newStatus },
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to update leave status.",
        );
      }

      if (response.data.data) {
        setRecord(response.data.data);
      } else {
        await fetchRecord();
      }

      toast.success(
        newStatus === "APPROVED"
          ? "Leave request approved successfully."
          : "Leave request rejected successfully.",
      );
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message ||
          "Failed to update leave status."
        : err instanceof Error
          ? err.message
          : "Something went wrong.";

      toast.error(message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center p-6">
          <div className="flex items-center gap-3 border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-700" />
            Loading leave record...
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (error || !record) {
    return (
      <DashboardLayout>
        <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
          <Link
            href="/leave-records"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to leave records
          </Link>

          <div className="border border-rose-200 bg-rose-50 p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-white text-rose-600">
                <AlertCircle className="h-5 w-5" />
              </span>

              <div>
                <h2 className="font-semibold text-rose-950">
                  Leave record could not be loaded
                </h2>

                <p className="mt-1 text-sm leading-6 text-rose-800">
                  {error || "Leave record not found."}
                </p>

                <button
                  type="button"
                  onClick={() => void fetchRecord()}
                  className="mt-4 inline-flex items-center gap-2 bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </button>
              </div>
            </div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  const status = statusConfig[record.status] ?? statusConfig.PENDING;
  const StatusIcon = status.icon;

  const start = new Date(record.startDate);
  const end = new Date(record.endDate);

  const duration =
    !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())
      ? Math.max(
          1,
          Math.round((end.getTime() - start.getTime()) / 86400000) + 1,
        )
      : null;

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:space-y-8">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/leave-records"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to leave records
            </Link>

            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <CalendarDays className="h-4 w-4" />
              Workforce <span className="text-slate-300">/</span> Leave
              management
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Leave request details
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Review the employee, requested dates, and current decision
              status.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void fetchRecord()}
              disabled={loading || updatingStatus}
              className="inline-flex h-10 items-center justify-center gap-2 border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            {canUpdateLeaveRecord && (
              <Link
                href={`/leave-records/${record.id}/edit`}
                className="inline-flex h-10 items-center justify-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                <Pencil className="h-4 w-4" />
                Edit request
              </Link>
            )}
          </div>
        </header>

        <section className="overflow-hidden border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.025]">
          <div className="flex flex-col gap-5 bg-gradient-to-br from-emerald-50 via-white to-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center bg-emerald-700 text-white shadow-sm">
                <UserRound className="h-7 w-7" />
              </span>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  Leave request
                </p>

                <h2 className="mt-1 truncate text-xl font-semibold text-slate-950 sm:text-2xl">
                  {getEmployeeName(record)}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {record.employee?.employeeNumber ||
                    `Employee ID: ${record.employeeId}`}
                  <span className="mx-2 text-slate-300">·</span>
                  {record.leaveType.replace(/_/g, " ")}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-2 px-3 py-2 text-sm font-semibold ring-1 ring-inset ${status.className}`}
            >
              <StatusIcon className="h-4 w-4" />
              {status.label}
            </span>
          </div>

          <div className="border-t border-slate-100 px-5 py-3 sm:px-7">
            <p className="break-all text-xs text-slate-400">
              Record ID{" "}
              <span className="ml-1 font-medium text-slate-600">
                {record.id}
              </span>
            </p>
          </div>
        </section>

        {record.status === "PENDING" && (
          <section className="border border-amber-200 bg-amber-50 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Review leave request
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Approve or reject this pending request.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleStatusChange("APPROVED")}
                  disabled={updatingStatus}
                  className="inline-flex min-h-11 items-center justify-center gap-2 bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve
                </button>

                <button
                  type="button"
                  onClick={() => void handleStatusChange("REJECTED")}
                  disabled={updatingStatus}
                  className="inline-flex min-h-11 items-center justify-center gap-2 bg-rose-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Reject
                </button>
              </div>
            </div>
          </section>
        )}

        {record.status !== "PENDING" && (
          <section className="flex items-start gap-3 border border-slate-200 bg-slate-50 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                This request has been reviewed
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Current status: {status.label}. The review buttons are no
                longer available.
              </p>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Leave type",
              value: record.leaveType.replace(/_/g, " "),
              icon: FileText,
            },
            {
              label: "Start date",
              value: formatDate(record.startDate),
              icon: CalendarDays,
            },
            {
              label: "End date",
              value: formatDate(record.endDate),
              icon: CalendarDays,
            },
            {
              label: "Duration",
              value:
                duration === null
                  ? "Not available"
                  : `${duration} day${duration === 1 ? "" : "s"}`,
              icon: Clock,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.label}
                className="border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.025] sm:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">
                    {item.label}
                  </p>
                  <span className="flex h-9 w-9 items-center justify-center bg-emerald-50 text-emerald-700">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>

                <p className="mt-3 text-base font-semibold capitalize text-slate-950">
                  {item.value}
                </p>
              </article>
            );
          })}
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="space-y-6">
            <section className="border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center bg-amber-50 text-amber-700">
                  <FileText className="h-5 w-5" />
                </span>

                <div>
                  <h2 className="font-semibold text-slate-950">
                    Reason for leave
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Details provided with this request
                  </p>
                </div>
              </div>

              <p className="whitespace-pre-wrap border-l-2 border-emerald-200 pl-4 text-sm leading-7 text-slate-700">
                {record.reason || "No reason provided."}
              </p>
            </section>

            <section className="border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center bg-emerald-50 text-emerald-700">
                  <UserRound className="h-5 w-5" />
                </span>

                <div>
                  <h2 className="font-semibold text-slate-950">
                    Employee information
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Contact and role details
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    label: "Full name",
                    value: getEmployeeName(record),
                  },
                  {
                    label: "Employee number",
                    value: record.employee?.employeeNumber,
                  },
                  {
                    label: "Position",
                    value: record.employee?.position?.replace(/_/g, " "),
                  },
                  {
                    label: "Email",
                    value: record.employee?.email,
                  },
                  {
                    label: "Phone",
                    value: record.employee?.phone,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="border border-slate-100 bg-slate-50/70 p-3.5"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-1 break-words text-sm font-medium text-slate-800">
                      {item.value || "Not available"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
            <h2 className="font-semibold text-slate-950">Request activity</h2>
            <p className="mt-1 text-sm text-slate-500">
              Submission and review information
            </p>

            <div className="mt-5 space-y-5">
              <div className="border-l-2 border-emerald-300 pl-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Submitted on
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {formatDate(record.createdAt)}
                </p>
              </div>

              <div className="border-l-2 border-slate-200 pl-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Last updated
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {formatDate(record.updatedAt)}
                </p>
              </div>

              <div className="border-l-2 border-slate-200 pl-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Approved by
                </p>
                <p className="mt-1 break-all text-sm font-medium text-slate-800">
                  {record.approvedBy || "Not assigned"}
                </p>
              </div>

              <div className="border-l-2 border-slate-200 pl-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Current status
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {status.label}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <Link
                href="/leave-records"
                className="inline-flex w-full items-center justify-center gap-2 border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to leave records
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </DashboardLayout>
  );
}
