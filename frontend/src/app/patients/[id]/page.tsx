"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileText,
  HeartPulse,
  Loader2,
  Phone,
  RefreshCw,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import PatientDocuments from "@/components/patients/patient-documents";
import api from "@/lib/axios";
import { PatientInvoices } from "@/components/billing/patient-invoices";

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nic: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PatientResponse {
  success: boolean;
  message: string;
  data: Patient;
}

interface MedicalRecord {
  id: string | number;
  patientId: string | number;
  diagnosis: string | null;
  symptoms: string | null;
  treatment: string | null;
  notes: string | null;
  recordedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MedicalHistoryResponse {
  success: boolean;
  message: string;
  data: MedicalRecord[];
}

const formatLabel = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm font-medium leading-6 text-slate-800">
        {value || <span className="font-normal text-slate-400">Not provided</span>}
      </dd>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
  trailing,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center  bg-emerald-50 text-emerald-700">
          <Icon size={19} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>
      {trailing}
    </div>
  );
}

const sectionClassName =
  "overflow-hidden  border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.02]";

export default function PatientDetailsPage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalRecord[]>([]);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [patientError, setPatientError] = useState("");
  const [historyError, setHistoryError] = useState("");

  const fetchPatient = useCallback(async () => {
    try {
      setLoadingPatient(true);
      setPatientError("");
      const response = await api.get<PatientResponse>(`/patients/${patientId}`);
      setPatient(response.data.data);
    } catch (error) {
      console.error("Failed to fetch patient:", error);
      setPatientError("Unable to load patient details. Please try again.");
    } finally {
      setLoadingPatient(false);
    }
  }, [patientId]);

  const fetchMedicalHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      setHistoryError("");
      const response = await api.get<MedicalHistoryResponse>(
        `/medical-records/patient/${patientId}`
      );
      setMedicalHistory(response.data.data ?? []);
    } catch (error) {
      console.error("Failed to fetch medical history:", error);
      setHistoryError("Unable to load medical history. Please try again.");
    } finally {
      setLoadingHistory(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!patientId) return;
    void fetchPatient();
    void fetchMedicalHistory();
  }, [patientId, fetchPatient, fetchMedicalHistory]);

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Not provided";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "Not available";
    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date: string | null | undefined) => {
    if (!date) return "Not available";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "Not available";
    return parsedDate.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loadingPatient) {
    return (
      <DashboardLayout>
        <div className="mx-auto flex min-h-[420px] max-w-7xl flex-col items-center justify-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center  bg-emerald-50 text-emerald-700">
            <Loader2 className="animate-spin" size={22} />
          </span>
          <p className="text-sm text-slate-500">Loading patient record…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl space-y-5">
          <Link
            href="/patients"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
          >
            <ArrowLeft size={16} /> Patient management
          </Link>
          <div className=" border border-rose-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center  bg-rose-50 text-rose-600">
                <FileText size={18} />
              </span>
              <div>
                <h1 className="font-semibold text-slate-900">Record unavailable</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {patientError || "Patient information could not be found."}
                </p>
                <button
                  type="button"
                  onClick={() => void fetchPatient()}
                  className="mt-4 inline-flex h-10 items-center gap-2  bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  <RefreshCw size={15} /> Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = `${patient.firstName} ${patient.lastName}`.trim();
  const initials = `${patient.firstName.trim().charAt(0)}${patient.lastName
    .trim()
    .charAt(0)}`.toUpperCase();
  const isActive = patient.status.toUpperCase() === "ACTIVE";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-5">
        <header>
          <Link
            href="/patients"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/10"
          >
            <ArrowLeft size={16} /> Patient management
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
                <span className="h-1.5 w-1.5  bg-emerald-600" />
                Patients <span className="text-slate-300">/</span> Record
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Patient record
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                Patient information, care history, and related documents.
              </p>
            </div>
            <Link
              href={`/patients/${patient.id}/edit`}
              className="inline-flex h-11 items-center justify-center gap-2  bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/15"
            >
              <UserRound size={16} /> Edit patient
            </Link>
          </div>
        </header>

        <section className="overflow-hidden  border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.02]">
          <div className="h-1.5 bg-gradient-to-r from-emerald-700 via-emerald-500 to-teal-400" />
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center  bg-emerald-50 text-lg font-bold tracking-wide text-emerald-800 ring-1 ring-inset ring-emerald-100 sm:h-[72px] sm:w-[72px]">
                {initials || <UserRound size={25} />}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="truncate text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                    {fullName}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5  px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                        : "bg-slate-100 text-slate-600 ring-slate-500/15"
                    }`}
                  >
                    <span className="h-1.5 w-1.5  bg-current" />
                    {formatLabel(patient.status)}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-500">Patient number</p>
                <p className="mt-0.5 font-mono text-sm font-semibold tracking-wide text-emerald-800">
                  {patient.patientNumber}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:min-w-[250px] sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">Date of birth</p>
                <p className="mt-1.5 text-sm font-semibold text-slate-800">{formatDate(patient.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">Gender</p>
                <p className="mt-1.5 text-sm font-semibold text-slate-800">{formatLabel(patient.gender)}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className={sectionClassName}>
            <SectionTitle
              icon={UserRound}
              title="Personal information"
              description="Identity and demographic details."
            />
            <dl className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
              <DetailItem label="First name" value={patient.firstName} />
              <DetailItem label="Last name" value={patient.lastName} />
              <DetailItem label="Patient number" value={patient.patientNumber} />
              <DetailItem label="Date of birth" value={formatDate(patient.dateOfBirth)} />
              <DetailItem label="Gender" value={formatLabel(patient.gender)} />
              <DetailItem label="NIC number" value={patient.nic} />
            </dl>
          </section>

          <section className={sectionClassName}>
            <SectionTitle
              icon={Phone}
              title="Contact information"
              description="Ways to reach this patient."
            />
            <dl className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
              <DetailItem label="Phone number" value={patient.phone} />
              <DetailItem label="Email address" value={patient.email} />
              <div className="sm:col-span-2">
                <DetailItem label="Residential address" value={patient.address} />
              </div>
            </dl>
          </section>
        </div>

        <section className={sectionClassName}>
          <SectionTitle
            icon={HeartPulse}
            title="Emergency contact"
            description="Contact details to use in an urgent situation."
          />
          <dl className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
            <DetailItem label="Contact person" value={patient.emergencyContactName} />
            <DetailItem label="Contact phone" value={patient.emergencyContactPhone} />
          </dl>
        </section>

        <section className={sectionClassName}>
          <SectionTitle
            icon={ClipboardList}
            title="Medical history"
            description="Clinical notes and care recorded for this patient."
            trailing={
              <button
                type="button"
                onClick={() => void fetchMedicalHistory()}
                disabled={loadingHistory}
                className="inline-flex h-9 items-center justify-center gap-2 self-start  border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/10 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
              >
                <RefreshCw size={14} className={loadingHistory ? "animate-spin" : ""} />
                Refresh history
              </button>
            }
          />
          <div className="p-5 sm:p-6">
            {loadingHistory ? (
              <div className="flex items-center justify-center gap-3 py-10">
                <Loader2 className="animate-spin text-emerald-700" size={20} />
                <span className="text-sm text-slate-500">Loading medical history…</span>
              </div>
            ) : historyError ? (
              <div className=" border border-rose-200 bg-rose-50 px-4 py-4">
                <p className="text-sm text-rose-800">{historyError}</p>
                <button
                  type="button"
                  onClick={() => void fetchMedicalHistory()}
                  className="mt-2 text-sm font-semibold text-rose-800 underline decoration-rose-300 underline-offset-4"
                >
                  Try again
                </button>
              </div>
            ) : medicalHistory.length === 0 ? (
              <div className=" border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center  bg-white text-slate-400 shadow-sm">
                  <FileText size={20} />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-slate-800">No medical records yet</h3>
                <p className="mt-1 text-sm text-slate-500">Medical history will appear here when it is recorded.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
                  {medicalHistory.length} {medicalHistory.length === 1 ? "record" : "records"}
                </p>
                {medicalHistory.map((record) => (
                  <article key={record.id} className=" border border-slate-200/80 bg-white p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center  bg-emerald-50 text-emerald-700">
                          <FileText size={18} />
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900">{record.diagnosis || "Medical record"}</h3>
                          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
                            <CalendarDays size={13} /> {formatDateTime(record.recordedAt)}
                          </p>
                        </div>
                      </div>
                      <span className="w-fit  bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Clinical record</span>
                    </div>
                    <dl className="mt-4 grid gap-x-6 gap-y-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                      <DetailItem label="Diagnosis" value={record.diagnosis} />
                      <DetailItem label="Symptoms" value={record.symptoms} />
                      <div className="sm:col-span-2"><DetailItem label="Treatment" value={record.treatment} /></div>
                      <div className="sm:col-span-2"><DetailItem label="Notes" value={record.notes || "No additional notes"} /></div>
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <PatientDocuments patientId={patient.id} />
            
        <section className={sectionClassName}>
      <SectionTitle
          icon={FileText}
         title="Billing & Invoices"
         description="View this patient's invoices, payments, and outstanding balances."
       />

         <div className="p-5 sm:p-6">
         <PatientInvoices patientId={patient.id} />
       </div>
        </section>

        <section className={`${sectionClassName} p-5 sm:p-6`}>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center  bg-slate-100 text-slate-600">
              <Clock3 size={17} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Record activity</h2>
              <p className="mt-0.5 text-xs text-slate-500">When this patient profile was created and last updated.</p>
            </div>
          </div>
          <dl className="mt-5 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2">
            <DetailItem label="Created" value={formatDateTime(patient.createdAt)} />
            <DetailItem label="Last updated" value={formatDateTime(patient.updatedAt)} />
          </dl>
        </section>
      </div>
    </DashboardLayout>
  );
}
