
"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CalendarPlus2,
  Check,
  Clock3,
  HeartPulse,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import AppointmentForm from "./components/AppointmentForm";
import AppointmentTable from "./components/AppointmentTable";
import AppointmentDetails from "./components/AppointmentDetails";
import RescheduleAppointmentModal from "./components/RescheduleAppointmentModal";
import CancelAppointment from "./components/CancelAppointment";
import UpdateAppointmentStatusModal, {
  type AppointmentStatus,
} from "./components/UpdateAppointmentStatusModal";

type AppointmentSummary = {
  id: string;
  appointmentNumber: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
};

type CancelAppointmentSummary = {
  id: string;
  appointmentNumber: string;
  status: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  patientName: string;
  doctorName: string;
};

type StatusAppointmentSummary = {
  id: string;
  appointmentNumber: string;
  status: AppointmentStatus;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  patientName: string;
  doctorName: string;
};

export default function AppointmentsPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);

  const [rescheduleAppointment, setRescheduleAppointment] =
    useState<AppointmentSummary | null>(null);

  const [cancelAppointment, setCancelAppointment] =
    useState<CancelAppointmentSummary | null>(null);

  const [statusAppointment, setStatusAppointment] =
    useState<StatusAppointmentSummary | null>(null);

  // Create Appointment
  const handleAppointmentCreated = () => {
    setShowForm(false);
    setRefreshKey((previous) => previous + 1);
  };

  // View Appointment Details
  const handleViewAppointment = (appointment: { id: string }) => {
    setSelectedAppointmentId(appointment.id);
  };

  // Open Reschedule Modal
  const handleRescheduleAppointment = (
    appointment: AppointmentSummary,
  ) => {
    setRescheduleAppointment(appointment);
  };

  // Successfully Rescheduled
  const handleAppointmentRescheduled = () => {
    setRescheduleAppointment(null);
    setRefreshKey((previous) => previous + 1);
  };

  // Successfully Cancelled
  const handleAppointmentCancelled = () => {
    setCancelAppointment(null);
    setRefreshKey((previous) => previous + 1);
  };

  // Successfully Updated Status
  const handleAppointmentStatusUpdated = () => {
    setStatusAppointment(null);
    setRefreshKey((previous) => previous + 1);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
              <span className="h-1.5 w-1.5 bg-emerald-600" />
              Care <span className="text-slate-300">/</span> Scheduling
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Appointments
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Keep every visit moving smoothly, from the first booking to the
              final follow-up.
            </p>
          </div>

          <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <Clock3 size={16} className="text-emerald-700" />
            <span>One clear view of your care schedule</span>
          </div>
        </header>

        <section className="relative isolate overflow-hidden bg-[#12392f] p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8 lg:p-9">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -right-24 -top-40 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />

            <div className="absolute -bottom-44 left-1/4 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />

            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:36px_36px]" />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100">
                <HeartPulse size={14} />
                Care coordination
              </div>

              <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                Thoughtful care starts with a well-run schedule.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100/75 sm:text-base">
                Bring patients and providers together with a clear, organized
                view of every visit.
              </p>

              <button
                type="button"
                onClick={() => setShowForm((previous) => !previous)}
                aria-expanded={showForm}
                aria-controls="appointment-form"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 bg-white px-4 text-sm font-semibold text-[#12392f] shadow-sm transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
              >
                {showForm ? (
                  <CalendarDays size={17} />
                ) : (
                  <CalendarPlus2 size={17} />
                )}

                {showForm
                  ? "Close booking form"
                  : "Schedule an appointment"}

                {!showForm && <ArrowUpRight size={16} />}
              </button>
            </div>

            <div className="border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-11 w-11 items-center justify-center bg-teal-200/10 text-teal-100">
                  <CalendarDays size={21} />
                </span>

                <span className="inline-flex items-center gap-1.5 bg-emerald-300/10 px-2.5 py-1 text-[11px] font-medium text-emerald-100">
                  <Check size={13} />
                  Organized care
                </span>
              </div>

              <p className="mt-5 text-sm font-semibold text-white">
                Your appointment desk
              </p>

              <p className="mt-1.5 text-sm leading-6 text-emerald-100/70">
                Review upcoming visits, follow appointment status, and keep
                your team in sync.
              </p>

              <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-emerald-100/65">
                <span className="h-1.5 w-1.5 bg-teal-300" />
                A calmer way to coordinate each visit
              </div>
            </div>
          </div>
        </section>

        {/* Create Appointment Form */}
        <div id="appointment-form">
          {showForm && (
            <AppointmentForm
              onSuccess={handleAppointmentCreated}
              onCancel={() => setShowForm(false)}
            />
          )}
        </div>

        {/* Appointment Details */}
        {selectedAppointmentId && (
          <AppointmentDetails
            appointmentId={selectedAppointmentId}
            onClose={() => setSelectedAppointmentId(null)}
          />
        )}

        {/* Reschedule Appointment */}
        {rescheduleAppointment && (
          <RescheduleAppointmentModal
            appointment={rescheduleAppointment}
            onClose={() => setRescheduleAppointment(null)}
            onSuccess={handleAppointmentRescheduled}
          />
        )}

        {/* Cancel Appointment */}
        {cancelAppointment && (
          <CancelAppointment
            appointment={cancelAppointment}
            onClose={() => setCancelAppointment(null)}
            onSuccess={handleAppointmentCancelled}
          />
        )}

        {/* Update Appointment Status */}
        {statusAppointment && (
          <UpdateAppointmentStatusModal
            appointment={statusAppointment}
            onClose={() => setStatusAppointment(null)}
            onSuccess={handleAppointmentStatusUpdated}
          />
        )}

        {/* Appointment List */}
        <AppointmentTable
          key={refreshKey}
          onView={handleViewAppointment}
          onReschedule={handleRescheduleAppointment}
          onCancel={(appointment) => {
            setCancelAppointment({
              id: appointment.id,
              appointmentNumber: appointment.appointmentNumber,
              status: appointment.status,
              appointmentDate: appointment.appointmentDate,
              startTime: appointment.startTime,
              endTime: appointment.endTime,
              patientName: appointment.patient
                ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                : `Patient ${appointment.patientId}`,
              doctorName: appointment.doctor
                ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                : `Doctor ${appointment.doctorId}`,
            });
          }}
          onUpdateStatus={(appointment) => {
            setStatusAppointment({
              id: appointment.id,
              appointmentNumber: appointment.appointmentNumber,
              status: appointment.status,
              appointmentDate: appointment.appointmentDate,
              startTime: appointment.startTime,
              endTime: appointment.endTime,
              patientName: appointment.patient
                ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                : `Patient ${appointment.patientId}`,
              doctorName: appointment.doctor
                ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                : `Doctor ${appointment.doctorId}`,
            });
          }}
        />
      </div>
    </DashboardLayout>
  );
}
