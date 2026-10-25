"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  AlertCircle,
  CalendarDays,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/dashboard-layout";

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
}

interface LeaveRecord {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  status: string;
  employee?: Employee;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const leaveTypes = [
  { value: "ANNUAL", label: "Annual Leave" },
  { value: "CASUAL", label: "Casual Leave" },
  { value: "MEDICAL", label: "Medical Leave" },
  { value: "MATERNITY", label: "Maternity Leave" },
  { value: "NO_PAY", label: "No-Pay Leave" },
];

export default function EditLeaveRecordPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState<LeaveRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const fetchLeaveRecord = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get<ApiResponse<LeaveRecord>>(
        `/employee-leave-records/${id}`,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Failed to load leave record.");
      }

      const data = response.data.data;
      setRecord(data);
      setFormData({
        leaveType: data.leaveType,
        startDate: data.startDate.split("T")[0],
        endDate: data.endDate.split("T")[0],
        reason: data.reason ?? "",
      });
    } catch (loadError) {
      setRecord(null);
      setErrorMessage(
        axios.isAxiosError(loadError)
          ? loadError.response?.data?.message || "Failed to load leave record."
          : loadError instanceof Error
            ? loadError.message
            : "Something went wrong while loading this record.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchLeaveRecord();
  }, [fetchLeaveRecord]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!record) return;

    if (formData.startDate > formData.endDate) {
      toast.error("End date must be on or after the start date.");
      return;
    }

    try {
      setSaving(true);

      await api.put(`/employee-leave-records/${id}`, {
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason.trim() || null,
      });

      toast.success("Leave record updated successfully.");
      router.push(`/leave-records/${id}`);
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ??
            "Failed to update leave record.",
        );
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center p-6">
          <div className="flex items-center gap-3 border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
            Loading leave record...
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (!record) {
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
          <section className="flex items-start gap-3 border border-rose-200 bg-rose-50 p-6 sm:p-8">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-white text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-semibold text-rose-950">
                Leave record could not be loaded
              </h1>
              <p className="mt-1 text-sm leading-6 text-rose-800">
                {errorMessage || "This leave record could not be found."}
              </p>
              <button
                type="button"
                onClick={() => void fetchLeaveRecord()}
                className="mt-4 inline-flex items-center gap-2 bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            </div>
          </section>
        </main>
      </DashboardLayout>
    );
  }

  const isPending = record.status === "PENDING";

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:space-y-8">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href={`/leave-records/${id}`}
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to leave request
            </Link>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <CalendarDays className="h-4 w-4" />
              Workforce <span className="text-slate-300">/</span> Leave management
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Edit leave request
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Update the leave type, dates, or reason for this employee request.
            </p>
          </div>
          <span className={`inline-flex w-fit items-center gap-2 px-3 py-2 text-sm font-semibold ring-1 ring-inset ${isPending ? "bg-amber-50 text-amber-700 ring-amber-600/15" : "bg-slate-100 text-slate-700 ring-slate-500/15"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isPending ? "bg-amber-500" : "bg-slate-500"}`} />
            {record.status.replace(/_/g, " ")}
          </span>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-start">
          <form
            onSubmit={handleSubmit}
            className="overflow-hidden border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.025]"
          >
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
              <h2 className="text-lg font-semibold text-slate-950">Request details</h2>
              <p className="mt-1 text-sm text-slate-500">
                Update the information below and save your changes.
              </p>
            </div>

            <div className="space-y-6 px-5 py-6 sm:px-7">
              <div>
                <label htmlFor="employee" className="mb-2 block text-sm font-semibold text-slate-700">
                  Employee
                </label>
                <div className="flex items-center gap-3 border border-slate-200 bg-slate-50/70 p-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {record.employee
                        ? `${record.employee.firstName} ${record.employee.lastName}`
                        : `Employee ${record.employeeId}`}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {record.employee?.employeeNumber || `Employee ID: ${record.employeeId}`}
                    </p>
                  </div>
                </div>
                <input id="employee" type="hidden" value={record.employeeId} readOnly />
              </div>

              <div>
                <label htmlFor="leaveType" className="mb-2 block text-sm font-semibold text-slate-700">
                  Leave type <span className="text-rose-500">*</span>
                </label>
                <select
                  id="leaveType"
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleChange}
                  required
                  className="h-11 w-full border border-slate-200 bg-slate-50/70 px-3 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
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
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(event) => {
                      handleChange(event);
                      if (formData.endDate && event.target.value > formData.endDate) {
                        setFormData((previous) => ({ ...previous, endDate: "" }));
                      }
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
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate || undefined}
                    required
                    className="h-11 w-full border border-slate-200 bg-slate-50/70 px-3 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reason" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FileText className="h-4 w-4 text-slate-400" />
                  Reason for leave
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows={5}
                  maxLength={5000}
                  placeholder="Add or update the reason for this leave request..."
                  className="w-full resize-y border border-slate-200 bg-slate-50/70 px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
                <p className="mt-1.5 text-right text-xs text-slate-400">
                  {formData.reason.length}/5000 characters
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <Link
                href={`/leave-records/${id}`}
                className="inline-flex h-11 items-center justify-center border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving changes...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save changes
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
              <h2 className="mt-4 font-semibold text-slate-950">Review your changes</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Make sure the leave type and date range are correct before saving this request.
              </p>
            </section>

            <section className="border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Record summary</p>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-xs text-slate-500">Employee</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">
                    {record.employee
                      ? `${record.employee.firstName} ${record.employee.lastName}`
                      : `Employee ${record.employeeId}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Current status</dt>
                  <dd className="mt-1 text-sm font-semibold capitalize text-slate-800">
                    {record.status.toLowerCase()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Record ID</dt>
                  <dd className="mt-1 break-all text-xs font-medium text-slate-700">{record.id}</dd>
                </div>
              </dl>
            </section>

            {!isPending && (
              <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 p-4">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <p className="text-sm leading-6 text-amber-800">
                  This request is {record.status.toLowerCase()}. Changes may be subject to your organization&apos;s review process.
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </DashboardLayout>
  );
}
