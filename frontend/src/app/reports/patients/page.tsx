
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import api from "@/lib/axios";

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
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PatientsResponse {
  success: boolean;
  message: string;
  data: Patient[];
}

const formatLabel = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatDate = (value: string) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export default function PatientReportsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<PatientsResponse>("/patients");

      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error(
          response.data.message || "Failed to retrieve patient records.",
        );
      }

      setPatients(response.data.data);
    } catch (err) {
      console.error("Failed to fetch patient report:", err);
      setError("We couldn't load the patient report. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPatients();
  }, [fetchPatients]);

  const filteredPatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return patients;

    return patients.filter((patient) => {
      const searchableValues = [
        patient.patientNumber,
        patient.firstName,
        patient.lastName,
        `${patient.firstName} ${patient.lastName}`,
        patient.nic,
        patient.phone,
        patient.email,
        patient.status,
        patient.gender,
      ];

      return searchableValues.some((value) =>
        value?.toLowerCase().includes(query),
      );
    });
  }, [patients, searchTerm]);

  const activePatients = patients.filter(
    (patient) => patient.status.toUpperCase() === "ACTIVE",
  ).length;

  const inactivePatients = patients.filter(
    (patient) => patient.status.toUpperCase() === "INACTIVE",
  ).length;

  const exportCsv = () => {
    if (filteredPatients.length === 0) return;

    const headers = [
      "Patient Number",
      "First Name",
      "Last Name",
      "Date of Birth",
      "Gender",
      "NIC",
      "Email",
      "Phone",
      "Address",
      "Status",
      "Registration Date",
    ];

    const escapeCsvValue = (value: string | null | undefined) => {
      const safeValue = String(value ?? "").replace(/"/g, '""');
      return `"${safeValue}"`;
    };

    const rows = filteredPatients.map((patient) => [
      patient.patientNumber,
      patient.firstName,
      patient.lastName,
      formatDate(patient.dateOfBirth),
      formatLabel(patient.gender),
      patient.nic,
      patient.email,
      patient.phone,
      patient.address,
      formatLabel(patient.status),
      patient.createdAt ? formatDate(patient.createdAt) : "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "patient-report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/reports"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
            >
              <ArrowLeft size={16} />
              Back to Reports
            </Link>

            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
              <span className="h-1.5 w-1.5 bg-emerald-600" />
              Reports <span className="text-slate-300">/</span> Patients
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Patient Reports
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Review registered patient records and export the report for
              further analysis.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={loading || Boolean(error) || patients.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText size={16} />
              Print report
            </button>

            <button
              type="button"
              onClick={exportCsv}
              disabled={loading || Boolean(error) || filteredPatients.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total patients",
              value: patients.length,
              icon: Users,
            },
            {
              label: "Active patients",
              value: activePatients,
              icon: Activity,
            },
            {
              label: "Inactive patients",
              value: inactivePatients,
              icon: Users,
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <section
                key={stat.label}
                className="flex items-center justify-between border border-slate-200/80 bg-white p-5 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>

                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    {loading ? "—" : stat.value}
                  </p>
                </div>

                <span className="flex h-11 w-11 items-center justify-center bg-emerald-50 text-emerald-700">
                  <Icon size={20} />
                </span>
              </section>
            );
          })}
        </div>

        <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm print:shadow-none">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-slate-900">
                Patient records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search patient number, name, NIC, phone, or email.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchPatients()}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 self-start border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:self-auto print:hidden"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 print:hidden">
            <label className="relative block w-full sm:max-w-lg">
              <span className="sr-only">Search patient report</span>

              <Search
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search patient records..."
                className="h-11 w-full border border-slate-200 bg-slate-50/70 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />

              {searchTerm && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={15} />
                </button>
              )}
            </label>

            {!loading && !error && (
              <p className="text-sm text-slate-500 sm:text-right">
                <span className="font-semibold text-slate-800">
                  {filteredPatients.length}
                </span>{" "}
                {filteredPatients.length === 1 ? "record" : "records"}
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-12">
              <Loader2
                size={24}
                className="animate-spin text-emerald-700"
              />
              <p className="text-sm text-slate-500">
                Loading patient report...
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <AlertCircle size={24} className="text-rose-600" />

              <h3 className="mt-4 font-semibold text-slate-900">
                Could not load patient report
              </h3>

              <p className="mt-1 text-sm text-slate-500">{error}</p>

              <button
                type="button"
                onClick={() => void fetchPatients()}
                className="mt-4 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Try again
              </button>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <Users size={24} className="text-slate-400" />

              <h3 className="mt-4 font-semibold text-slate-900">
                {searchTerm.trim()
                  ? "No matching patient records"
                  : "No patient records found"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing the search term or check the patient directory.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full min-w-[950px] text-left text-sm print:min-w-0">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/80 print:bg-white">
                    <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                      Patient number
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                      Patient name
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                      Gender
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                      NIC
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                      Phone
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                      Registered
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-emerald-50/30 print:break-inside-avoid"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-emerald-700">
                        {patient.patientNumber}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-900">
                        {patient.firstName} {patient.lastName}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatLabel(patient.gender)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {patient.nic || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {patient.phone || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {formatLabel(patient.status)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {patient.createdAt
                          ? formatDate(patient.createdAt)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && filteredPatients.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 text-xs text-slate-500 sm:px-6">
              Showing {filteredPatients.length} of {patients.length} patient
              records.
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
