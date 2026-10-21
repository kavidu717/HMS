"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  Check,
  Clock3,
  ShieldCheck,
  X,
} from "lucide-react";

import api from "@/lib/axios";

type RescheduleAppointmentModalProps = {
  appointment: {
    id: string;
    appointmentNumber: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    status: string;
  };
  onSuccess: () => void;
  onClose: () => void;
};

const getDateInputValue = (date: string) => (date ? date.slice(0, 10) : "");

const formatDate = (value: string) => {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatTime = (value: string) => {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;

  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};

const getStatusStyle = (status: string) => {
  switch (status.toUpperCase()) {
    case "SCHEDULED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-700/15";
    case "CONFIRMED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-700/15";
    case "COMPLETED":
      return "bg-slate-100 text-slate-600 ring-slate-600/15";
    case "CANCELLED":
      return "bg-rose-50 text-rose-700 ring-rose-700/15";
    case "NO_SHOW":
      return "bg-amber-50 text-amber-700 ring-amber-700/15";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-600/15";
  }
};

export default function RescheduleAppointmentModal({
  appointment,
  onSuccess,
  onClose,
}: RescheduleAppointmentModalProps) {
  const [appointmentDate, setAppointmentDate] = useState(
    getDateInputValue(appointment.appointmentDate),
  );
  const [startTime, setStartTime] = useState(appointment.startTime.slice(0, 5));
  const [endTime, setEndTime] = useState(appointment.endTime.slice(0, 5));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isSavingRef = useRef(false);

  const cannotReschedule = ["CANCELLED", "COMPLETED", "NO_SHOW"].includes(
    appointment.status.toUpperCase(),
  );

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSavingRef.current) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = closeButtonRef.current?.closest<HTMLElement>("[role='dialog']");
      const focusableElements = dialog?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])",
      );
      const firstElement = focusableElements?.[0];
      const lastElement = focusableElements?.[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (startTime >= endTime) {
      setError("End time must be later than start time.");
      return;
    }

    try {
      isSavingRef.current = true;
      setLoading(true);

      await api.patch(`/appointments/${appointment.id}/reschedule`, {
        appointmentDate,
        startTime,
        endTime,
      });

      onSuccess();
    } catch (err: unknown) {
      console.error("Failed to reschedule appointment:", err);

      if (isAxiosError(err)) {
        setError(
          err.response?.data?.message || "Failed to reschedule appointment.",
        );
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      isSavingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-5 lg:p-8">
      <button
        type="button"
        aria-label="Close reschedule dialog"
        onClick={onClose}
        disabled={loading}
        className="absolute inset-0 h-full w-full bg-slate-950/55 backdrop-blur-[3px] disabled:cursor-wait"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-title"
        className="relative z-10 flex max-h-screen w-full max-w-2xl flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 sm:max-h-[calc(100vh-2.5rem)]"
      >
        <header className="relative overflow-hidden bg-[#12392f] px-5 py-5 text-white sm:px-7 sm:py-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:32px_32px]"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/10 bg-white/[0.08] text-teal-100">
                <CalendarClock size={21} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100/75">
                  Care <span className="px-1 text-white/30">/</span> Schedule change
                </p>
                <h2 id="reschedule-title" className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                  {cannotReschedule ? "Appointment update" : "Reschedule appointment"}
                </h2>
                <p className="mt-1 truncate text-sm text-emerald-100/70">
                  Reference {appointment.appointmentNumber}
                </p>
              </div>
            </div>

            <button
              type="button"
              ref={closeButtonRef}
              aria-label="Close reschedule dialog"
              onClick={onClose}
              disabled={loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 bg-white/[0.06] text-emerald-100 transition hover:bg-white/[0.14] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {cannotReschedule ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center sm:py-16">
            <span className="flex h-12 w-12 items-center justify-center bg-amber-50 text-amber-700">
              <AlertCircle size={22} />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              This appointment can’t be rescheduled
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Its current status is <span className="font-semibold text-slate-700">{appointment.status.replaceAll("_", " ").toLowerCase()}</span>. Completed, cancelled, or missed visits can’t be moved to a new time.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex h-10 items-center justify-center bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/15"
            >
              Back to appointments
            </button>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:space-y-6 sm:p-7">
              <section className="border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Current appointment
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatDate(appointment.appointmentDate)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusStyle(appointment.status)}`}>
                    <span className="h-1.5 w-1.5 bg-current" />
                    {appointment.status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())}
                  </span>
                </div>
              </section>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">Choose a new time</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Select a new date and visit window for this appointment.
                </p>
              </div>

              <form id="reschedule-form" onSubmit={handleSubmit} className="space-y-5">
                <label htmlFor="reschedule-date" className="block">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <CalendarDays size={14} className="text-slate-400" />
                    New appointment date
                  </span>
                  <input
                    id="reschedule-date"
                    type="date"
                    value={appointmentDate}
                    onChange={(event) => {
                      setAppointmentDate(event.target.value);
                      setError("");
                    }}
                    className="mt-2 h-12 w-full border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    required
                  />
                </label>

                <div>
                  <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Clock3 size={14} className="text-slate-400" />
                    New appointment time
                  </p>
                  <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                    <label htmlFor="reschedule-start-time" className="block">
                      <span className="text-[11px] font-medium text-slate-500">Starts at</span>
                      <input
                        id="reschedule-start-time"
                        type="time"
                        value={startTime}
                        onChange={(event) => {
                          setStartTime(event.target.value);
                          setError("");
                        }}
                        className="mt-2 h-12 w-full border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        required
                      />
                    </label>
                    <span aria-hidden="true" className="hidden pt-5 text-slate-300 sm:block">
                      <ArrowRight size={17} />
                    </span>
                    <label htmlFor="reschedule-end-time" className="block">
                      <span className="text-[11px] font-medium text-slate-500">Ends at</span>
                      <input
                        id="reschedule-end-time"
                        type="time"
                        value={endTime}
                        onChange={(event) => {
                          setEndTime(event.target.value);
                          setError("");
                        }}
                        className="mt-2 h-12 w-full border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        required
                      />
                    </label>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="flex items-start gap-2.5 border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-700">
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />
                    {error}
                  </p>
                )}

                <p className="flex items-start gap-2 border border-emerald-100 bg-emerald-50/70 px-3.5 py-3 text-xs leading-5 text-emerald-800">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-700" />
                  The care team’s availability will be checked before the new time is saved.
                </p>
              </form>
            </div>

            <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
                <Check size={13} />
                Changes take effect after confirmation
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="inline-flex h-10 items-center justify-center border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="reschedule-form"
                  disabled={loading}
                  className="inline-flex h-10 items-center justify-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Saving new time…" : "Confirm new time"}
                  {!loading && <CalendarClock size={16} />}
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
