"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ClipboardList,
  Eye,
  FilePlus2,
  FileText,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import api from "@/lib/axios";
import CreateMedicalRecordForm from "@/app/medical-records/components/CreateMedicalRecordForm";
import { useAuthStore } from "@/store/auth.store";

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  nic: string | null;
  email: string | null;
  phone: string | null;
  status: string;
}

interface PatientsResponse {
  success: boolean;
  message: string;
  data: Patient[];
}

interface MedicalRecord {
  id: string;
  patientId: string;
  diagnosis: string | null;
  symptoms: string | null;
  treatment: string | null;
  notes: string | null;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface MedicalHistoryResponse {
  success: boolean;
  message: string;
  data: MedicalRecord[];
}

const getInitials = (firstName: string, lastName: string) =>
  `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();

const formatLabel = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export default function MedicalRecordsPage() {
  const user = useAuthStore((state) => state.user);
  const canCreateMedicalRecord =
    user?.privileges.includes("medical_record:create") ?? false;

  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [patientsLoading, setPatientsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [patientsError, setPatientsError] = useState("");
  const [historyError, setHistoryError] = useState("");

  const fetchPatients = useCallback(async () => {
    try {
      setPatientsLoading(true);
      setPatientsError("");

      const response = await api.get<PatientsResponse>("/patients");

      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error(
          response.data.message || "Failed to retrieve patients.",
        );
      }

      setPatients(response.data.data);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      setPatientsError(
        "We couldn't load patients. Please check your connection and try again.",
      );
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPatients();
  }, [fetchPatients]);

  const fetchMedicalHistory = useCallback(async (patient: Patient) => {
    try {
      setSelectedPatient(patient);
      setHistoryLoading(true);
      setHistoryError("");
      setMedicalRecords([]);

      const response = await api.get<MedicalHistoryResponse>(
        `/medical-records/patient/${patient.id}`,
      );

      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error(
          response.data.message || "Failed to retrieve medical history.",
        );
      }

      setMedicalRecords(response.data.data);
    } catch (error) {
      console.error("Failed to fetch medical history:", error);
      setHistoryError(
        "We couldn't load this patient's medical history. Please try again.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredPatients = useMemo(() => {
    if (!normalizedSearch) return patients;

    return patients.filter((patient) => {
      const searchableValues = [
        patient.patientNumber,
        patient.firstName,
        patient.lastName,
        `${patient.firstName} ${patient.lastName}`,
        patient.nic,
        patient.phone,
        patient.email,
      ];

      return searchableValues.some((value) =>
        value?.toLowerCase().includes(normalizedSearch),
      );
    });
  }, [normalizedSearch, patients]);

  const patientsWithRecords = useMemo(() => {
    return new Set(
      medicalRecords.map((record) => record.patientId),
    ).size;
  }, [medicalRecords]);

  const handleMedicalRecordCreated = (patientId: string) => {
    setShowCreateForm(false);

    const patient = patients.find((item) => item.id === patientId);
    if (patient) void fetchMedicalHistory(patient);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
              <span className="h-1.5 w-1.5 bg-emerald-600" />
              Care <span className="text-slate-300">/</span> Medical Records
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Electronic Medical Records
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Access patient medical histories, diagnoses, treatments, and
              clinical notes from one place.
            </p>
          </div>

          {canCreateMedicalRecord && (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              disabled={patientsLoading || patients.length === 0}
              title={
                patients.length === 0 && !patientsLoading
                  ? "Register a patient before creating a medical record"
                  : undefined
              }
              className="inline-flex h-11 items-center justify-center gap-2 self-start bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/15 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            >
              <FilePlus2 size={17} />
              Create medical record
            </button>
          )}
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="flex items-center justify-between border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02]">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Registered patients
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {patientsLoading ? "—" : patients.length}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Patients available in the directory
              </p>
            </div>

            <span className="flex h-11 w-11 items-center justify-center bg-emerald-50 text-emerald-700">
              <Users size={20} />
            </span>
          </section>

          <section className="flex items-center justify-between border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02]">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Loaded medical records
              </p>

              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {historyLoading
                  ? "—"
                  : selectedPatient
                    ? medicalRecords.length
                    : "—"}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {selectedPatient
                  ? `History for ${selectedPatient.firstName} ${selectedPatient.lastName}`
                  : "Select a patient to view their records"}
              </p>
            </div>

            <span className="flex h-11 w-11 items-center justify-center bg-emerald-50 text-emerald-700">
              <Activity size={20} />
            </span>
          </section>
        </div>

        <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025]">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-slate-900">
                Find a patient
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a patient to view their medical history.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchPatients()}
              disabled={patientsLoading}
              className="inline-flex h-10 items-center justify-center gap-2 self-start border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/10 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw
                size={15}
                className={patientsLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <label className="relative block w-full sm:max-w-lg">
              <span className="sr-only">Search patients</span>

              <Search
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, patient number, NIC..."
                className="h-11 w-full border border-slate-200 bg-slate-50/70 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />

              {searchTerm && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={15} />
                </button>
              )}
            </label>

            {!patientsLoading && !patientsError && (
              <p className="text-sm text-slate-500 sm:text-right">
                <span className="font-semibold text-slate-800">
                  {filteredPatients.length}
                </span>{" "}
                {filteredPatients.length === 1 ? "patient" : "patients"}
              </p>
            )}
          </div>

          {patientsLoading ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 border-t border-slate-100 px-6 py-12">
              <span className="flex h-11 w-11 items-center justify-center bg-emerald-50 text-emerald-700">
                <Loader2 size={21} className="animate-spin" />
              </span>

              <p className="text-sm text-slate-500">
                Loading patients...
              </p>
            </div>
          ) : patientsError ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
              <AlertCircle size={24} className="text-rose-600" />

              <h3 className="mt-3 font-semibold text-slate-900">
                Couldn't load patients
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {patientsError}
              </p>

              <button
                type="button"
                onClick={() => void fetchPatients()}
                className="mt-4 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Try again
              </button>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center border-t border-slate-100 px-6 py-12 text-center">
              <Users size={25} className="text-slate-400" />

              <h3 className="mt-3 font-semibold text-slate-900">
                {searchTerm.trim()
                  ? "No matching patients"
                  : "No patients available"}
              </h3>

              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                {searchTerm.trim()
                  ? "Try another patient name, patient number, NIC, phone, or email."
                  : "Register a patient before accessing their medical history."}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto border-t border-slate-100 md:block">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="bg-slate-50/80">
                      <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Patient
                      </th>

                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Gender
                      </th>

                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        NIC
                      </th>

                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Contact
                      </th>

                      <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Medical History
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredPatients.map((patient) => {
                      const isSelected =
                        selectedPatient?.id === patient.id;

                      return (
                        <tr
                          key={patient.id}
                          className={`transition-colors ${
                            isSelected
                              ? "bg-emerald-50/60"
                              : "hover:bg-emerald-50/35"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-50 text-xs font-bold tracking-wide text-emerald-800 ring-1 ring-inset ring-emerald-100">
                                {getInitials(
                                  patient.firstName,
                                  patient.lastName,
                                )}
                              </span>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {patient.firstName} {patient.lastName}
                                </p>

                                <p className="mt-0.5 truncate font-mono text-xs text-emerald-700">
                                  {patient.patientNumber}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {formatLabel(patient.gender)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {patient.nic || "—"}
                          </td>

                          <td className="px-5 py-4">
                            <div className="space-y-1.5 text-xs text-slate-500">
                              {patient.phone && (
                                <span className="flex items-center gap-1.5">
                                  <Phone size={12} />
                                  {patient.phone}
                                </span>
                              )}

                              {patient.email && (
                                <span className="flex items-center gap-1.5">
                                  <Mail size={12} />
                                  <span className="max-w-40 truncate">
                                    {patient.email}
                                  </span>
                                </span>
                              )}

                              {!patient.phone && !patient.email && "—"}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                void fetchMedicalHistory(patient)
                              }
                              disabled={historyLoading}
                              className={`inline-flex items-center gap-1.5 border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/10 disabled:cursor-not-allowed disabled:opacity-50 ${
                                isSelected
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                              }`}
                            >
                              <Eye size={14} />
                              {isSelected ? "Selected" : "View history"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-slate-100 border-t border-slate-100 md:hidden">
                {filteredPatients.map((patient) => {
                  const isSelected =
                    selectedPatient?.id === patient.id;

                  return (
                    <li key={patient.id} className="p-5">
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-emerald-50 text-xs font-bold tracking-wide text-emerald-800 ring-1 ring-inset ring-emerald-100">
                          {getInitials(
                            patient.firstName,
                            patient.lastName,
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {patient.firstName} {patient.lastName}
                          </p>

                          <p className="mt-0.5 font-mono text-xs text-emerald-700">
                            {patient.patientNumber}
                          </p>

                          <div className="mt-3 grid gap-2 text-xs text-slate-500">
                            <span>
                              {formatLabel(patient.gender)}
                              {patient.nic ? ` · ${patient.nic}` : ""}
                            </span>

                            {patient.phone && (
                              <span className="flex items-center gap-2">
                                <Phone size={13} />
                                {patient.phone}
                              </span>
                            )}

                            {patient.email && (
                              <span className="flex min-w-0 items-center gap-2">
                                <Mail size={13} />
                                <span className="truncate">
                                  {patient.email}
                                </span>
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              void fetchMedicalHistory(patient)
                            }
                            disabled={historyLoading}
                            className="mt-3 inline-flex items-center gap-1.5 border border-slate-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                          >
                            <Eye size={14} />
                            {isSelected ? "Selected" : "View history"}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        {selectedPatient && (
          <section
            id="medical-history"
            className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025]"
          >
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700">
                  <ClipboardList size={21} />
                </span>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                    Patient Medical History
                  </p>

                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Patient No: {selectedPatient.patientNumber}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPatient(null);
                  setMedicalRecords([]);
                  setHistoryError("");
                }}
                className="inline-flex h-9 items-center justify-center gap-2 self-start border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <X size={15} />
                Close history
              </button>
            </div>

            {historyLoading ? (
              <div className="flex min-h-52 flex-col items-center justify-center gap-3 px-6 py-12">
                <Loader2
                  size={24}
                  className="animate-spin text-emerald-700"
                />

                <p className="text-sm text-slate-500">
                  Loading medical history...
                </p>
              </div>
            ) : historyError ? (
              <div className="flex min-h-52 flex-col items-center justify-center px-6 py-12 text-center">
                <AlertCircle size={24} className="text-rose-600" />

                <h3 className="mt-3 font-semibold text-slate-900">
                  Couldn't load medical history
                </h3>

                <p className="mt-1 max-w-md text-sm text-slate-500">
                  {historyError}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void fetchMedicalHistory(selectedPatient)
                  }
                  className="mt-4 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Try again
                </button>
              </div>
            ) : medicalRecords.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center px-6 py-12 text-center">
                <span className="flex h-11 w-11 items-center justify-center bg-slate-100 text-slate-500">
                  <FileText size={22} />
                </span>

                <h3 className="mt-4 font-semibold text-slate-900">
                  No medical records yet
                </h3>

                <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                  No medical history was found for this patient.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {medicalRecords.map((record) => (
                  <article key={record.id} className="p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700">
                          <FileText size={19} />
                        </span>

                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {record.diagnosis || "Medical record"}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            Record #{record.id}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-2 self-start bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                        <Activity size={13} />
                        {formatDate(record.recordedAt)}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                          Symptoms
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {record.symptoms || "No symptoms recorded."}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                          Treatment
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {record.treatment || "No treatment recorded."}
                        </p>
                      </div>
                    </div>

                    {record.notes && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                          Clinical Notes
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {record.notes}
                        </p>
                      </div>
                    )}

                    <p className="mt-4 text-xs text-slate-400">
                      Last updated: {formatDate(record.updatedAt)}
                    </p>
                  </article>
                ))}
              </div>
            )}

            {!historyLoading &&
              !historyError &&
              medicalRecords.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 text-xs text-slate-500 sm:px-6">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {medicalRecords.length}
                  </span>{" "}
                  medical {medicalRecords.length === 1 ? "record" : "records"}.
                </div>
              )}
          </section>
        )}

        <div className="flex items-start gap-3 border border-emerald-100 bg-emerald-50/60 p-4">
          <UserRound
            size={18}
            className="mt-0.5 shrink-0 text-emerald-700"
          />

          <p className="text-xs leading-5 text-emerald-900/80">
            Medical records contain confidential patient information. Access
            and use these records only for authorized healthcare purposes.
          </p>
        </div>
      </div>

      {showCreateForm && (
        <CreateMedicalRecordForm
          patients={patients}
          initialPatientId={selectedPatient?.id}
          onSuccess={handleMedicalRecordCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </DashboardLayout>
  );
}
