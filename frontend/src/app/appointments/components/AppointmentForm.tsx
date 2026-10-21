"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { isAxiosError } from "axios";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Hash,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";

import api from "@/lib/axios";

type AppointmentFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

type AppointmentFormData = {
  appointmentNumber: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  notes: string;
};

const initialFormData: AppointmentFormData = {
  appointmentNumber: "",
  patientId: "",
  doctorId: "",
  appointmentDate: "",
  startTime: "",
  endTime: "",
  reason: "",
  notes: "",
};

const inputClassName =
  "mt-2 h-11 w-full border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const labelClassName = "text-xs font-semibold text-slate-700";

export default function AppointmentForm({
  onSuccess,
  onCancel,
}: AppointmentFormProps) {
  const [formData, setFormData] = useState<AppointmentFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (formData.startTime >= formData.endTime) {
      setError("End time must be later than start time.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        appointmentNumber: formData.appointmentNumber.trim(),
        patientId: formData.patientId.trim(),
        doctorId: formData.doctorId.trim(),
        appointmentDate: formData.appointmentDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        reason: formData.reason.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      const response = await api.post("/appointments", payload);

      setSuccess(response.data?.message || "Appointment created successfully.");
      setFormData(initialFormData);
      onSuccess?.();
    } catch (err: unknown) {
      console.error("Failed to create appointment:", err);

      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to create appointment.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025]">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-blue-50 text-blue-700">
            <CalendarDays size={19} />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-700">
              New booking
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
              Schedule an appointment
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">
              Add the visit details below to place it on the care schedule.
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            aria-label="Close appointment form"
            onClick={onCancel}
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-x-5 gap-y-5 px-5 py-6 sm:grid-cols-2 sm:px-6">
          <label className="block">
            <span className="inline-flex items-center gap-2">
              <Hash size={14} className="text-slate-400" />
              <span className={labelClassName}>Appointment number</span>
            </span>
            <input
              id="appointmentNumber"
              name="appointmentNumber"
              type="text"
              value={formData.appointmentNumber}
              onChange={handleChange}
              placeholder="e.g. APT-2026-004"
              maxLength={20}
              autoComplete="off"
              className={inputClassName}
              required
            />
          </label>

          <label className="block">
            <span className="inline-flex items-center gap-2">
              <UserRound size={14} className="text-slate-400" />
              <span className={labelClassName}>Patient ID</span>
            </span>
            <input
              id="patientId"
              name="patientId"
              type="text"
              inputMode="numeric"
              pattern="[0-9]+"
              value={formData.patientId}
              onChange={handleChange}
              placeholder="Enter the patient ID"
              className={inputClassName}
              required
            />
          </label>

          <label className="block">
            <span className="inline-flex items-center gap-2">
              <Stethoscope size={14} className="text-slate-400" />
              <span className={labelClassName}>Doctor ID</span>
            </span>
            <input
              id="doctorId"
              name="doctorId"
              type="text"
              inputMode="numeric"
              pattern="[0-9]+"
              value={formData.doctorId}
              onChange={handleChange}
              placeholder="Enter the doctor ID"
              className={inputClassName}
              required
            />
          </label>

          <label className="block">
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={14} className="text-slate-400" />
              <span className={labelClassName}>Appointment date</span>
            </span>
            <input
              id="appointmentDate"
              name="appointmentDate"
              type="date"
              value={formData.appointmentDate}
              onChange={handleChange}
              className={inputClassName}
              required
            />
          </label>

          <label className="block">
            <span className="inline-flex items-center gap-2">
              <Clock3 size={14} className="text-slate-400" />
              <span className={labelClassName}>Start time</span>
            </span>
            <input
              id="startTime"
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleChange}
              className={inputClassName}
              required
            />
          </label>

          <label className="block">
            <span className="inline-flex items-center gap-2">
              <Clock3 size={14} className="text-slate-400" />
              <span className={labelClassName}>End time</span>
            </span>
            <input
              id="endTime"
              name="endTime"
              type="time"
              value={formData.endTime}
              onChange={handleChange}
              className={inputClassName}
              required
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="inline-flex items-center gap-2">
              <ClipboardList size={14} className="text-slate-400" />
              <span className={labelClassName}>Reason for visit</span>
              <span className="text-xs font-normal text-slate-400">Optional</span>
            </span>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Briefly describe the reason for this appointment"
              maxLength={5000}
              rows={3}
              className="mt-2 min-h-24 w-full resize-y border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="inline-flex items-center gap-2">
              <FileText size={14} className="text-slate-400" />
              <span className={labelClassName}>Additional notes</span>
              <span className="text-xs font-normal text-slate-400">Optional</span>
            </span>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add anything the care team should know"
              maxLength={5000}
              rows={3}
              className="mt-2 min-h-24 w-full resize-y border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2.5 border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-700 sm:col-span-2"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
          {success && (
            <p
              role="status"
              className="flex items-start gap-2.5 border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm leading-5 text-emerald-700 sm:col-span-2"
            >
              <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
              {success}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-slate-400">Fields marked as optional can be completed later.</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="inline-flex h-10 items-center justify-center border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-900/10 transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating appointment…" : "Confirm appointment"}
              {!loading && <CalendarDays size={16} />}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
