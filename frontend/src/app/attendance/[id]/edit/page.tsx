"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Hash,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Save,
  UserRound,
} from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/dashboard-layout";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: AttendanceStatus;
  employee?: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    position: string;
  } | null;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface AttendanceForm {
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
}

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Enter a valid date and time.");
  }

  return date.toISOString();
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-LK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function EditAttendancePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const attendanceId = params.id;

  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [form, setForm] = useState<AttendanceForm>({
    status: "PRESENT",
    checkIn: "",
    checkOut: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
          response.data.message || "Unable to retrieve attendance details.",
        );
      }

      const record = response.data.data;
      setAttendance(record);
      setForm({
        status: record.status,
        checkIn: toDateTimeLocal(record.checkIn),
        checkOut: toDateTimeLocal(record.checkOut),
      });
    } catch (loadError) {
      console.error("Failed to load attendance for editing:", loadError);
      setAttendance(null);
      setError(
        axios.isAxiosError(loadError)
          ? loadError.response?.data?.message ||
              "Unable to load this attendance record."
          : loadError instanceof Error
            ? loadError.message
            : "Something went wrong while loading attendance.",
      );
    } finally {
      setLoading(false);
    }
  }, [attendanceId]);

  useEffect(() => {
    void fetchAttendance();
  }, [fetchAttendance]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !attendance) return;

    if (
      form.status !== "ABSENT" &&
      form.checkIn &&
      form.checkOut &&
      new Date(form.checkOut).getTime() < new Date(form.checkIn).getTime()
    ) {
      toast.error("Check-out time must be after check-in time.");
      return;
    }

    let checkIn: string | null = null;
    let checkOut: string | null = null;

    try {
      if (form.status !== "ABSENT") {
        checkIn = form.checkIn ? toIsoDateTime(form.checkIn) : null;
        checkOut = form.checkOut ? toIsoDateTime(form.checkOut) : null;
      }
    } catch (dateError) {
      toast.error(
        dateError instanceof Error
          ? dateError.message
          : "Enter valid check-in and check-out times.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.put<ApiResponse<AttendanceRecord>>(
        `/attendance/${attendanceId}`,
        { status: form.status, checkIn, checkOut },
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to save changes.");
      }

      toast.success(response.data.message || "Attendance updated successfully.");
      router.push(`/attendance/${attendanceId}`);
      router.refresh();
    } catch (saveError) {
      console.error("Failed to update attendance:", saveError);
      toast.error(
        axios.isAxiosError(saveError)
          ? saveError.response?.data?.message || "Unable to update attendance."
          : saveError instanceof Error
            ? saveError.message
            : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = <K extends keyof AttendanceForm>(
    field: K,
    value: AttendanceForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const inputClass =
    "h-11 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100";
  const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center bg-emerald-50 text-emerald-700">
              <LoaderCircle size={25} className="animate-spin" />
            </span>
            <p className="text-sm font-medium text-slate-600">
              Loading attendance record...
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
              Unable to edit attendance
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
                href={`/attendance/${attendanceId}`}
                className="inline-flex items-center gap-2 border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back to record
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const employeeName = attendance.employee
    ? `${attendance.employee.firstName} ${attendance.employee.lastName}`
    : `Employee #${attendance.employeeId}`;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-7">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href={`/attendance/${attendanceId}`}
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
            >
              <ArrowLeft size={16} />
              Back to attendance record
            </Link>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <CalendarDays size={14} />
              Workforce <span className="text-slate-300">/</span> Attendance
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Edit attendance
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              Update the status and working times for this attendance record.
            </p>
          </div>

          <div className="flex w-fit items-center gap-3 border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center bg-emerald-50 text-emerald-700">
              <Hash size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Record {attendance.id}
              </p>
              <p className="text-xs text-slate-500">{formatDate(attendance.date)}</p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.85fr)]">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.035]">
              <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-white to-white px-5 py-5 sm:px-7 sm:py-6">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-emerald-700 text-white shadow-sm shadow-emerald-900/15">
                    <Pencil size={19} />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">
                      Attendance details
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      The employee and attendance date are fixed for this record.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-5 sm:p-7">
                <div>
                  <label htmlFor="status" className={labelClass}>
                    Attendance status <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(event) =>
                      updateField("status", event.target.value as AttendanceStatus)
                    }
                    className={inputClass}
                    required
                    disabled={submitting}
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="ABSENT">Absent</option>
                  </select>
                </div>

                {form.status === "ABSENT" ? (
                  <div className="flex items-start gap-3 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p>
                      Saving this record as absent will clear its check-in and check-out times.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="checkIn" className={labelClass}>
                        Check-in time
                      </label>
                      <div className="relative">
                        <Clock3 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="checkIn"
                          type="datetime-local"
                          value={form.checkIn}
                          onChange={(event) =>
                            updateField("checkIn", event.target.value)
                          }
                          className={`${inputClass} pl-10`}
                          disabled={submitting}
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Leave blank if no check-in time was recorded.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="checkOut" className={labelClass}>
                        Check-out time
                      </label>
                      <div className="relative">
                        <Clock3 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="checkOut"
                          type="datetime-local"
                          value={form.checkOut}
                          onChange={(event) =>
                            updateField("checkOut", event.target.value)
                          }
                          className={`${inputClass} pl-10`}
                          disabled={submitting}
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Leave blank if no check-out time was recorded.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <Link
                  href={`/attendance/${attendanceId}`}
                  className="inline-flex items-center justify-center border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/10"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </section>

            <aside className="space-y-5">
              <section className="border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <span className="flex h-10 w-10 items-center justify-center bg-emerald-50 text-emerald-700">
                    <UserRound size={19} />
                  </span>
                  <div>
                    <h2 className="font-semibold text-slate-950">Employee</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Employee associated with this record
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-3 border border-slate-200/80 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-700 text-xs font-bold text-white">
                      {attendance.employee
                        ? `${attendance.employee.firstName.charAt(0)}${attendance.employee.lastName.charAt(0)}`.toUpperCase()
                        : "?"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{employeeName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {attendance.employee?.employeeNumber ||
                          `ID ${attendance.employeeId}`}
                      </p>
                      {attendance.employee?.position && (
                        <p className="mt-2 text-xs text-slate-500">
                          {attendance.employee.position}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border border-slate-200/80 p-4">
                    <span className="flex h-10 w-10 items-center justify-center bg-slate-100 text-slate-600">
                      <CalendarDays size={18} />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Attendance date
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatDate(attendance.date)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-slate-100 text-slate-600">
                    <CheckCircle2 size={19} />
                  </span>
                  <div>
                    <h2 className="font-semibold text-slate-950">Record ID</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Attendance identifier used by the system
                    </p>
                    <p className="mt-3 inline-flex items-center gap-1.5 border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      <Hash size={12} />
                      {attendance.id}
                    </p>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
