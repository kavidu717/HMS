"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  Eye,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserPlus,
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

const getInitials = (firstName: string, lastName: string) =>
  `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();

const formatLabel = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const getStatusStyle = (status: string) => {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/15";
    case "INACTIVE":
      return "bg-slate-100 text-slate-600 ring-slate-500/15";
    default:
      return "bg-amber-50 text-amber-700 ring-amber-600/15";
  }
};

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<PatientsResponse>("/patients");

      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error(response.data.message || "Failed to retrieve patients.");
      }

      setPatients(response.data.data);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
      setError("We couldn’t load patient records. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPatients();
  }, [fetchPatients]);

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
        value?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [normalizedSearch, patients]);

  const activePatients = patients.filter(
    (patient) => patient.status.toUpperCase() === "ACTIVE"
  ).length;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
              <span className="h-1.5 w-1.5  bg-blue-600" />
              Care <span className="text-slate-300">/</span> Patients
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Patient management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Find patient records and keep essential information close at hand.
            </p>
          </div>

          <Link
            href="/patients/new"
            className="inline-flex h-11 w-fit items-center justify-center gap-2  bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-900/10 transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/15"
          >
            <UserPlus size={17} />
            Register patient
          </Link>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              label: "Total patients",
              value: loading ? "—" : patients.length,
              note: "Records in the directory",
              icon: Users,
              iconStyle: "bg-blue-50 text-blue-700",
            },
            {
              label: "Active records",
              value: loading ? "—" : activePatients,
              note: "Currently marked active",
              icon: Activity,
              iconStyle: "bg-emerald-50 text-emerald-700",
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <section
                key={stat.label}
                className="flex items-center justify-between  border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-5"
              >
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{stat.note}</p>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center  ${stat.iconStyle}`}>
                  <Icon size={20} />
                </span>
              </section>
            );
          })}
        </div>

        <section className="overflow-hidden  border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025]">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-semibold tracking-tight text-slate-900">
                  Patient records
                </h2>
                {!loading && !error && (
                  <span className=" bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {patients.length}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Search by patient number, name, NIC, phone, or email.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchPatients()}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 self-start  border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <label className="relative block w-full sm:max-w-lg">
              <span className="sr-only">Search patient records</span>
              <Search
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search patients..."
                className="h-11 w-full  border border-slate-200 bg-slate-50/70 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
              {searchTerm && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center  text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
                {filteredPatients.length === 1 ? "match" : "matches"}
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 border-t border-slate-100 px-6 py-12">
              <span className="flex h-11 w-11 items-center justify-center  bg-blue-50 text-blue-700">
                <Loader2 size={21} className="animate-spin" />
              </span>
              <p className="text-sm text-slate-500">Loading patient records…</p>
            </div>
          ) : error ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <span className="flex h-11 w-11 items-center justify-center  bg-rose-50 text-rose-600">
                <AlertCircle size={21} />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">
                Couldn’t load patients
              </h3>
              <p className="mt-1 text-sm text-slate-500">{error}</p>
              <button
                type="button"
                onClick={() => void fetchPatients()}
                className="mt-4  bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/15"
              >
                Try again
              </button>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center border-t border-slate-100 px-6 py-12 text-center">
              <span className="flex h-11 w-11 items-center justify-center  bg-slate-100 text-slate-500">
                <Users size={21} />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">
                {searchTerm.trim() ? "No matching patients" : "No patients yet"}
              </h3>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                {searchTerm.trim()
                  ? "Try a different name, patient number, NIC, phone or email."
                  : "Register your first patient to start building the directory."}
              </p>
              {searchTerm.trim() ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="mt-4  px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  Clear search
                </button>
              ) : (
                <Link
                  href="/patients/new"
                  className="mt-4 inline-flex items-center gap-2  bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  <UserPlus size={16} />
                  Register patient
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto border-t border-slate-100 xl:block">
                <table className="w-full min-w-[880px] text-left">
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
                        Phone
                      </th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPatients.map((patient) => (
                      <tr
                        key={patient.id}
                        className="transition-colors hover:bg-blue-50/35"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center  bg-blue-50 text-xs font-bold tracking-wide text-blue-800 ring-1 ring-inset ring-blue-100">
                              {getInitials(patient.firstName, patient.lastName)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {patient.firstName} {patient.lastName}
                              </p>
                              <p className="mt-0.5 truncate font-mono text-xs text-blue-700">
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
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {patient.phone || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-2  px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(
                              patient.status
                            )}`}
                          >
                            <span className="h-1.5 w-1.5  bg-current opacity-70" />
                            {formatLabel(patient.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/patients/${patient.id}`}
                            aria-label={`View ${patient.firstName} ${patient.lastName}`}
                            className="inline-flex items-center gap-1.5  border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10"
                          >
                            <Eye size={14} />
                            View record
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-slate-100 border-t border-slate-100 xl:hidden">
                {filteredPatients.map((patient) => (
                  <li key={patient.id} className="p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center  bg-blue-50 text-xs font-bold tracking-wide text-blue-800 ring-1 ring-inset ring-blue-100">
                        {getInitials(patient.firstName, patient.lastName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-blue-700">
                              {patient.patientNumber}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1.5  px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${getStatusStyle(
                              patient.status
                            )}`}
                          >
                            <span className="h-1.5 w-1.5  bg-current opacity-70" />
                            {formatLabel(patient.status)}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-slate-500">
                          {patient.phone && (
                            <span className="inline-flex items-center gap-2">
                              <Phone size={13} className="text-slate-400" />
                              {patient.phone}
                            </span>
                          )}
                          {patient.email && (
                            <span className="inline-flex min-w-0 items-center gap-2">
                              <Mail size={13} className="shrink-0 text-slate-400" />
                              <span className="truncate">{patient.email}</span>
                            </span>
                          )}
                          <span>
                            {formatLabel(patient.gender)}
                            {patient.nic ? ` · ${patient.nic}` : ""}
                          </span>
                        </div>
                        <Link
                          href={`/patients/${patient.id}`}
                          className="mt-4 inline-flex items-center gap-1.5  px-2.5 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10"
                        >
                          <Eye size={14} />
                          View record
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {!loading && !error && filteredPatients.length > 0 && (
            <div className="flex flex-col gap-1 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span>
                Showing <span className="font-semibold text-slate-700">{filteredPatients.length}</span> of {patients.length} patients
              </span>
              <span>Patient information is available to authorized care teams.</span>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
