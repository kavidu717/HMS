"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/dashboard-layout";

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  status: string;
  department?: {
    name: string;
  } | null;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

interface AttendanceForm {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
}

const localDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const toIsoDateTime = (date: string, time: string) =>
  new Date(`${date}T${time}:00`).toISOString();

const statusOptions: {
  value: AttendanceStatus;
  label: string;
  description: string;
  icon: typeof CheckCircle2;
  style: string;
}[] = [
  {
    value: "PRESENT",
    label: "Present",
    description: "Employee attended their shift.",
    icon: CheckCircle2,
    style: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  {
    value: "LATE",
    label: "Late",
    description: "Employee arrived after their scheduled start.",
    icon: Clock3,
    style: "border-amber-200 bg-amber-50 text-amber-800",
  },
  {
    value: "ABSENT",
    label: "Absent",
    description: "Employee did not attend their shift.",
    icon: AlertCircle,
    style: "border-rose-200 bg-rose-50 text-rose-800",
  },
];

export default function NewAttendancePage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employeesError, setEmployeesError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AttendanceForm>(() => ({
    employeeId: "",
    date: localDate(),
    status: "PRESENT",
    checkIn: "",
    checkOut: "",
  }));

  const fetchEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    setEmployeesError("");

    try {
      const response = await api.get<ApiResponse<Employee[]>>("/employees");

      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error(response.data.message || "Invalid employee list received.");
      }

      setEmployees(
        response.data.data.filter(
          (employee) => employee.status.toUpperCase() === "ACTIVE",
        ),
      );
    } catch (error) {
      console.error("Failed to load employees for attendance:", error);
      setEmployeesError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Unable to load employees."
          : error instanceof Error
            ? error.message
            : "Something went wrong while loading employees.",
      );
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    void fetchEmployees();
  }, [fetchEmployees]);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === form.employeeId) ?? null,
    [employees, form.employeeId],
  );

  const updateField = <K extends keyof AttendanceForm>(
    field: K,
    value: AttendanceForm[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    if (!form.employeeId || !form.date) {
      toast.error("Select an employee and attendance date.");
      return;
    }

    if (
      form.status !== "ABSENT" &&
      form.checkIn &&
      form.checkOut &&
      form.checkOut < form.checkIn
    ) {
      toast.error("Check-out time must be after check-in time.");
      return;
    }

    let checkIn: string | undefined;
    let checkOut: string | undefined;

    try {
      if (form.status !== "ABSENT" && form.checkIn) {
        checkIn = toIsoDateTime(form.date, form.checkIn);
      }
      if (form.status !== "ABSENT" && form.checkOut) {
        checkOut = toIsoDateTime(form.date, form.checkOut);
      }
    } catch {
      toast.error("Enter valid check-in and check-out times.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post<ApiResponse<unknown>>("/attendance", {
        employeeId: form.employeeId,
        date: form.date,
        status: form.status,
        ...(checkIn ? { checkIn } : {}),
        ...(checkOut ? { checkOut } : {}),
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to mark attendance.");
      }

      toast.success(response.data.message || "Attendance marked successfully.");
      router.push("/attendance");
      router.refresh();
    } catch (error) {
      console.error("Failed to mark attendance:", error);
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Unable to mark attendance."
          : error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "h-11 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100";
  const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-7">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
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
              Mark attendance
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Record an employee’s attendance status and working times for the selected day.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800">
            <ShieldCheck size={16} />
            Attendance entry
          </div>
        </header>

        {employeesError && (
          <div
            role="alert"
            className="flex flex-col gap-3 border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3 text-sm text-rose-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Could not load active employees</p>
                <p className="mt-1 text-rose-700">{employeesError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void fetchEmployees()}
              disabled={loadingEmployees}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-800 transition hover:bg-rose-100 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loadingEmployees ? "animate-spin" : ""}
              />
              Retry
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.85fr)]">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.035]">
              <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-white to-white px-5 py-5 sm:px-7 sm:py-6">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-emerald-700 text-white shadow-sm shadow-emerald-900/15">
                    <CalendarDays size={20} />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">
                      Attendance details
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Select an active employee, date, and attendance status.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2 sm:p-7">
                <div className="sm:col-span-2">
                  <label htmlFor="employeeId" className={labelClass}>
                    Employee <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="employeeId"
                    value={form.employeeId}
                    onChange={(event) => updateField("employeeId", event.target.value)}
                    className={inputClass}
                    required
                    disabled={loadingEmployees || submitting || employees.length === 0}
                  >
                    <option value="">
                      {loadingEmployees
                        ? "Loading active employees..."
                        : "Choose an employee"}
                    </option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} · {employee.employeeNumber}
                      </option>
                    ))}
                  </select>
                  {!loadingEmployees && employees.length === 0 && !employeesError && (
                    <p className="mt-2 text-xs text-amber-700">
                      No active employees are available to mark attendance.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="date" className={labelClass}>
                    Attendance date <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <CalendarDays size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(event) => updateField("date", event.target.value)}
                      className={`${inputClass} pl-10`}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="status" className={labelClass}>
                    Status <span className="text-rose-600">*</span>
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
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {form.status !== "ABSENT" && (
                  <>
                    <div>
                      <label htmlFor="checkIn" className={labelClass}>
                        Check-in time <span className="font-normal text-slate-400">(optional)</span>
                      </label>
                      <div className="relative">
                        <Clock3 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="checkIn"
                          type="time"
                          value={form.checkIn}
                          onChange={(event) => updateField("checkIn", event.target.value)}
                          className={`${inputClass} pl-10`}
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="checkOut" className={labelClass}>
                        Check-out time <span className="font-normal text-slate-400">(optional)</span>
                      </label>
                      <div className="relative">
                        <Clock3 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="checkOut"
                          type="time"
                          value={form.checkOut}
                          onChange={(event) => updateField("checkOut", event.target.value)}
                          className={`${inputClass} pl-10`}
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <Link
                  href="/attendance"
                  className="inline-flex items-center justify-center border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/10"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting || loadingEmployees || employees.length === 0}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Saving attendance...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save attendance
                    </>
                  )}
                </button>
              </div>
            </section>

            <aside className="space-y-5">
              <section className="border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <span className="flex h-10 w-10 items-center justify-center bg-emerald-50 text-emerald-700">
                    <Users size={19} />
                  </span>
                  <div>
                    <h2 className="font-semibold text-slate-950">
                      Selected employee
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Employee summary
                    </p>
                  </div>
                </div>

                {selectedEmployee ? (
                  <div className="mt-5 flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-emerald-700 text-sm font-bold text-white">
                      {`${selectedEmployee.firstName.charAt(0)}${selectedEmployee.lastName.charAt(0)}`.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {selectedEmployee.employeeNumber}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <BriefcaseBusiness size={13} />
                        {selectedEmployee.position}
                      </p>
                      {selectedEmployee.department?.name && (
                        <p className="mt-1 text-xs text-slate-500">
                          {selectedEmployee.department.name}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 flex items-center gap-3 border border-dashed border-slate-200 bg-slate-50/70 p-4">
                    <UserRound size={20} className="text-slate-400" />
                    <p className="text-sm text-slate-500">
                      Choose an employee to see their summary here.
                    </p>
                  </div>
                )}
              </section>

              <section className="border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
                <h2 className="font-semibold text-slate-950">Status guide</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose the status that best reflects the employee’s day.
                </p>
                <div className="mt-4 space-y-3">
                  {statusOptions.map((status) => {
                    const Icon = status.icon;
                    const selected = form.status === status.value;

                    return (
                      <div
                        key={status.value}
                        className={`flex items-start gap-3 border p-3 transition ${
                          selected
                            ? status.style
                            : "border-slate-100 bg-slate-50/70 text-slate-600"
                        }`}
                      >
                        <Icon size={17} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold">{status.label}</p>
                          <p className="mt-1 text-xs leading-5 opacity-80">
                            {status.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </aside>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
