"use client";

import { useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  ClipboardPlus,
  FilePlus2,
  Loader2,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
}

interface CreateMedicalRecordFormProps {
  patients: Patient[];
  initialPatientId?: string;
  onSuccess: (patientId: string) => void;
  onCancel: () => void;
}

interface CreateMedicalRecordResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    patientId: string;
  };
}

export default function CreateMedicalRecordForm({
  patients,
  initialPatientId = "",
  onSuccess,
  onCancel,
}: CreateMedicalRecordFormProps) {
  const [patientId, setPatientId] = useState(initialPatientId);
  const [diagnosis, setDiagnosis] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const [recordedAt, setRecordedAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!patientId) {
      setError("Please select a patient.");
      return;
    }

    if (
      !diagnosis.trim() &&
      !symptoms.trim() &&
      !treatment.trim() &&
      !notes.trim()
    ) {
      setError("Please enter at least one medical record detail.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        patientId,
        ...(diagnosis.trim() && { diagnosis: diagnosis.trim() }),
        ...(symptoms.trim() && { symptoms: symptoms.trim() }),
        ...(treatment.trim() && { treatment: treatment.trim() }),
        ...(notes.trim() && { notes: notes.trim() }),
        ...(recordedAt && {
          recordedAt: new Date(recordedAt).toISOString(),
        }),
      };

      const response = await api.post<CreateMedicalRecordResponse>(
        "/medical-records",
        payload,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(
          response.data.message || "Failed to create medical record.",
        );
      }

      toast.success(
        response.data.message || "Medical record created successfully.",
      );

      onSuccess(response.data.data.patientId);
    } catch (err) {
      console.error("Failed to create medical record:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to create medical record. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPatient = patients.find((patient) => patient.id === patientId);
  const inputClassName =
    "mt-2 w-full border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";
  const labelClassName = "block text-sm font-semibold text-slate-800";
  const fieldHintClassName = "mt-2 text-xs leading-5 text-slate-500";
  const counterClassName =
    "mt-1.5 text-right text-[11px] font-medium text-slate-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-medical-record-title"
        className="my-auto flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden border border-white/70 bg-white shadow-2xl shadow-slate-950/30"
      >
        <header className="relative isolate overflow-hidden bg-[#102c49] px-5 py-6 text-white sm:px-8 sm:py-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -right-16 -top-28 h-64 w-64 bg-cyan-400/15 blur-3xl" />
            <div className="absolute -bottom-36 left-1/3 h-56 w-56 bg-blue-400/15 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:30px_30px]" />
          </div>

          <div className="relative flex items-start justify-between gap-5">
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-white/15 bg-white/10 text-cyan-200 shadow-inner shadow-white/5">
                <FilePlus2 size={22} strokeWidth={1.8} />
              </span>

              <div className="min-w-0">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">
                  Clinical documentation
                </p>
                <h2
                  id="create-medical-record-title"
                  className="text-xl font-semibold tracking-tight text-white sm:text-2xl"
                >
                  Create medical record
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
                  Capture a clear, structured summary of the patient&apos;s visit.
                </p>
                {selectedPatient && (
                  <div className="mt-4 inline-flex max-w-full items-center gap-2 border border-white/15 bg-white/10 px-3 py-2 text-xs text-white/90">
                    <UserRound size={14} className="shrink-0 text-cyan-200" />
                    <span className="truncate font-semibold">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </span>
                    <span className="shrink-0 text-blue-100/60">·</span>
                    <span className="shrink-0 font-mono text-blue-100/80">
                      {selectedPatient.patientNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              aria-label="Close form"
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/15 bg-white/5 text-blue-100 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto bg-slate-50/80 px-4 py-5 sm:px-8 sm:py-7">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p className="leading-5 text-rose-700/90">{error}</p>
              </div>
            )}

            <section className="border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.025]">
              <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-blue-50 text-blue-700">
                  <UserRound size={17} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Patient and visit
                  </h3>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    Choose who this record belongs to and when the visit took place.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5">
                <div>
                  <label
                    htmlFor="medical-record-patient"
                    className={labelClassName}
                  >
                    Patient <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="medical-record-patient"
                    value={patientId}
                    onChange={(event) => setPatientId(event.target.value)}
                    required
                    disabled={submitting}
                    className={inputClassName}
                  >
                    <option value="">Select a patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} —{" "}
                        {patient.patientNumber}
                      </option>
                    ))}
                  </select>
                  <p className={fieldHintClassName}>
                    The patient linked to this clinical history.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="medical-record-date"
                    className={labelClassName}
                  >
                    Recorded date and time
                  </label>
                  <div className="relative">
                    <CalendarClock
                      size={16}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="medical-record-date"
                      type="datetime-local"
                      value={recordedAt}
                      onChange={(event) => setRecordedAt(event.target.value)}
                      disabled={submitting}
                      className={`${inputClassName} pl-10`}
                    />
                  </div>
                  <p className={fieldHintClassName}>
                    Leave blank to use the current server time.
                  </p>
                </div>
              </div>
            </section>

            <section className="border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.025]">
              <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700">
                  <Stethoscope size={17} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Clinical details
                  </h3>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    Add at least one detail. All clinical fields are optional.
                  </p>
                </div>
              </div>

              <div className="grid gap-x-5 gap-y-5 p-4 sm:grid-cols-2 sm:p-5">
                <div>
                  <label
                    htmlFor="medical-record-diagnosis"
                    className={labelClassName}
                  >
                    Diagnosis
                  </label>
                  <textarea
                    id="medical-record-diagnosis"
                    value={diagnosis}
                    onChange={(event) => setDiagnosis(event.target.value)}
                    maxLength={5000}
                    rows={3}
                    placeholder="Enter the diagnosis..."
                    disabled={submitting}
                    className={`${inputClassName} resize-y leading-6`}
                  />
                  <p className={counterClassName}>{diagnosis.length}/5000</p>
                </div>

                <div>
                  <label
                    htmlFor="medical-record-symptoms"
                    className={labelClassName}
                  >
                    Symptoms
                  </label>
                  <textarea
                    id="medical-record-symptoms"
                    value={symptoms}
                    onChange={(event) => setSymptoms(event.target.value)}
                    maxLength={5000}
                    rows={3}
                    placeholder="Describe the reported symptoms..."
                    disabled={submitting}
                    className={`${inputClassName} resize-y leading-6`}
                  />
                  <p className={counterClassName}>{symptoms.length}/5000</p>
                </div>

                <div>
                  <label
                    htmlFor="medical-record-treatment"
                    className={labelClassName}
                  >
                    Treatment
                  </label>
                  <textarea
                    id="medical-record-treatment"
                    value={treatment}
                    onChange={(event) => setTreatment(event.target.value)}
                    maxLength={5000}
                    rows={3}
                    placeholder="Enter treatment details..."
                    disabled={submitting}
                    className={`${inputClassName} resize-y leading-6`}
                  />
                  <p className={counterClassName}>{treatment.length}/5000</p>
                </div>

                <div>
                  <label
                    htmlFor="medical-record-notes"
                    className={labelClassName}
                  >
                    Clinical notes
                  </label>
                  <textarea
                    id="medical-record-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    maxLength={5000}
                    rows={3}
                    placeholder="Add any additional clinical notes..."
                    disabled={submitting}
                    className={`${inputClassName} resize-y leading-6`}
                  />
                  <p className={counterClassName}>{notes.length}/5000</p>
                </div>
              </div>
            </section>
          </div>

          <footer className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="flex items-center gap-2 text-xs leading-5 text-slate-500">
              <ClipboardPlus size={15} className="shrink-0 text-blue-700" />
              Add at least one diagnosis, symptom, treatment, or note.
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || patients.length === 0}
                className="inline-flex h-11 items-center justify-center gap-2 bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-900/15 transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving record...
                  </>
                ) : (
                  <>
                    <FilePlus2 size={16} />
                    Save medical record
                  </>
                )}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
