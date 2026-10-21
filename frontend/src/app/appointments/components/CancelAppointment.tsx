"use client";

import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import {
  AlertCircle,
  CalendarDays,
  CalendarX2,
  Clock3,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";

import api from "@/lib/axios";

type CancelAppointmentProps = {
  appointment: {
    id: string;
    appointmentNumber: string;
    status: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    patientName: string;
    doctorName: string;
  };
  onSuccess: () => void;
  onClose: () => void;
};

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

const formatStatus = (status: string) =>
  status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function CancelAppointment({
  appointment,
  onSuccess,
  onClose,
}: CancelAppointmentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isCancelingRef = useRef(false);

  const cannotCancel = ["CANCELLED", "COMPLETED", "NO_SHOW"].includes(
    appointment.status.toUpperCase(),
  );

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isCancelingRef.current) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = closeButtonRef.current?.closest<HTMLElement>(
        "[role='dialog'], [role='alertdialog']",
      );
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

  const handleCancel = async () => {
    setError("");

    if (cannotCancel) {
      setError(
        `This appointment cannot be cancelled because its status is ${formatStatus(appointment.status)}.`,
      );
      return;
    }

    try {
      isCancelingRef.current = true;
      setLoading(true);

      await api.patch(`/appointments/${appointment.id}/cancel`);
      onSuccess();
    } catch (err: unknown) {
      console.error("Failed to cancel appointment:", err);

      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to cancel appointment.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      isCancelingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-5 lg:p-8">
      <button
        type="button"
        aria-label="Close cancellation dialog"
        onClick={onClose}
        disabled={loading}
        className="absolute inset-0 h-full w-full bg-slate-950/55 backdrop-blur-[3px] disabled:cursor-wait"
      />

      <section
        role={cannotCancel ? "dialog" : "alertdialog"}
        aria-modal="true"
        aria-labelledby="cancel-appointment-title"
        aria-describedby={
          cannotCancel ? undefined : "cancel-appointment-description"
        }
        className="relative z-10 flex max-h-screen w-full max-w-xl flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 sm:max-h-[calc(100vh-2.5rem)]"
      >
        <header className="relative overflow-hidden bg-[#12392f] px-5 py-5 text-white sm:px-7 sm:py-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:32px_32px]"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-rose-200/15 bg-rose-300/10 text-rose-100">
                <CalendarX2 size={21} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-100/75">
                  Care <span className="px-1 text-white/30">/</span> Appointment change
                </p>
                <h2 id="cancel-appointment-title" className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                  {cannotCancel ? "Appointment update" : "Cancel appointment?"}
                </h2>
                <p className="mt-1 truncate text-sm text-emerald-100/70">
                  Reference {appointment.appointmentNumber}
                </p>
              </div>
            </div>

            <button
              type="button"
              ref={closeButtonRef}
              aria-label="Close cancellation dialog"
              onClick={onClose}
              disabled={loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 bg-white/[0.06] text-emerald-100 transition hover:bg-white/[0.14] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
          {cannotCancel ? (
            <div className="mb-5 flex items-start gap-3 border border-amber-200 bg-amber-50 px-4 py-3.5">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-700" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  This appointment can’t be cancelled
                </p>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Its current status is {formatStatus(appointment.status)}. Completed, cancelled, or missed visits can’t be cancelled again.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-5 flex items-start gap-3 border border-rose-200 bg-rose-50 px-4 py-3.5">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-700" />
              <div>
                <p className="text-sm font-semibold text-rose-900">
                  Please confirm this cancellation
                </p>
                <p id="cancel-appointment-description" className="mt-1 text-xs leading-5 text-rose-800">
                  The appointment will be marked as cancelled and removed from the active schedule.
                </p>
              </div>
            </div>
          )}

          <div className="border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Appointment summary
              </p>
              <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                <span className="h-1.5 w-1.5 bg-slate-400" />
                {formatStatus(appointment.status)}
              </span>
            </div>

            <div className="grid gap-px bg-slate-100 sm:grid-cols-2">
              <div className="flex min-w-0 items-start gap-2.5 bg-white p-4">
                <UserRound size={15} className="mt-0.5 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-slate-400">Patient</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-800">{appointment.patientName}</p>
                </div>
              </div>

              <div className="flex min-w-0 items-start gap-2.5 bg-white p-4">
                <Stethoscope size={15} className="mt-0.5 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-slate-400">Care provider</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-800">{appointment.doctorName}</p>
                </div>
              </div>

              <div className="flex min-w-0 items-start gap-2.5 bg-white p-4">
                <CalendarDays size={15} className="mt-0.5 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-slate-400">Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{formatDate(appointment.appointmentDate)}</p>
                </div>
              </div>

              <div className="flex min-w-0 items-start gap-2.5 bg-white p-4">
                <Clock3 size={15} className="mt-0.5 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-slate-400">Time</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 flex items-start gap-2.5 border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="hidden text-xs text-slate-400 sm:block">
            {cannotCancel ? "Review the status before returning to the schedule." : "You can’t undo this from the appointment list."}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Keep appointment
            </button>
            {!cannotCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="inline-flex h-10 items-center justify-center gap-2 bg-rose-700 px-4 text-sm font-semibold text-white shadow-sm shadow-rose-900/10 transition hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CalendarX2 size={16} />
                {loading ? "Cancelling appointment…" : "Confirm cancellation"}
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}
