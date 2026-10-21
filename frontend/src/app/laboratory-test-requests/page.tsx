"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Beaker,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  TestTube,
  X,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import api from "@/lib/axios";

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
}

interface Doctor {
  id: string;
  doctorNumber: string;
  firstName: string;
  lastName: string;
  specialization: string;
}

interface LaboratoryTest {
  id: string;
  testCode: string;
  testName: string;
  sampleType: string;
  price: number | string;
  isActive: boolean;
}

interface LaboratoryTestRequest {
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
  patient: Patient;
  doctor: Doctor;
  laboratoryTest: LaboratoryTest;
}

interface RequestForm {
  patientId: string;
  doctorId: string;
  laboratoryTestId: string;
}

const initialForm: RequestForm = {
  patientId: "",
  doctorId: "",
  laboratoryTestId: "",
};

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
    message?: string;
  };

  return (
    axiosError.response?.data?.message ||
    axiosError.message ||
    fallback
  );
}

function getList<T>(responseData: unknown): T[] {
  if (Array.isArray(responseData)) {
    return responseData as T[];
  }

  if (responseData && typeof responseData === "object") {
    const data = responseData as {
      data?: unknown;
      requests?: unknown;
      patients?: unknown;
      doctors?: unknown;
      tests?: unknown;
    };

    if (Array.isArray(data.data)) {
      return data.data as T[];
    }

    if (Array.isArray(data.requests)) {
      return data.requests as T[];
    }

    if (Array.isArray(data.patients)) {
      return data.patients as T[];
    }

    if (Array.isArray(data.doctors)) {
      return data.doctors as T[];
    }

    if (Array.isArray(data.tests)) {
      return data.tests as T[];
    }
  }

  return [];
}

export default function LaboratoryTestRequestsPage() {
  const [requests, setRequests] = useState<LaboratoryTestRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [tests, setTests] = useState<LaboratoryTest[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<RequestForm>(initialForm);

  const [selectedRequest, setSelectedRequest] =
    useState<LaboratoryTestRequest | null>(null);

  const [showResultForm, setShowResultForm] = useState(false);
  const [resultText, setResultText] = useState("");

  const fetchRequests = useCallback(async () => {
    try {
      const response = await api.get("/laboratory-test-requests");

      setRequests(getList<LaboratoryTestRequest>(response.data));
    } catch (error: unknown) {
      throw new Error(
        getErrorMessage(error, "Failed to load laboratory test requests."),
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void Promise.allSettled([
      api.get("/laboratory-test-requests"),
      api.get("/patients"),
      api.get("/doctors"),
      api.get("/laboratory-tests"),
    ])
      .then(([requestResult, patientResult, doctorResult, testResult]) => {
        if (cancelled) {
          return;
        }

        if (requestResult.status === "fulfilled") {
          setRequests(getList<LaboratoryTestRequest>(requestResult.value.data));
        } else {
          setError(
            getErrorMessage(
              requestResult.reason,
              "Failed to load laboratory test requests.",
            ),
          );
        }

        if (patientResult.status === "fulfilled") {
          setPatients(getList<Patient>(patientResult.value.data));
        }

        if (doctorResult.status === "fulfilled") {
          setDoctors(getList<Doctor>(doctorResult.value.data));
        }

        if (testResult.status === "fulfilled") {
          setTests(
            getList<LaboratoryTest>(testResult.value.data).filter(
              (test) => test.isActive,
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRefreshRequests = async () => {
    setLoading(true);
    setError("");

    try {
      await fetchRequests();
    } catch (error: unknown) {
      setError(
        getErrorMessage(error, "Failed to load laboratory test requests."),
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !query ||
        request.requestNumber?.toLowerCase().includes(query) ||
        request.patient?.patientNumber?.toLowerCase().includes(query) ||
        `${request.patient?.firstName ?? ""} ${request.patient?.lastName ?? ""}`
          .toLowerCase()
          .includes(query) ||
        request.doctor?.doctorNumber?.toLowerCase().includes(query) ||
        request.laboratoryTest?.testName?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const requestedCount = requests.filter(
    (request) => request.status === "REQUESTED",
  ).length;

  const collectedCount = requests.filter(
    (request) => request.status === "SAMPLE_COLLECTED",
  ).length;

  const completedCount = requests.filter(
    (request) => request.status === "RESULT_ENTERED",
  ).length;

  const openCreateForm = () => {
    setForm(initialForm);
    setError("");
    setSuccess("");
    setShowCreateForm(true);
  };

  const handleCreateRequest = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!form.patientId || !form.doctorId || !form.laboratoryTestId) {
      setError("Please select a patient, doctor, and laboratory test.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/laboratory-test-requests", {
        patientId: form.patientId,
        doctorId: form.doctorId,
        laboratoryTestId: form.laboratoryTestId,
      });

      setShowCreateForm(false);
      setForm(initialForm);
      setSuccess("Laboratory test request created successfully.");

      await fetchRequests();
    } catch (error: unknown) {
      setError(
        getErrorMessage(error, "Failed to create laboratory test request."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCollectSample = async (
    request: LaboratoryTestRequest,
  ) => {
    const confirmed = window.confirm(
      `Confirm sample collection for ${request.requestNumber}?`,
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(request.id);
    setError("");
    setSuccess("");

    try {
      await api.patch(
        `/laboratory-test-requests/${request.id}/collect-sample`,
      );

      setSuccess("Sample collection recorded successfully.");

      await fetchRequests();
    } catch (error: unknown) {
      setError(
        getErrorMessage(error, "Failed to record sample collection."),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const openResultForm = (request: LaboratoryTestRequest) => {
    setSelectedRequest(request);
    setResultText(request.result ?? "");
    setError("");
    setSuccess("");
    setShowResultForm(true);
  };

  const handleEnterResult = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedRequest || !resultText.trim()) {
      setError("Please enter the laboratory test result.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await api.patch(
        `/laboratory-test-requests/${selectedRequest.id}/result`,
        {
          result: resultText.trim(),
        },
      );

      setShowResultForm(false);
      setSelectedRequest(null);
      setResultText("");
      setSuccess("Laboratory test result entered successfully.");

      await fetchRequests();
    } catch (error: unknown) {
      setError(
        getErrorMessage(error, "Failed to enter laboratory test result."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReport = async (
    request: LaboratoryTestRequest,
  ) => {
    setProcessingId(request.id);
    setError("");
    setSuccess("");

    try {
      const response = await api.get(
        `/laboratory-test-requests/${request.id}/report`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `laboratory-report-${request.requestNumber}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setSuccess(
        `Report for ${request.requestNumber} downloaded successfully.`,
      );
    } catch (error: unknown) {
      setError(
        getErrorMessage(error, "Failed to download laboratory report."),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-GB");
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "REQUESTED":
        return "bg-amber-50 text-amber-700 ring-amber-200";

      case "SAMPLE_COLLECTED":
        return "bg-blue-50 text-blue-700 ring-blue-200";

      case "RESULT_ENTERED":
        return "bg-green-50 text-green-700 ring-green-200";

      default:
        return "bg-slate-100 text-slate-600 ring-slate-200";
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-700">
                <Beaker size={16} />
                Hospital Management System
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Laboratory Test Requests
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage test requests, sample collection, results, and reports.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              <Plus size={18} />
              Create Test Request
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />

              <span className="flex-1">{error}</span>

              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle2 size={18} />

              <span className="flex-1">{success}</span>

              <button
                type="button"
                onClick={() => setSuccess("")}
                aria-label="Dismiss success message"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Requests
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {requests.length}
                  </p>
                </div>

                <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
                  <ClipboardList size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Awaiting Samples
                  </p>

                  <p className="mt-2 text-3xl font-bold text-amber-600">
                    {requestedCount}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                  <TestTube size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Samples Collected
                  </p>

                  <p className="mt-2 text-3xl font-bold text-blue-600">
                    {collectedCount}
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <Beaker size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Results Entered
                  </p>

                  <p className="mt-2 text-3xl font-bold text-green-600">
                    {completedCount}
                  </p>
                </div>

                <div className="rounded-xl bg-green-50 p-3 text-green-600">
                  <CheckCircle2 size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Test Request Register
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Track laboratory requests and their current status.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search requests..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 sm:w-64"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  aria-label="Filter requests by status"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="REQUESTED">Requested</option>
                  <option value="SAMPLE_COLLECTED">Sample Collected</option>
                  <option value="RESULT_ENTERED">Result Entered</option>
                </select>

                <button
                  type="button"
                  onClick={() => void handleRefreshRequests()}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-teal-600" size={32} />

                <p className="text-sm text-slate-500">
                  Loading test requests...
                </p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
                  <ClipboardList size={32} />
                </div>

                <h3 className="mt-4 font-semibold text-slate-800">
                  No test requests found
                </h3>

                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  {search || statusFilter !== "ALL"
                    ? "Try changing your search or status filter."
                    : "Create a laboratory test request to get started."}
                </p>

                {!search && statusFilter === "ALL" && (
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    <Plus size={16} />
                    Create Request
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Request Number
                      </th>
                      <th className="px-5 py-4 font-semibold">Patient</th>
                      <th className="px-5 py-4 font-semibold">Doctor</th>
                      <th className="px-5 py-4 font-semibold">
                        Laboratory Test
                      </th>
                      <th className="px-5 py-4 font-semibold">Requested At</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map((request) => (
                      <tr
                        key={request.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-semibold text-teal-700">
                            {request.requestNumber}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-800">
                            {request.patient?.firstName}{" "}
                            {request.patient?.lastName}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {request.patient?.patientNumber}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-800">
                            {request.doctor?.firstName}{" "}
                            {request.doctor?.lastName}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {request.doctor?.doctorNumber}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-800">
                            {request.laboratoryTest?.testName}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {request.laboratoryTest?.testCode}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatDate(request.requestedAt)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(request.status)}`}
                          >
                            {request.status.replaceAll("_", " ")}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {request.status === "REQUESTED" && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleCollectSample(request)
                                }
                                disabled={processingId === request.id}
                                title="Record sample collection"
                                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                              >
                                {processingId === request.id ? (
                                  <Loader2
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <TestTube size={14} />
                                )}
                                Collect Sample
                              </button>
                            )}

                            {request.status === "SAMPLE_COLLECTED" && (
                              <button
                                type="button"
                                onClick={() => openResultForm(request)}
                                disabled={processingId === request.id}
                                title="Enter test result"
                                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
                              >
                                <FileText size={14} />
                                Enter Result
                              </button>
                            )}

                            {request.status === "RESULT_ENTERED" && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleDownloadReport(request)
                                }
                                disabled={processingId === request.id}
                                title="Download PDF report"
                                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-50"
                              >
                                {processingId === request.id ? (
                                  <Loader2
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Download size={14} />
                                )}
                                Download Report
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredRequests.length > 0 && (
              <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-800">
                  {filteredRequests.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800">
                  {requests.length}
                </span>{" "}
                requests
              </div>
            )}
          </div>
        </div>

        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Create Test Request
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Select the patient, doctor, and laboratory test.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  disabled={submitting}
                  aria-label="Close form"
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateRequest}>
                <div className="space-y-5 p-6">
                  {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="patientId"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Patient <span className="text-red-500">*</span>
                    </label>

                    <select
                      id="patientId"
                      value={form.patientId}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          patientId: event.target.value,
                        })
                      }
                      required
                      disabled={submitting}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    >
                      <option value="">Select a patient</option>

                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.patientNumber} — {patient.firstName}{" "}
                          {patient.lastName}
                        </option>
                      ))}
                    </select>

                    {patients.length === 0 && (
                      <p className="mt-2 text-xs text-amber-600">
                        No patients loaded. Check the patients API and access
                        permissions.
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="doctorId"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Doctor <span className="text-red-500">*</span>
                    </label>

                    <select
                      id="doctorId"
                      value={form.doctorId}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          doctorId: event.target.value,
                        })
                      }
                      required
                      disabled={submitting}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    >
                      <option value="">Select a doctor</option>

                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.doctorNumber} — {doctor.firstName}{" "}
                          {doctor.lastName}
                        </option>
                      ))}
                    </select>

                    {doctors.length === 0 && (
                      <p className="mt-2 text-xs text-amber-600">
                        No doctors loaded. Check the doctors API and access
                        permissions.
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="laboratoryTestId"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Laboratory Test{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <select
                      id="laboratoryTestId"
                      value={form.laboratoryTestId}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          laboratoryTestId: event.target.value,
                        })
                      }
                      required
                      disabled={submitting}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    >
                      <option value="">Select a laboratory test</option>

                      {tests.map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.testCode} — {test.testName}
                        </option>
                      ))}
                    </select>

                    {tests.length === 0 && (
                      <p className="mt-2 text-xs text-amber-600">
                        No active tests loaded. Create an active laboratory
                        test first.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    disabled={submitting}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      patients.length === 0 ||
                      doctors.length === 0 ||
                      tests.length === 0
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting && (
                      <Loader2 className="animate-spin" size={16} />
                    )}

                    Create Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showResultForm && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Enter Test Result
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedRequest.requestNumber} ·{" "}
                    {selectedRequest.laboratoryTest?.testName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowResultForm(false)}
                  disabled={submitting}
                  aria-label="Close result form"
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEnterResult}>
                <div className="space-y-5 p-6">
                  {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Patient
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {selectedRequest.patient?.firstName}{" "}
                      {selectedRequest.patient?.lastName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {selectedRequest.patient?.patientNumber}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="resultText"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Test Result <span className="text-red-500">*</span>
                    </label>

                    <textarea
                      id="resultText"
                      value={resultText}
                      onChange={(event) => setResultText(event.target.value)}
                      placeholder="Enter the laboratory test result..."
                      rows={6}
                      required
                      disabled={submitting}
                      className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      Enter the result in a clear format suitable for the
                      laboratory report.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowResultForm(false)}
                    disabled={submitting}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || !resultText.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting && (
                      <Loader2 className="animate-spin" size={16} />
                    )}

                    Save Result
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
