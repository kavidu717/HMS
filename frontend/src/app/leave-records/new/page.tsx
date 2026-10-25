
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  RefreshCw,
  Send,
  AlertCircle,
  FileText,
  ShieldCheck,
  ClipboardCheck,
  Users,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/dashboard-layout";

interface Employee {
  id: string;
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  position?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export default function CreateLeaveRequestPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const fetchEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);
      setError("");

      const response =
        await api.get<ApiResponse<Employee[]>>("/employees");

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to load employees.",
        );
      }

      const employeeData = Array.isArray(response.data.data)
        ? response.data.data
        : [];

      setEmployees(employeeData);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || "Failed to load employees."
        : err instanceof Error
          ? err.message
          : "Something went wrong.";

      setError(message);
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    void fetchEmployees();
  }, [fetchEmployees]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!employeeId || !leaveType || !startDate || !endDate || !reason.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (endDate < startDate) {
      toast.error("End date cannot be earlier than start date.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        employeeId,
        leaveType,
        startDate,
        endDate,
        reason: reason.trim(),
      };

      const response = await api.post<ApiResponse<unknown>>(
        "/employee-leave-records",
        payload,
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to create leave request.",
        );
      }

      toast.success(
        response.data.message || "Leave request created successfully.",
      );

      router.push("/leave-records");
      router.refresh();
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || "Failed to create leave request."
        : err instanceof Error
          ? err.message
          : "Something went wrong.";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

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
              <Users className="h-4 w-4" />
              Workforce <span className="text-slate-300">/</span> Leave management
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              New leave request
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Add the employee, dates, and reason to submit a leave request for review.
            </p>
          </div>
          <div className="hidden h-16 w-16 items-center justify-center border border-emerald-100 bg-emerald-50 text-emerald-700 sm:flex">
            <CalendarDays className="h-8 w-8" strokeWidth={1.6} />
          </div>
        </header>

        {error && (
          <div className="flex items-start gap-3 border border-rose-200 bg-rose-50 p-4 sm:p-5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-900">
                Unable to load employees
              </p>
              <p className="mt-1 text-sm leading-6 text-rose-800">{error}</p>
              <button
                type="button"
                onClick={() => void fetchEmployees()}
                className="mt-3 inline-flex items-center gap-2 border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <form
            onSubmit={handleSubmit}
            className="overflow-hidden border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.025]"
          >
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Request details</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Fields marked with <span className="font-semibold text-rose-500">*</span> are required.
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/15">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  New request
                </span>
              </div>
            </div>

            <div className="space-y-6 px-5 py-6 sm:px-7">
              <div>
                <label htmlFor="employeeId" className="mb-2 block text-sm font-semibold text-slate-700">
                  Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  id="employeeId"
                  value={employeeId}
                  onChange={(event) => setEmployeeId(event.target.value)}
                  required
                  disabled={loadingEmployees || employees.length === 0 || Boolean(error)}
                  className="h-11 w-full border border-slate-200 bg-slate-50/70 px-3 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {loadingEmployees ? "Loading employees..." : "Select employee"}
                  </option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                      {employee.employeeNumber ? ` (${employee.employeeNumber})` : ""}
                    </option>
                  ))}
                </select>
                {!loadingEmployees && !error && employees.length === 0 && (
                  <p className="mt-2 text-sm text-amber-700">
                    No employees found. Register an employee first.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="leaveType" className="mb-2 block text-sm font-semibold text-slate-700">
                  Leave type <span className="text-rose-500">*</span>
                </label>
                <select
                  id="leaveType"
                  value={leaveType}
                  onChange={(event) => setLeaveType(event.target.value)}
                  required
                  className="h-11 w-full border border-slate-200 bg-slate-50/70 px-3 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="">Select leave type</option>
                  <option value="ANNUAL">Annual leave</option>
                  <option value="CASUAL">Casual leave</option>
                  <option value="MEDICAL">Medical leave</option>
                  <option value="MATERNITY">Maternity leave</option>
                  <option value="NO_PAY">No-pay leave</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="startDate" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    Start date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(event) => {
                      setStartDate(event.target.value);
                      if (endDate && event.target.value > endDate) setEndDate("");
                    }}
                    required
                    className="h-11 w-full border border-slate-200 bg-slate-50/70 px-3 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    End date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                    required
                    className="h-11 w-full border border-slate-200 bg-slate-50/70 px-3 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reason" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FileText className="h-4 w-4 text-slate-400" />
                  Reason for leave <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  required
                  minLength={3}
                  maxLength={1000}
                  rows={5}
                  placeholder="Briefly explain the reason for this leave request..."
                  className="w-full resize-y border border-slate-200 bg-slate-50/70 px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
                <p className="mt-1.5 text-right text-xs text-slate-400">
                  {reason.length}/1000 characters
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <Link
                href="/leave-records"
                className="inline-flex h-11 items-center justify-center border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || loadingEmployees || Boolean(error) || employees.length === 0}
                className="inline-flex h-11 items-center justify-center gap-2 bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit leave request
                  </>
                )}
              </button>
            </div>
          </form>

          <aside className="space-y-4">
            <section className="border border-emerald-100 bg-emerald-50/70 p-5 sm:p-6">
              <span className="flex h-10 w-10 items-center justify-center bg-white text-emerald-700 shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-semibold text-slate-950">Before you submit</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Check the employee and dates, then add enough detail for the request to be reviewed.
              </p>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                <li className="flex gap-2.5">
                  <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  Confirm the correct employee is selected.
                </li>
                <li className="flex gap-2.5">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  Make sure the end date is on or after the start date.
                </li>
                <li className="flex gap-2.5">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  Keep the reason clear and specific.
                </li>
              </ul>
            </section>

            <section className="border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Review process
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                After submission, the request is recorded for processing. You can follow its status from the leave records page.
              </p>
              <Link
                href="/leave-records"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                View leave records
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </DashboardLayout>
  );
}
