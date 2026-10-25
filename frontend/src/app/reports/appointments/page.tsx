"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import api from "@/lib/axios";

type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

type Appointment = {
  id: string;
  appointmentNumber: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
  notes?: string | null;
  status: AppointmentStatus;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

type StatusFilter = "ALL" | AppointmentStatus;

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No show" },
];

const getStatusLabel = (status: AppointmentStatus) => {
  switch (status) {
    case "SCHEDULED":
      return "Scheduled";
    case "CONFIRMED":
      return "Confirmed";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    case "NO_SHOW":
      return "No show";
  }
};

const getStatusStyle = (status: AppointmentStatus) => {
  switch (status) {
    case "SCHEDULED":
      return "bg-teal-50 text-teal-700 ring-teal-700/10";
    case "CONFIRMED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-700/10";
    case "COMPLETED":
      return "bg-slate-100 text-slate-700 ring-slate-700/10";
    case "CANCELLED":
      return "bg-rose-50 text-rose-700 ring-rose-700/10";
    case "NO_SHOW":
      return "bg-amber-50 text-amber-700 ring-amber-700/10";
  }
};

const formatDate = (value: string) => {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatTime = (value: string) => {
  if (!value) return "—";

  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return value;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const twelveHour = hour % 12 || 12;

  return `${twelveHour}:${String(minute).padStart(2, "0")} ${period}`;
};

const getDateInputValue = (value: string) => value.slice(0, 10);

const escapeCsv = (value: unknown) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

const getPatientName = (appointment: Appointment) =>
  appointment.patient
    ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
    : `Patient ${appointment.patientId}`;

const getDoctorName = (appointment: Appointment) =>
  appointment.doctor
    ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
    : `Doctor ${appointment.doctorId}`;

export default function AppointmentReportsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/appointments");
      const data = response.data?.data;

      if (!Array.isArray(data)) {
        throw new Error("Invalid appointments response");
      }

      setAppointments(data as Appointment[]);
    } catch (err) {
      console.error("Failed to fetch appointment report:", err);
      setError("Could not load appointment reports. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  const filteredAppointments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const patientName = getPatientName(appointment);
      const doctorName = getDoctorName(appointment);

      const matchesSearch =
        !query ||
        [
          appointment.appointmentNumber,
          patientName,
          doctorName,
          appointment.reason,
          appointment.status,
        ].some((value) => value?.toLowerCase().includes(query));

      const appointmentDate = getDateInputValue(
        appointment.appointmentDate,
      );

      const matchesStatus =
        statusFilter === "ALL" || appointment.status === statusFilter;

      const matchesStartDate =
        !startDate || appointmentDate >= startDate;

      const matchesEndDate = !endDate || appointmentDate <= endDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [appointments, searchTerm, statusFilter, startDate, endDate]);

  const stats = useMemo(
    () => [
      {
        label: "Total appointments",
        value: filteredAppointments.length,
        icon: CalendarDays,
        style: "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Scheduled",
        value: filteredAppointments.filter(
          (appointment) => appointment.status === "SCHEDULED",
        ).length,
        icon: Clock3,
        style: "bg-teal-50 text-teal-700",
      },
      {
        label: "Confirmed",
        value: filteredAppointments.filter(
          (appointment) => appointment.status === "CONFIRMED",
        ).length,
        icon: Activity,
        style: "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Completed",
        value: filteredAppointments.filter(
          (appointment) => appointment.status === "COMPLETED",
        ).length,
        icon: CheckCircle2,
        style: "bg-slate-100 text-slate-700",
      },
      {
        label: "Cancelled",
        value: filteredAppointments.filter(
          (appointment) => appointment.status === "CANCELLED",
        ).length,
        icon: XCircle,
        style: "bg-rose-50 text-rose-700",
      },
      {
        label: "No show",
        value: filteredAppointments.filter(
          (appointment) => appointment.status === "NO_SHOW",
        ).length,
        icon: AlertCircle,
        style: "bg-amber-50 text-amber-700",
      },
    ],
    [filteredAppointments],
  );

  const handleExportCsv = () => {
    const headers = [
      "Appointment Number",
      "Patient",
      "Doctor",
      "Appointment Date",
      "Start Time",
      "End Time",
      "Status",
      "Reason",
    ];

    const rows = filteredAppointments.map((appointment) => [
      appointment.appointmentNumber,
      getPatientName(appointment),
      getDoctorName(appointment),
      getDateInputValue(appointment.appointmentDate),
      formatTime(appointment.startTime),
      formatTime(appointment.endTime),
      getStatusLabel(appointment.status),
      appointment.reason ?? "",
    ]);

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "appointment-report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setStartDate("");
    setEndDate("");
  };

  const hasFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "ALL" ||
    startDate !== "" ||
    endDate !== "";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/reports"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 transition hover:text-emerald-900"
            >
              <ArrowLeft size={16} />
              Back to Reports
            </Link>

            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
              <span className="h-1.5 w-1.5 bg-emerald-600" />
              Reports <span className="text-slate-300">/</span> Scheduling
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Appointment Reports
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Review appointment activity, compare statuses, and export
              filtered appointment records.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={() => void fetchAppointments()}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={loading || filteredAppointments.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 bg-emerald-700 px-3.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={15} />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || filteredAppointments.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer size={15} />
              Print
            </button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="flex items-center justify-between gap-4 border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.025]"
              >
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>

                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    {loading ? "—" : stat.value}
                  </p>
                </div>

                <span
                  className={`flex h-11 w-11 items-center justify-center ${stat.style}`}
                >
                  <Icon size={20} />
                </span>
              </article>
            );
          })}
        </section>

        <section className="border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025] print:hidden">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Search size={17} className="text-emerald-700" />
              Search and filters
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Narrow the report by keyword, appointment status, or date range.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Search appointments
              </span>

              <span className="relative block">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Appointment number, patient, doctor..."
                  className="h-11 w-full border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </span>
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Appointment status
              </span>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  From date
                </span>

                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </label>

              <label className="mt-3 block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  To date
                </span>

                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {loading ? "—" : filteredAppointments.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">
                {loading ? "—" : appointments.length}
              </span>{" "}
              appointments
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-emerald-700 transition hover:text-emerald-900"
              >
                <XCircle size={14} />
                Clear filters
              </button>
            )}
          </div>
        </section>

        <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025]">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <FileText size={18} className="text-emerald-700" />
                Appointment records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Detailed records matching the selected filters.
              </p>
            </div>

            {!loading && !error && (
              <span className="self-start bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {filteredAppointments.length} records
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-12">
              <Loader2
                size={28}
                className="animate-spin text-emerald-700"
              />
              <p className="text-sm text-slate-500">
                Loading appointment report...
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <AlertCircle size={30} className="text-rose-600" />
              <h3 className="mt-3 font-semibold text-slate-900">
                Unable to load report
              </h3>
              <p className="mt-1 text-sm text-slate-500">{error}</p>
              <button
                type="button"
                onClick={() => void fetchAppointments()}
                className="mt-4 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Try again
              </button>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <CalendarDays size={30} className="text-slate-400" />
              <h3 className="mt-3 font-semibold text-slate-900">
                No appointments found
              </h3>
              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                No appointment records match the current filters. Try changing
                the search term, status, or date range.
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <th scope="col" className="px-5 py-3.5">
                      Appointment
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Patient
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Doctor
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Date
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Time
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Reason
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="transition hover:bg-emerald-50/30"
                    >
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-slate-800">
                          {appointment.appointmentNumber}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-slate-700">
                          {getPatientName(appointment)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-700">
                          {getDoctorName(appointment)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatDate(appointment.appointmentDate)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatTime(appointment.startTime)} –{" "}
                        {formatTime(appointment.endTime)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusStyle(appointment.status)}`}
                        >
                          {getStatusLabel(appointment.status)}
                        </span>
                      </td>

                      <td className="max-w-xs px-5 py-4 text-sm text-slate-500">
                        <span className="block truncate" title={appointment.reason ?? ""}>
                          {appointment.reason || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && filteredAppointments.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 text-xs text-slate-500 sm:px-6">
              Report generated from the current appointment records. Summary
              values reflect the active filters.
            </div>
          )}
        </section>

        <style jsx global>{`
          @media print {
            @page {
              size: landscape;
              margin: 12mm;
            }

            body {
              background: white !important;
              color: black !important;
            }

            body * {
              visibility: hidden;
            }

            main,
            main * {
              visibility: visible;
            }

            button,
            input,
            select,
            nav,
            aside,
            .print\\:hidden {
              display: none !important;
            }

            main {
              position: absolute !important;
              inset: 0 !important;
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            section,
            article {
              break-inside: avoid;
              box-shadow: none !important;
            }

            table {
              width: 100% !important;
              min-width: 0 !important;
              font-size: 9pt !important;
            }

            th,
            td {
              padding: 6px !important;
            }

            tr {
              break-inside: avoid;
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
}