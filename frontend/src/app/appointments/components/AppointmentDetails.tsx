"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { isAxiosError } from "axios";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Hash,
  Mail,
  Phone,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import api from "@/lib/axios";

type Patient = {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string | null;
};

type Doctor = {
  id: string;
  doctorNumber: string;
  firstName: string;
  lastName: string;
  specialization: string;
  phone: string;
  email: string | null;
};

type Appointment = {
  id: string;
  appointmentNumber: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  patient: Patient;
  doctor: Doctor;
};

type AppointmentDetailsProps = {
  appointmentId: string;
  onClose: () => void;
};

const formatDate = (value: string) => {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

const getStatusLabel = (status: string) =>
  status.toUpperCase() === "NO_SHOW"
    ? "No show"
    : status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

function DetailItem({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-slate-50 text-slate-500">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <div className="mt-1 break-words text-sm font-medium text-slate-800">{children}</div>
      </div>
    </div>
  );
}

export default function AppointmentDetails({
  appointmentId,
  onClose,
}: AppointmentDetailsProps) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const getAppointment = useCallback(async () => {
    const response = await api.get(`/appointments/${appointmentId}`);
    return (response.data?.data ?? null) as Appointment | null;
  }, [appointmentId]);

  useEffect(() => {
    let active = true;

    getAppointment()
      .then((data) => {
        if (active) setAppointment(data);
      })
      .catch((err: unknown) => {
        if (!active) return;

        console.error("Failed to fetch appointment details:", err);
        setError(
          isAxiosError(err)
            ? err.response?.data?.message || "Failed to load appointment details."
            : "An unexpected error occurred.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [getAppointment]);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = closeButtonRef.current?.closest<HTMLElement>("[role='dialog']");
      const focusableElements = dialog?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
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

  const patient = appointment?.patient;
  const doctor = appointment?.doctor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-5 lg:p-8">
      <button
        type="button"
        aria-label="Close appointment details"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-slate-950/55 backdrop-blur-[3px]"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-details-title"
        className="relative z-10 flex max-h-screen w-full max-w-5xl flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 sm:max-h-[calc(100vh-2.5rem)]"
      >
        <header className="relative overflow-hidden bg-[#12392f] px-5 py-5 text-white sm:px-7 sm:py-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:32px_32px]"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/10 bg-white/[0.08] text-teal-100 sm:h-12 sm:w-12">
                <CalendarDays size={21} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100/75">
                  Care <span className="px-1 text-white/30">/</span> Visit overview
                </p>
                <h2
                  id="appointment-details-title"
                  className="mt-1 truncate text-xl font-semibold tracking-tight sm:text-2xl"
                >
                  {loading ? "Appointment details" : appointment?.appointmentNumber || "Appointment details"}
                </h2>
                <p className="mt-1 text-sm text-emerald-100/70">
                  {loading
                    ? "Loading visit information…"
                    : patient
                      ? `${patient.firstName} ${patient.lastName}`
                      : "Appointment information"}
                </p>
              </div>
            </div>

            <button
              type="button"
              ref={closeButtonRef}
              aria-label="Close details"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 bg-white/[0.06] text-emerald-100 transition hover:bg-white/[0.14] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200"
            >
              <X size={18} />
            </button>
          </div>

          {!loading && appointment && (
            <div className="relative mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(appointment.status)}`}>
                <span className="h-1.5 w-1.5 bg-current" />
                {getStatusLabel(appointment.status)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-100/70">
                <Hash size={13} />
                Record ID {appointment.id}
              </span>
            </div>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-6 py-12">
              <span className="flex h-12 w-12 items-center justify-center bg-emerald-50 text-emerald-700">
                <CalendarDays size={22} className="animate-pulse" />
              </span>
              <p className="text-sm font-medium text-slate-700">Loading appointment</p>
              <p className="text-xs text-slate-400">Gathering the visit and care team details.</p>
            </div>
          ) : error || !appointment ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center bg-rose-50 text-rose-600">
                <AlertCircle size={22} />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">
                {error ? "Couldn’t load this appointment" : "Appointment not found"}
              </h3>
              <p role={error ? "alert" : undefined} className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                {error || "This visit may have been removed or is no longer available."}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 inline-flex h-10 items-center justify-center bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/15"
              >
                Back to appointments
              </button>
            </div>
          ) : (
            <div className="space-y-5 p-5 sm:space-y-6 sm:p-7">
              <section aria-labelledby="visit-information-heading">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <h3 id="visit-information-heading" className="text-sm font-semibold text-slate-900">
                      Visit information
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">The details and timing for this appointment.</p>
                  </div>
                </div>

                <div className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-3">
                  <div className="bg-slate-50/70 p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <CalendarDays size={15} className="text-emerald-700" />
                      Appointment date
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatDate(appointment.appointmentDate)}
                    </p>
                  </div>
                  <div className="bg-slate-50/70 p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Clock3 size={15} className="text-emerald-700" />
                      Appointment time
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
                    </p>
                  </div>
                  <div className="bg-slate-50/70 p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Hash size={15} className="text-emerald-700" />
                      Appointment number
                    </div>
                    <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                      {appointment.appointmentNumber}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center bg-emerald-50 text-emerald-700">
                        <FileText size={15} />
                      </span>
                      <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                        Reason for visit
                      </h4>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                      {appointment.reason || "No reason provided."}
                    </p>
                  </div>
                  <div className="border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center bg-slate-100 text-slate-600">
                        <FileText size={15} />
                      </span>
                      <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                        Additional notes
                      </h4>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                      {appointment.notes || "No additional notes."}
                    </p>
                  </div>
                </div>
              </section>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="border border-slate-200 bg-white">
                  <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700">
                      <UserRound size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                        Patient
                      </p>
                      <h3 className="truncate text-sm font-semibold text-slate-900">
                        {patient ? `${patient.firstName} ${patient.lastName}` : "Patient details unavailable"}
                      </h3>
                    </div>
                  </div>
                  <div className="grid gap-x-4 gap-y-5 p-4 sm:grid-cols-2 sm:p-5">
                    <DetailItem icon={Hash} label="Patient number">
                      {patient?.patientNumber || "Not available"}
                    </DetailItem>
                    <DetailItem icon={UserRound} label="Gender">
                      {patient?.gender || "Not provided"}
                    </DetailItem>
                    <DetailItem icon={CalendarDays} label="Date of birth">
                      {patient?.dateOfBirth ? formatDate(patient.dateOfBirth) : "Not provided"}
                    </DetailItem>
                    <DetailItem icon={Phone} label="Phone">
                      {patient?.phone ? (
                        <a href={`tel:${patient.phone}`} className="transition hover:text-emerald-700">
                          {patient.phone}
                        </a>
                      ) : "Not provided"}
                    </DetailItem>
                    <div className="sm:col-span-2">
                      <DetailItem icon={Mail} label="Email">
                        {patient?.email ? (
                          <a href={`mailto:${patient.email}`} className="transition hover:text-emerald-700">
                            {patient.email}
                          </a>
                        ) : "Not provided"}
                      </DetailItem>
                    </div>
                  </div>
                </section>

                <section className="border border-slate-200 bg-white">
                  <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-teal-50 text-teal-700">
                      <Stethoscope size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-700">
                        Care provider
                      </p>
                      <h3 className="truncate text-sm font-semibold text-slate-900">
                        {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "Doctor details unavailable"}
                      </h3>
                    </div>
                  </div>
                  <div className="grid gap-x-4 gap-y-5 p-4 sm:grid-cols-2 sm:p-5">
                    <DetailItem icon={Hash} label="Doctor number">
                      {doctor?.doctorNumber || "Not available"}
                    </DetailItem>
                    <DetailItem icon={Stethoscope} label="Specialization">
                      {doctor?.specialization || "Not provided"}
                    </DetailItem>
                    <DetailItem icon={Phone} label="Phone">
                      {doctor?.phone ? (
                        <a href={`tel:${doctor.phone}`} className="transition hover:text-emerald-700">
                          {doctor.phone}
                        </a>
                      ) : "Not provided"}
                    </DetailItem>
                    <div className="sm:col-span-2">
                      <DetailItem icon={Mail} label="Email">
                        {doctor?.email ? (
                          <a href={`mailto:${doctor.email}`} className="transition hover:text-emerald-700">
                            {doctor.email}
                          </a>
                        ) : "Not provided"}
                      </DetailItem>
                    </div>
                  </div>
                </section>
              </div>

              <footer className="flex flex-col gap-1 border-t border-slate-100 pt-4 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <span>Created {formatDateTime(appointment.createdAt)}</span>
                <span>Last updated {formatDateTime(appointment.updatedAt)}</span>
              </footer>
            </div>
          )}
        </div>

        {!loading && appointment && (
          <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 sm:px-7">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/15"
            >
              <CheckCircle2 size={16} />
              Done
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
