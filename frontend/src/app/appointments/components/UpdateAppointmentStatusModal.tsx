"use client";

import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Stethoscope,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import api from "@/lib/axios";

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

type StatusAppointment = {
  id: string;
  appointmentNumber: string;
  status: AppointmentStatus;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  patientName: string;
  doctorName: string;
};

type UpdateAppointmentStatusModalProps = {
  appointment: StatusAppointment;
  onSuccess: () => void;
  onClose: () => void;
};

const statusOptions: {
  value: AppointmentStatus;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  selected: string;
}[] = [
  {
    value: "SCHEDULED",
    label: "Scheduled",
    description: "The visit is planned and awaiting confirmation.",
    icon: CalendarDays,
    accent: "text-blue-700",
    selected: "border-blue-300 bg-blue-50/70 ring-2 ring-blue-600/10",
  },
  {
    value: "CONFIRMED",
    label: "Confirmed",
    description: "The visit is confirmed with the patient and care team.",
    icon: CheckCircle2,
    accent: "text-emerald-700",
    selected: "border-emerald-300 bg-emerald-50/70 ring-2 ring-emerald-600/10",
  },
  {
    value: "COMPLETED",
    label: "Completed",
    description: "The patient has completed this visit.",
    icon: Check,
    accent: "text-slate-600",
    selected: "border-slate-400 bg-slate-50 ring-2 ring-slate-500/10",
  },
  {
    value: "NO_SHOW",
    label: "No show",
    description: "The patient did not arrive for the visit.",
    icon: CircleDashed,
    accent: "text-amber-700",
    selected: "border-amber-300 bg-amber-50/70 ring-2 ring-amber-600/10",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
    description: "Remove this visit from the active schedule.",
    icon: XCircle,
    accent: "text-rose-700",
    selected: "border-rose-300 bg-rose-50/70 ring-2 ring-rose-600/10",
  },
];

const terminalStatuses: AppointmentStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

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

export default function UpdateAppointmentStatusModal({
  appointment,
  onSuccess,
  onClose,
}: UpdateAppointmentStatusModalProps) {
  const [nextStatus, setNextStatus] = useState<AppointmentStatus>(
    appointment.status,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isSavingRef = useRef(false);

  const cannotUpdate = terminalStatuses.includes(appointment.status);
  const selectedOption = statusOptions.find(
    (option) => option.value === nextStatus,
  );
  const SelectedStatusIcon = selectedOption?.icon;

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

  const handleSubmit = async () => {
    if (cannotUpdate || nextStatus === appointment.status) return;

    setError("");

    try {
      isSavingRef.current = true;
      setLoading(true);

      await api.patch(`/appointments/${appointment.id}/status`, {
        status: nextStatus,
      });

      onSuccess();
    } catch (err: unknown) {
      console.error("Failed to update appointment status:", err);

      if (isAxiosError(err)) {
        setError(
          err.response?.data?.message || "Failed to update appointment status.",
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
        aria-label="Close status update dialog"
        onClick={onClose}
        disabled={loading}
        className="absolute inset-0 h-full w-full bg-slate-950/55 backdrop-blur-[3px] disabled:cursor-wait"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-appointment-status-title"
        aria-describedby="update-appointment-status-description"
        className="relative z-10 flex max-h-screen w-full max-w-2xl flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 sm:max-h-[calc(100vh-2.5rem)]"
      >
        <header className="relative overflow-hidden bg-[#102c49] px-5 py-5 text-white sm:px-7 sm:py-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:32px_32px]"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/10 bg-white/[0.08] text-cyan-100">
                <Activity size={21} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100/75">
                  Care <span className="px-1 text-white/30">/</span> Visit progress
                </p>
                <h2 id="update-appointment-status-title" className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                  Update appointment status
                </h2>
                <p className="mt-1 truncate text-sm text-blue-100/70">
                  Reference {appointment.appointmentNumber}
                </p>
              </div>
            </div>

            <button
              type="button"
              ref={closeButtonRef}
              aria-label="Close status update dialog"
              onClick={onClose}
              disabled={loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 bg-white/[0.06] text-blue-100 transition hover:bg-white/[0.14] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:space-y-6 sm:p-7">
          <section className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2">
            <div className="flex min-w-0 items-start gap-2.5 bg-slate-50/80 p-3.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-white text-slate-500">
                <UserRound size={15} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-slate-400">Patient</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-800">{appointment.patientName}</p>
              </div>
            </div>
            <div className="flex min-w-0 items-start gap-2.5 bg-slate-50/80 p-3.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-white text-slate-500">
                <Stethoscope size={15} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-slate-400">Care provider</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-800">{appointment.doctorName}</p>
              </div>
            </div>
            <div className="flex min-w-0 items-start gap-2.5 bg-slate-50/80 p-3.5 sm:col-span-2">
              <Clock3 size={15} className="mt-0.5 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-slate-400">Scheduled visit</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {formatDate(appointment.appointmentDate)} · {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
                </p>
              </div>
            </div>
          </section>

          {cannotUpdate ? (
            <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 px-4 py-3.5">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-700" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  This status can no longer be changed
                </p>
                <p id="update-appointment-status-description" className="mt-1 text-xs leading-5 text-amber-800">
                  {appointment.status === "CANCELLED"
                    ? "Cancelled appointments are locked."
                    : appointment.status === "COMPLETED"
                      ? "Completed appointments are locked."
                      : "No-show appointments are locked."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Choose a status</h3>
                <p id="update-appointment-status-description" className="mt-1 text-sm text-slate-500">
                  Select the latest stage for this visit.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = nextStatus === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setNextStatus(option.value);
                        setError("");
                      }}
                      disabled={loading}
                      className={`flex min-h-20 items-start gap-3 border p-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 ${
                        selected
                          ? option.selected
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center bg-white ${option.accent}`}>
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-800">{option.label}</span>
                          {selected && <Check size={14} className={option.accent} />}
                        </span>
                        <span className="mt-1 block text-[11px] leading-4 text-slate-500">{option.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {!cannotUpdate && terminalStatuses.includes(nextStatus) && (
            <p className={`flex items-start gap-2 border px-3.5 py-3 text-xs leading-5 ${nextStatus === "CANCELLED" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              This is a final status. It cannot be changed again after you confirm.
            </p>
          )}

          {error && (
            <p role="alert" className="flex items-start gap-2.5 border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="hidden text-xs text-slate-400 sm:block">
            {cannotUpdate
              ? "This visit is read-only."
              : `Current status: ${statusOptions.find((option) => option.value === appointment.status)?.label ?? appointment.status}`}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Close
            </button>
            {!cannotUpdate && (
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={loading || nextStatus === appointment.status}
                className={`inline-flex h-10 items-center justify-center gap-2 px-4 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  nextStatus === "CANCELLED"
                    ? "bg-rose-700 shadow-rose-900/10 hover:bg-rose-800 focus-visible:ring-rose-600/20"
                    : "bg-blue-700 shadow-blue-900/10 hover:bg-blue-800 focus-visible:ring-blue-600/15"
                }`}
              >
                {loading ? "Saving status…" : nextStatus === "CANCELLED" ? "Confirm cancellation" : "Save status"}
                {!loading && SelectedStatusIcon && <SelectedStatusIcon size={16} />}
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}
