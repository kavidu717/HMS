"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Beaker,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  FlaskConical,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  TestTube,
  X,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import api from "@/lib/axios";

interface LaboratoryPerson {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber?: string;
  doctorNumber?: string;
}

interface LaboratoryTest {
  id: string;
  testCode: string;
  testName: string;
  sampleType: string;
  price?: string | number;
}

interface LaboratoryRequest {
  id: string;
  requestNumber: string;
  patientId: string;
  doctorId: string;
  laboratoryTestId: string;
  status: string;
  sampleCollectedAt: string | null;
  result: string | null;
  resultEnteredAt: string | null;
  requestedAt: string;
  patient: LaboratoryPerson;
  doctor: LaboratoryPerson;
  laboratoryTest: LaboratoryTest;
}

interface LaboratoryRequestsResponse {
  success: boolean;
  message?: string;
  data: LaboratoryRequest[];
}

type StatusFilter =
  | "ALL"
  | "REQUESTED"
  | "SAMPLE_COLLECTED"
  | "RESULT_ENTERED";

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "REQUESTED", label: "Awaiting sample" },
  { value: "SAMPLE_COLLECTED", label: "Sample collected" },
  { value: "RESULT_ENTERED", label: "Result entered" },
];

const getPersonName = (person?: LaboratoryPerson | null, prefix = "") => {
  const fullName = `${person?.firstName ?? ""} ${person?.lastName ?? ""}`.trim();

  return fullName ? `${prefix}${fullName}` : "Not available";
};

const getStatusLabel = (status: string) => {
  switch (status.toUpperCase()) {
    case "REQUESTED":
      return "Awaiting sample";
    case "SAMPLE_COLLECTED":
      return "Sample collected";
    case "RESULT_ENTERED":
      return "Result entered";
    default:
      return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
};

const getStatusStyle = (status: string) => {
  switch (status.toUpperCase()) {
    case "REQUESTED":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "SAMPLE_COLLECTED":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "RESULT_ENTERED":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatDateKey = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
};

const escapeCsv = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function LaboratoryReportsPage() {
  const [requests, setRequests] = useState<LaboratoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<LaboratoryRequestsResponse>(
        "/laboratory-test-requests",
      );
      const data = response.data?.data;

      if (!response.data?.success || !Array.isArray(data)) {
        throw new Error(
          response.data?.message || "Invalid laboratory requests response.",
        );
      }

      setRequests(data);
    } catch (fetchError) {
      console.error("Failed to load laboratory report:", fetchError);
      setError("Could not load laboratory report data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const patientName = getPersonName(request.patient).toLowerCase();
      const doctorName = getPersonName(request.doctor, "Dr. ").toLowerCase();
      const requestedDate = formatDateKey(request.requestedAt);
      const matchesSearch =
        !query ||
        [
          request.requestNumber,
          request.patient?.patientNumber,
          patientName,
          request.doctor?.doctorNumber,
          doctorName,
          request.laboratoryTest?.testCode,
          request.laboratoryTest?.testName,
          request.laboratoryTest?.sampleType,
        ].some((value) => value?.toLowerCase().includes(query));
      const matchesStatus =
        statusFilter === "ALL" || request.status === statusFilter;
      const matchesFromDate = !fromDate || requestedDate >= fromDate;
      const matchesToDate = !toDate || requestedDate <= toDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [requests, search, statusFilter, fromDate, toDate]);

  const stats = useMemo(
    () => [
      {
        label: "Requests in report",
        value: filteredRequests.length,
        icon: FlaskConical,
        style: "bg-emerald-50 text-emerald-700",
      },
      {
        label: "Awaiting sample",
        value: filteredRequests.filter(
          (request) => request.status === "REQUESTED",
        ).length,
        icon: Clock3,
        style: "bg-amber-50 text-amber-700",
      },
      {
        label: "Sample collected",
        value: filteredRequests.filter(
          (request) => request.status === "SAMPLE_COLLECTED",
        ).length,
        icon: TestTube,
        style: "bg-sky-50 text-sky-700",
      },
      {
        label: "Results entered",
        value: filteredRequests.filter(
          (request) => request.status === "RESULT_ENTERED",
        ).length,
        icon: CheckCircle2,
        style: "bg-teal-50 text-teal-700",
      },
    ],
    [filteredRequests],
  );

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "ALL" ||
    fromDate !== "" ||
    toDate !== "";
  const inlineError = actionError || (requests.length > 0 ? error : "");

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setFromDate("");
    setToDate("");
  };

  const exportCsv = () => {
    const rows = [
      [
        "Request number",
        "Test code",
        "Test name",
        "Sample type",
        "Patient number",
        "Patient name",
        "Doctor number",
        "Doctor name",
        "Requested at",
        "Sample collected at",
        "Result entered at",
        "Status",
        "Result",
      ],
      ...filteredRequests.map((request) => [
        request.requestNumber,
        request.laboratoryTest?.testCode,
        request.laboratoryTest?.testName,
        request.laboratoryTest?.sampleType,
        request.patient?.patientNumber,
        getPersonName(request.patient),
        request.doctor?.doctorNumber,
        getPersonName(request.doctor, "Dr. "),
        formatDateTime(request.requestedAt),
        formatDateTime(request.sampleCollectedAt),
        formatDateTime(request.resultEnteredAt),
        getStatusLabel(request.status),
        request.result,
      ]),
    ];
    const content = rows
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF", content], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `laboratory-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async (request: LaboratoryRequest) => {
    setDownloadingId(request.id);
    setActionError("");

    try {
      const response = await api.get(
        `/laboratory-test-requests/${request.id}/report`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");

      link.href = url;
      link.download = `laboratory-report-${request.requestNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error("Failed to download laboratory result PDF:", downloadError);
      setActionError(`Could not download the report for ${request.requestNumber}.`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <DashboardLayout>
      <main
        id="laboratory-report-print-area"
        className="mx-auto max-w-7xl space-y-6"
      >
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Link
              href="/reports"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700 print:hidden"
            >
              <ArrowLeft size={16} />
              Back to Reports
            </Link>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <span className="h-1.5 w-1.5 bg-emerald-600" />
              Reports <span className="text-slate-300">/</span> Diagnostics
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Laboratory Reports
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Follow every test request from sample collection through result
              entry using live laboratory records.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              onClick={() => void fetchRequests()}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={loading || filteredRequests.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 bg-emerald-700 px-3.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={15} />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={loading || filteredRequests.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer size={15} />
              Print
            </button>
          </div>
        </header>

        <section className="relative isolate overflow-hidden bg-[#12392f] p-5 text-white shadow-lg shadow-emerald-950/10 sm:p-6 print:hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -right-20 -top-32 h-72 w-72 bg-teal-300/15 blur-3xl" />
            <div className="absolute -bottom-40 left-1/4 h-64 w-64 bg-emerald-400/15 blur-3xl" />
          </div>
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-white/10 bg-white/[0.08] text-teal-100">
                <Beaker size={22} />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100/65">
                  Live laboratory activity
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
                  A complete view of the testing workflow
                </p>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-emerald-100/75">
                  Request, specimen, and result details come directly from the
                  laboratory request records.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start border border-white/10 bg-white/[0.07] px-3 py-2 text-xs text-emerald-50/90 sm:self-auto">
              <Activity size={15} className="text-teal-200" />
              {loading ? "Syncing records" : `${requests.length} total requests`}
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="flex items-center justify-between gap-4 border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.025]"
              >
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    {loading ? "—" : stat.value.toLocaleString()}
                  </p>
                </div>
                <span
                  className={`flex h-11 w-11 items-center justify-center ${stat.style}`}
                >
                  <Icon size={20} />
                </span>
              </article>
            );
          })}
        </section>

        <section className="border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025] print:hidden">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Search size={17} className="text-emerald-700" />
              Search and filters
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Narrow the report by patient, test, status, or request date.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Search records
              </span>
              <span className="relative block">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Request number, patient, test, doctor..."
                  className="h-11 w-full border border-slate-200 bg-slate-50/70 pl-9 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                )}
              </span>
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Request status
              </span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  From date
                </span>
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="h-11 w-full border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                  To date
                </span>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(event) => setToDate(event.target.value)}
                  className="h-11 w-full border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {loading ? "—" : filteredRequests.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">
                {loading ? "—" : requests.length}
              </span>{" "}
              requests
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-emerald-700 transition hover:text-emerald-900"
              >
                <X size={14} />
                Clear filters
              </button>
            )}
          </div>
        </section>

        {inlineError && !loading && (
          <div
            role="alert"
            className="flex items-start gap-3 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 print:hidden"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div className="flex-1">{inlineError}</div>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => {
                setError("");
                setActionError("");
              }}
              className="text-rose-500 hover:text-rose-800"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025] print:shadow-none">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <FileText size={18} className="text-emerald-700" />
                Laboratory test requests
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Results and specimen activity recorded by the laboratory team.
              </p>
            </div>
            {!loading && !error && (
              <span className="self-start bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {filteredRequests.length} records
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-12">
              <Loader2 size={28} className="animate-spin text-emerald-700" />
              <p className="text-sm text-slate-500">
                Loading laboratory report...
              </p>
            </div>
          ) : error && requests.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <AlertCircle size={30} className="text-rose-600" />
              <h3 className="mt-3 font-semibold text-slate-900">
                Unable to load laboratory report
              </h3>
              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                {error}
              </p>
              <button
                type="button"
                onClick={() => void fetchRequests()}
                className="mt-4 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Try again
              </button>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <FlaskConical size={30} className="text-slate-400" />
              <h3 className="mt-3 font-semibold text-slate-900">
                {requests.length === 0
                  ? "No laboratory requests yet"
                  : "No matching laboratory requests"}
              </h3>
              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                {requests.length === 0
                  ? "Laboratory requests will appear here when they are created in the laboratory workflow."
                  : "Try changing the search, status, or requested date range."}
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full min-w-[1200px] border-collapse text-left print:min-w-0">
                <thead className="bg-slate-50 print:bg-white">
                  <tr className="border-y border-slate-100 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <th scope="col" className="px-5 py-3.5">Request</th>
                    <th scope="col" className="px-5 py-3.5">Laboratory test</th>
                    <th scope="col" className="px-5 py-3.5">Patient</th>
                    <th scope="col" className="px-5 py-3.5">Requested by</th>
                    <th scope="col" className="px-5 py-3.5">Workflow dates</th>
                    <th scope="col" className="px-5 py-3.5">Result</th>
                    <th scope="col" className="px-5 py-3.5">Status</th>
                    <th scope="col" className="px-5 py-3.5 print:hidden">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((request) => {
                    const reportReady =
                      request.status === "RESULT_ENTERED" &&
                      Boolean(request.result) &&
                      Boolean(request.resultEnteredAt);

                    return (
                      <tr
                        key={request.id}
                        className="transition hover:bg-emerald-50/30 print:break-inside-avoid"
                      >
                        <td className="whitespace-nowrap px-5 py-4 align-top">
                          <p className="font-mono text-xs font-semibold text-emerald-800">
                            {request.requestNumber}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDateTime(request.requestedAt)}
                          </p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <p className="text-sm font-semibold text-slate-800">
                            {request.laboratoryTest?.testName || "Test unavailable"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {request.laboratoryTest?.testCode || "—"}
                            <span className="mx-1.5 text-slate-300">·</span>
                            {request.laboratoryTest?.sampleType || "Sample not specified"}
                          </p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <p className="text-sm font-medium text-slate-800">
                            {getPersonName(request.patient)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {request.patient?.patientNumber || `Patient #${request.patientId}`}
                          </p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <p className="text-sm text-slate-700">
                            {getPersonName(request.doctor, "Dr. ")}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {request.doctor?.doctorNumber || `Doctor #${request.doctorId}`}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 align-top">
                          <p className="text-xs text-slate-700">
                            <span className="font-medium text-slate-500">Sample</span>{" "}
                            {formatDateTime(request.sampleCollectedAt)}
                          </p>
                          <p className="mt-1 text-xs text-slate-700">
                            <span className="font-medium text-slate-500">Result</span>{" "}
                            {formatDateTime(request.resultEnteredAt)}
                          </p>
                        </td>
                        <td className="max-w-64 px-5 py-4 align-top">
                          <p
                            className="max-w-64 truncate text-sm text-slate-700"
                            title={request.result || "Result not entered"}
                          >
                            {request.result || (
                              <span className="italic text-slate-400">
                                Awaiting result
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span
                            className={`inline-flex whitespace-nowrap border px-2.5 py-1 text-xs font-medium ${getStatusStyle(request.status)}`}
                          >
                            {getStatusLabel(request.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top print:hidden">
                          <button
                            type="button"
                            aria-label={`Download report for ${request.requestNumber}`}
                            title={reportReady ? "Download PDF report" : "Available after result entry"}
                            onClick={() => void downloadPdf(request)}
                            disabled={!reportReady || downloadingId === request.id}
                            className="inline-flex h-9 items-center justify-center gap-2 border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {downloadingId === request.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Download size={14} />
                            )}
                            PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && filteredRequests.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 text-xs text-slate-500 sm:px-6">
              Showing {filteredRequests.length} of {requests.length} laboratory
              requests. Summary figures reflect the active filters.
            </div>
          )}
        </section>

        <style jsx global>{`
          @media print {
            @page {
              size: landscape;
              margin: 12mm;
            }

            body {
              background: white !important;
              color: black !important;
            }

            body * {
              visibility: hidden;
            }

            #laboratory-report-print-area,
            #laboratory-report-print-area * {
              visibility: visible;
            }

            button,
            input,
            select,
            nav,
            aside,
            .print\\:hidden {
              display: none !important;
            }

            #laboratory-report-print-area {
              position: absolute !important;
              inset: 0 !important;
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            section,
            article {
              break-inside: avoid;
              box-shadow: none !important;
            }

            table {
              width: 100% !important;
              min-width: 0 !important;
              font-size: 8pt !important;
            }

            th,
            td {
              padding: 5px !important;
            }

            tr {
              break-inside: avoid;
            }
          }
        `}</style>
      </main>
    </DashboardLayout>
  );
}
