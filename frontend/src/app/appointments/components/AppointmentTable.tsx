
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Activity,
  CalendarClock,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Stethoscope,
  UsersRound,
} from "lucide-react";

import api from "@/lib/axios";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
};

type Doctor = {
  id: string;
  firstName: string;
  lastName: string;
};

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
  status:
    | "SCHEDULED"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW";
  patient?: Patient;
  doctor?: Doctor;
};

type AppointmentTableProps = {
  onView?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onUpdateStatus?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
};

type StatusFilter = "ALL" | Appointment["status"];

const statuses: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No show" },
];

const getStatusStyle = (status: Appointment["status"]) => {
  switch (status) {
    case "SCHEDULED":
      return "bg-teal-50 text-teal-700 ring-teal-700/10";

    case "CONFIRMED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-700/10";

    case "COMPLETED":
      return "bg-slate-100 text-slate-600 ring-slate-600/10";

    case "CANCELLED":
      return "bg-rose-50 text-rose-700 ring-rose-700/10";

    case "NO_SHOW":
      return "bg-amber-50 text-amber-700 ring-amber-700/10";
  }
};

const getStatusLabel = (status: Appointment["status"]) =>
  status === "NO_SHOW"
    ? "No show"
    : status.charAt(0) + status.slice(1).toLowerCase();

const getDateParts = (value: string) => {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return { day: "—", month: "", year: value };
  }

  return {
    day: new Intl.DateTimeFormat("en-LK", {
      day: "2-digit",
    }).format(date),

    month: new Intl.DateTimeFormat("en-LK", {
      month: "short",
    }).format(date),

    year: new Intl.DateTimeFormat("en-LK", {
      year: "numeric",
    }).format(date),
  };
};

const formatTime = (value: string) => {
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

const getInitials = (firstName?: string, lastName?: string) => {
  const initials = `${firstName?.trim().charAt(0) ?? ""}${lastName?.trim().charAt(0) ?? ""}`;

  return initials || "AP";
};

// Appointment Action Buttons
function AppointmentActions({
  appointment,
  onView,
  onReschedule,
  onUpdateStatus,
  onCancel,
}: {
  appointment: Appointment;
  onView?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onUpdateStatus?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
}) {
  const inactive = ["CANCELLED", "COMPLETED", "NO_SHOW"].includes(
    appointment.status,
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* View Appointment */}
      {onView && (
        <button
          type="button"
          onClick={() => onView(appointment)}
          className="inline-flex h-9 items-center justify-center gap-1.5 border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <Eye size={14} />
          View
        </button>
      )}

      {/* Reschedule Appointment */}
      {onReschedule && (
        <button
          type="button"
          onClick={() => onReschedule(appointment)}
          disabled={inactive}
          className="inline-flex h-9 items-center justify-center gap-1.5 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
        >
          <CalendarClock size={14} />
          Reschedule
        </button>
      )}

      {/* Update Appointment Status */}
      {onUpdateStatus && (
        <button
          type="button"
          onClick={() => onUpdateStatus(appointment)}
          disabled={inactive}
          className="inline-flex h-9 items-center justify-center gap-1.5 px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          <Activity size={14} />
          Update status
        </button>
      )}

      {/* Cancel Appointment */}
      {onCancel && (
        <button
          type="button"
          aria-label={`Cancel appointment ${appointment.appointmentNumber}`}
          onClick={() => onCancel(appointment)}
          disabled={inactive}
          className="inline-flex h-9 items-center justify-center gap-1.5 border border-rose-200 bg-white px-2.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300"
        >
          <CalendarX2 size={14} />
          Cancel
        </button>
      )}
    </div>
  );
}

export default function AppointmentTable({
  onView,
  onReschedule,
  onUpdateStatus,
  onCancel,
}: AppointmentTableProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  // Fetch appointments from backend
  const getAppointments = useCallback(async () => {
    const response = await api.get("/appointments");

    const data = response.data?.data;

    if (!Array.isArray(data)) {
      throw new Error("Invalid appointments response");
    }

    return data as Appointment[];
  }, []);

  // Refresh appointment list
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setAppointments(await getAppointments());
    } catch (err) {
      console.error("Failed to fetch appointments:", err);

      setError("We couldn’t load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [getAppointments]);

  // Initial API request
  useEffect(() => {
    let active = true;

    getAppointments()
      .then((data) => {
        if (active) {
          setAppointments(data);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;

        console.error("Failed to fetch appointments:", err);

        setError("We couldn’t load appointments. Please try again.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [getAppointments]);

  // Search and status filtering
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const matchesStatus =
          statusFilter === "ALL" || appointment.status === statusFilter;

        const patientName = appointment.patient
          ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
          : appointment.patientId;

        const doctorName = appointment.doctor
          ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}`
          : appointment.doctorId;

        const matchesSearch =
          !normalizedSearch ||
          [
            appointment.appointmentNumber,
            patientName,
            doctorName,
            appointment.reason,
          ].some((value) =>
            value?.toLowerCase().includes(normalizedSearch),
          );

        return matchesStatus && matchesSearch;
      }),
    [appointments, normalizedSearch, statusFilter],
  );

  // Appointment statistics
  const scheduledCount = appointments.filter((appointment) =>
    ["SCHEDULED", "CONFIRMED"].includes(appointment.status),
  ).length;

  const completedCount = appointments.filter(
    (appointment) => appointment.status === "COMPLETED",
  ).length;

  const attentionCount = appointments.filter((appointment) =>
    ["CANCELLED", "NO_SHOW"].includes(appointment.status),
  ).length;

  // Show actions column when at least one action is available
  const hasActions = Boolean(
    onView || onReschedule || onUpdateStatus || onCancel,
  );

  return (
    <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025]">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center bg-emerald-50 text-emerald-700">
              <CalendarDays size={18} />
            </span>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight text-slate-900">
                  Appointment schedule
                </h2>

                {!loading && !error && (
                  <span className="bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {appointments.length}
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-sm text-slate-500">
                A shared view of every patient visit.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void fetchAppointments()}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 self-start border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/10 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw
            size={15}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-px border-b border-slate-100 bg-slate-100 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total appointments",
            value: appointments.length,
            note: "Across all statuses",
            icon: UsersRound,
            iconStyle: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Scheduled & confirmed",
            value: scheduledCount,
            note: "Visits to look forward to",
            icon: CalendarDays,
            iconStyle: "bg-teal-50 text-teal-700",
          },
          {
            label: "Completed visits",
            value: completedCount,
            note: "Care delivered",
            icon: CheckCircle2,
            iconStyle: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Needs attention",
            value: attentionCount,
            note: "Cancelled or no-show",
            icon: Clock3,
            iconStyle: "bg-amber-50 text-amber-700",
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="flex items-center justify-between gap-3 bg-white px-5 py-4 sm:px-6"
            >
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {stat.label}
                </p>

                <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-950">
                  {loading ? "—" : stat.value}
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  {stat.note}
                </p>
              </div>

              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center ${stat.iconStyle}`}
              >
                <Icon size={18} />
              </span>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block w-full sm:max-w-md">
              <span className="sr-only">Search appointments</span>

              <Search
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search patient, provider or reference..."
                className="h-11 w-full border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>

            {!loading && !error && (
              <p className="text-xs text-slate-500 sm:text-right">
                <span className="font-semibold text-slate-800">
                  {filteredAppointments.length}
                </span>{" "}
                {filteredAppointments.length === 1
                  ? "appointment"
                  : "appointments"}{" "}
                shown
              </p>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div>
            <p className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              <Filter size={13} />
              Filter by status
            </p>

            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {statuses.map((status) => {
                const selected = statusFilter === status.value;

                const count =
                  status.value === "ALL"
                    ? appointments.length
                    : appointments.filter(
                        (appointment) =>
                          appointment.status === status.value,
                      ).length;

                return (
                  <button
                    key={status.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setStatusFilter(status.value)}
                    className={`inline-flex h-9 shrink-0 items-center gap-2 px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      selected
                        ? "bg-[#12392f] text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {status.value === "ALL" ? "All" : status.label}

                    <span
                      className={`text-[10px] ${
                        selected ? "text-emerald-100" : "text-slate-400"
                      }`}
                    >
                      {loading ? "—" : count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 border-t border-slate-100 px-6 py-12">
          <span className="flex h-11 w-11 items-center justify-center bg-emerald-50 text-emerald-700">
            <Loader2 size={21} className="animate-spin" />
          </span>

          <p className="text-sm text-slate-500">
            Loading your appointment schedule…
          </p>
        </div>
      ) : error ? (
        /* Error State */
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex h-11 w-11 items-center justify-center bg-rose-50 text-rose-600">
            <AlertCircle size={21} />
          </span>

          <h3 className="mt-4 font-semibold text-slate-900">
            Couldn’t load appointments
          </h3>

          <p className="mt-1 text-sm text-slate-500">{error}</p>

          <button
            type="button"
            onClick={() => void fetchAppointments()}
            className="mt-4 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/15"
          >
            Try again
          </button>
        </div>
      ) : filteredAppointments.length === 0 ? (
        /* Empty State */
        <div className="flex min-h-64 flex-col items-center justify-center border-t border-slate-100 px-6 py-12 text-center">
          <span className="flex h-11 w-11 items-center justify-center bg-slate-100 text-slate-500">
            {appointments.length === 0 ? (
              <CalendarDays size={21} />
            ) : (
              <Search size={21} />
            )}
          </span>

          <h3 className="mt-4 font-semibold text-slate-900">
            {appointments.length === 0
              ? "No appointments yet"
              : "No matching appointments"}
          </h3>

          <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
            {appointments.length === 0
              ? "New visits will appear here once they are scheduled."
              : "Try another name, reference, or status to find the visit you need."}
          </p>

          {(searchTerm || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
              }}
              className="mt-4 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Appointment Cards */}
          <div className="divide-y divide-slate-100 border-t border-slate-100 xl:hidden">
            {filteredAppointments.map((appointment) => {
              const patientName = appointment.patient
                ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                : `Patient ${appointment.patientId}`;

              const doctorName = appointment.doctor
                ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                : `Doctor ${appointment.doctorId}`;

              const date = getDateParts(appointment.appointmentDate);

              return (
                <article
                  key={appointment.id}
                  className="p-4 transition hover:bg-emerald-50/30 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-emerald-50 text-xs font-semibold text-emerald-700">
                        {getInitials(
                          appointment.patient?.firstName,
                          appointment.patient?.lastName,
                        )}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {patientName}
                        </p>

                        <p className="mt-1 truncate text-xs font-medium text-slate-400">
                          {appointment.appointmentNumber}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 px-2 py-1 text-[10px] font-semibold ring-1 ring-inset ${getStatusStyle(appointment.status)}`}
                    >
                      <span className="h-1.5 w-1.5 bg-current" />
                      {getStatusLabel(appointment.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-px border border-slate-200 bg-slate-200">
                    <div className="min-w-0 bg-slate-50/80 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Care provider
                      </p>

                      <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                        {doctorName}
                      </p>
                    </div>

                    <div className="bg-slate-50/80 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Date &amp; time
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {date.day} {date.month} ·{" "}
                        {formatTime(appointment.startTime)}
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {date.year}
                      </p>
                    </div>
                  </div>

                  {appointment.reason && (
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                      <span className="font-semibold text-slate-600">
                        Reason:{" "}
                      </span>
                      {appointment.reason}
                    </p>
                  )}

                  {hasActions && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                      <AppointmentActions
                        appointment={appointment}
                        onView={onView}
                        onReschedule={onReschedule}
                        onUpdateStatus={onUpdateStatus}
                        onCancel={onCancel}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Desktop Appointment Table */}
          <div className="hidden overflow-x-auto border-t border-slate-100 xl:block">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead className="bg-slate-50/80">
                <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <th scope="col" className="px-6 py-3.5">
                    Patient
                  </th>

                  <th scope="col" className="px-5 py-3.5">
                    Care provider
                  </th>

                  <th scope="col" className="px-5 py-3.5">
                    Date &amp; time
                  </th>

                  <th scope="col" className="px-5 py-3.5">
                    Status
                  </th>

                  {hasActions && (
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-right"
                    >
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((appointment) => {
                  const patientName = appointment.patient
                    ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                    : `Patient ${appointment.patientId}`;

                  const doctorName = appointment.doctor
                    ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                    : `Doctor ${appointment.doctorId}`;

                  const date = getDateParts(appointment.appointmentDate);

                  return (
                    <tr
                      key={appointment.id}
                      className="group transition hover:bg-emerald-50/30"
                    >
                      {/* Patient */}
                      <td className="border-l-2 border-l-transparent px-6 py-4 transition group-hover:border-l-emerald-600">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-50 text-xs font-semibold text-emerald-700">
                            {getInitials(
                              appointment.patient?.firstName,
                              appointment.patient?.lastName,
                            )}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {patientName}
                            </p>

                            <p
                              className="mt-1 max-w-56 truncate text-xs text-slate-400"
                              title={appointment.reason || undefined}
                            >
                              {appointment.appointmentNumber}

                              {appointment.reason && (
                                <span> · {appointment.reason}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Doctor */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-slate-100 text-slate-600">
                            <Stethoscope size={15} />
                          </span>

                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {doctorName}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              Care provider
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Appointment Date and Time */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center bg-emerald-50 text-emerald-800">
                            <span className="text-sm font-semibold leading-4">
                              {date.day}
                            </span>

                            <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                              {date.month}
                            </span>
                          </span>

                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {date.year}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatTime(appointment.startTime)} –{" "}
                              {formatTime(appointment.endTime)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Appointment Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusStyle(appointment.status)}`}
                        >
                          <span className="h-1.5 w-1.5 bg-current" />
                          {getStatusLabel(appointment.status)}
                        </span>
                      </td>

                      {/* Appointment Actions */}
                      {hasActions && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end">
                            <AppointmentActions
                              appointment={appointment}
                              onView={onView}
                              onReschedule={onReschedule}
                              onUpdateStatus={onUpdateStatus}
                              onCancel={onCancel}
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Footer */}
      {!loading && !error && appointments.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredAppointments.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {appointments.length}
            </span>{" "}
            appointments
          </p>

          <p className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} />
            Schedule view includes all appointment statuses
          </p>
        </div>
      )}
    </section>
  );
}
