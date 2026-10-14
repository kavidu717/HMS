"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  UserRound,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import api from "@/lib/axios";
import PatientDocuments from "@/components/patients/patient-documents";

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

      const response = await api.get<PatientResponse>(
        `/patients/${patientId}`
      );

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
      setHistoryError(
        "Unable to load medical history. Please try again."
      );
    } finally {
      setLoadingHistory(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!patientId) return;

    void fetchPatient();
    void fetchMedicalHistory();
  }, [patientId, fetchPatient, fetchMedicalHistory]);

  if (loadingPatient) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">
            Loading patient details...
          </span>
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-5xl p-6">
          <Link
            href="/patients"
            className="mb-5 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </Link>

          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-700">
              {patientError || "Patient information could not be found."}
            </p>

            <button
              type="button"
              onClick={() => void fetchPatient()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Not provided";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date: string | null | undefined) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const DetailItem = ({
    label,
    value,
  }: {
    label: string;
    value: string | null | undefined;
  }) => (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 break-words font-medium text-gray-900">
        {value || "Not provided"}
      </p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        {/* Page Header */}
        <div>
          <Link
            href="/patients"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Patient Details
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                View patient information and medical history.
              </p>
            </div>

            <Link
              href={`/patients/${patient.id}/edit`}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Edit Patient
            </Link>
          </div>
        </div>

        {/* Patient Summary */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
              <UserRound className="h-7 w-7 text-blue-600" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Patient Number: {patient.patientNumber}
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                patient.status === "ACTIVE"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {patient.status}
            </span>
          </div>
        </section>

        {/* Personal Information */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Personal Information
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="First Name" value={patient.firstName} />
            <DetailItem label="Last Name" value={patient.lastName} />
            <DetailItem label="Patient Number" value={patient.patientNumber} />
            <DetailItem
              label="Date of Birth"
              value={formatDate(patient.dateOfBirth)}
            />
            <DetailItem label="Gender" value={patient.gender} />
            <DetailItem label="NIC" value={patient.nic} />
          </div>
        </section>

        {/* Contact Information */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Contact Information
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
            <div className="flex gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
              <div className="min-w-0">
                <p className="text-sm text-gray-500">Email</p>
                <p className="mt-1 break-words font-medium text-gray-900">
                  {patient.email || "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="mt-1 font-medium text-gray-900">
                  {patient.phone || "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:col-span-2">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="mt-1 whitespace-pre-wrap font-medium text-gray-900">
                  {patient.address || "Not provided"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Emergency Contact */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Emergency Contact
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
            <DetailItem
              label="Contact Person"
              value={patient.emergencyContactName}
            />

            <DetailItem
              label="Contact Phone"
              value={patient.emergencyContactPhone}
            />
          </div>
        </section>

        {/* Medical History */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2">
                <ClipboardList className="h-5 w-5 text-purple-600" />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Medical History
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Medical records for this patient.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void fetchMedicalHistory()}
              disabled={loadingHistory}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loadingHistory ? "animate-spin" : ""}`}
              />
              Refresh History
            </button>
          </div>

          <div className="p-5">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-3 text-sm text-gray-500">
                  Loading medical history...
                </span>
              </div>
            ) : historyError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{historyError}</p>

                <button
                  type="button"
                  onClick={() => void fetchMedicalHistory()}
                  className="mt-3 text-sm font-medium text-red-700 underline"
                >
                  Try Again
                </button>
              </div>
            ) : medicalHistory.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center">
                <FileText className="mx-auto h-10 w-10 text-gray-300" />

                <h3 className="mt-3 font-medium text-gray-900">
                  No Medical Records
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  No medical history records are available for this patient.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-500">
                  {medicalHistory.length}{" "}
                  {medicalHistory.length === 1 ? "record" : "records"} found
                </div>

                {medicalHistory.map((record) => (
                  <article
                    key={record.id}
                    className="rounded-lg border border-gray-200 p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-blue-50 p-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {record.diagnosis || "Medical Record"}
                          </h3>

                          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                            <CalendarDays className="h-4 w-4" />
                            {formatDateTime(record.recordedAt)}
                          </div>
                        </div>
                      </div>

                      <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        Medical Record
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Diagnosis
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                          {record.diagnosis || "Not provided"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Symptoms
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                          {record.symptoms || "Not provided"}
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <p className="text-sm font-medium text-gray-500">
                          Treatment
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                          {record.treatment || "Not provided"}
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <p className="text-sm font-medium text-gray-500">
                          Notes
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                          {record.notes || "No additional notes"}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <PatientDocuments patientId={patient.id} />

        {/* Record Timestamps */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">
            Record Information
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem
              label="Created At"
              value={formatDateTime(patient.createdAt)}
            />

            <DetailItem
              label="Last Updated"
              value={formatDateTime(patient.updatedAt)}
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}