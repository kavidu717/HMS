"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Beaker,
  CheckCircle2,
  ClipboardList,
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  TestTube,
  X,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import { hasPrivilege } from "@/lib/permissions";

interface LaboratoryTest {
  id: string;
  testCode: string;
  testName: string;
  description: string | null;
  sampleType: string;
  price: number | string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface LaboratoryTestForm {
  testCode: string;
  testName: string;
  description: string;
  sampleType: string;
  price: string;
}

const initialForm: LaboratoryTestForm = {
  testCode: "",
  testName: "",
  description: "",
  sampleType: "",
  price: "0",
};

const loadLaboratoryTests = async (): Promise<LaboratoryTest[]> => {
  const response = await api.get("/laboratory-tests");
  const result = response.data;

  const testList = Array.isArray(result)
    ? result
    : Array.isArray(result.data)
      ? result.data
      : Array.isArray(result.tests)
        ? result.tests
        : [];

  return testList as LaboratoryTest[];
};

export default function LaboratoryTestsPage() {
  const user = useAuthStore((state) => state.user);
  const canCreateLaboratory = hasPrivilege(user, "laboratory:create");
  const canUpdateLaboratory = hasPrivilege(user, "laboratory:update");
  const [tests, setTests] = useState<LaboratoryTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState<LaboratoryTest | null>(null);
  const [form, setForm] = useState<LaboratoryTestForm>(initialForm);

  const fetchTests = useCallback(async () => {
    try {
      setTests(await loadLaboratoryTests());
      setError("");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load laboratory tests.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void loadLaboratoryTests()
      .then((testList) => {
        if (!cancelled) {
          setTests(testList);
          setError("");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load laboratory tests.",
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

  const filteredTests = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return tests;
    }

    return tests.filter(
      (test) =>
        test.testCode.toLowerCase().includes(query) ||
        test.testName.toLowerCase().includes(query) ||
        test.sampleType.toLowerCase().includes(query),
    );
  }, [tests, search]);

  const activeCount = tests.filter((test) => test.isActive).length;

  const inactiveCount = tests.length - activeCount;

  const openCreateForm = () => {
    if (!canCreateLaboratory) return;
    setEditingTest(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (test: LaboratoryTest) => {
    if (!canUpdateLaboratory) return;
    setEditingTest(test);

    setForm({
      testCode: test.testCode,
      testName: test.testName,
      description: test.description ?? "",
      sampleType: test.sampleType,
      price: String(test.price),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (submitting) {
      return;
    }

    setShowForm(false);
    setEditingTest(null);
    setForm(initialForm);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingTest ? !canUpdateLaboratory : !canCreateLaboratory) return;

    setError("");
    setSuccess("");

    const price = Number(form.price);

    if (!form.testCode.trim()) {
      setError("Please enter a test code.");
      return;
    }

    if (!form.testName.trim()) {
      setError("Please enter a test name.");
      return;
    }

    if (!form.sampleType.trim()) {
      setError("Please enter a sample type.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Please enter a valid test price.");
      return;
    }

    const payload = {
      testCode: form.testCode.trim(),
      testName: form.testName.trim(),
      description: form.description.trim() || null,
      sampleType: form.sampleType.trim(),
      price,
    };

    try {
      setSubmitting(true);

      if (editingTest) {
        await api.patch(`/laboratory-tests/${editingTest.id}`, payload);

        setSuccess("Laboratory test updated successfully.");
      } else {
        await api.post("/laboratory-tests", payload);

        setSuccess("Laboratory test created successfully.");
      }

      setShowForm(false);
      setEditingTest(null);
      setForm(initialForm);

      await fetchTests();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to save laboratory test.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (test: LaboratoryTest) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${test.testName}"?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.patch(`/laboratory-tests/${test.id}/deactivate`);

      setSuccess("Laboratory test deactivated successfully.");

      await fetchTests();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to deactivate laboratory test.";

      setError(message);
    }
  };

  const formatPrice = (price: number | string) => {
    const value = Number(price);

    if (!Number.isFinite(value)) {
      return "LKR 0.00";
    }

    return `LKR ${value.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-700">
                <Activity size={16} />
                Hospital Management System
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Laboratory Tests
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Manage laboratory tests, sample types, and test prices.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/laboratory-test-requests"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white px-5 py-3 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
              >
                <ClipboardList size={18} />
                View Test Requests
              </Link>

              {canCreateLaboratory && (
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
              >
                <Plus size={18} />
                Add Laboratory Test
              </button>
              )}
            </div>
          </div>

          {error && !showForm && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />

              <div className="flex-1">{error}</div>

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
              <span>{success}</span>

              <button
                type="button"
                className="ml-auto"
                onClick={() => setSuccess("")}
                aria-label="Dismiss success message"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Tests
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {tests.length}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                  <Beaker size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Active Tests
                  </p>

                  <p className="mt-2 text-3xl font-bold text-green-600">
                    {activeCount}
                  </p>
                </div>

                <div className="rounded-xl bg-green-50 p-3 text-green-600">
                  <CheckCircle2 size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Inactive Tests
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-600">
                    {inactiveCount}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
                  <TestTube size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Laboratory Test Catalogue
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  View and manage available laboratory tests.
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
                    placeholder="Search tests..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 sm:w-64"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    void fetchTests();
                  }}
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
                  Loading laboratory tests...
                </p>
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
                  <Beaker size={32} />
                </div>

                <h3 className="mt-4 font-semibold text-slate-800">
                  {search ? "No matching tests found" : "No laboratory tests"}
                </h3>

                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  {search
                    ? "Try searching with a different test name, code, or sample type."
                    : "Add your first laboratory test to get started."}
                </p>

                {!search && canCreateLaboratory && (
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    <Plus size={16} />
                    Add Test
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Test Code</th>
                      <th className="px-6 py-4 font-semibold">Test Name</th>
                      <th className="px-6 py-4 font-semibold">Sample Type</th>
                      <th className="px-6 py-4 font-semibold">Price</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      {canUpdateLaboratory && (
                        <th className="px-6 py-4 text-right font-semibold">Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredTests.map((test) => (
                      <tr
                        key={test.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-700">
                            {test.testCode}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">
                            {test.testName}
                          </div>

                          {test.description && (
                            <div className="mt-1 max-w-xs truncate text-xs text-slate-500">
                              {test.description}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {test.sampleType}
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {formatPrice(test.price)}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                              test.isActive
                                ? "bg-green-50 text-green-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                test.isActive
                                  ? "bg-green-500"
                                  : "bg-slate-400"
                              }`}
                            />

                            {test.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {canUpdateLaboratory && <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(test)}
                              disabled={!test.isActive}
                              title="Edit test"
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Edit size={16} />
                            </button>

                            {test.isActive && (
                              <button
                                type="button"
                                onClick={() => void handleDeactivate(test)}
                                title="Deactivate test"
                                className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        </td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredTests.length > 0 && (
              <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-800">
                  {filteredTests.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800">
                  {tests.length}
                </span>{" "}
                laboratory tests
              </div>
            )}
          </div>
        </div>

        {showForm && (editingTest ? canUpdateLaboratory : canCreateLaboratory) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingTest
                      ? "Update Laboratory Test"
                      : "Add Laboratory Test"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter the laboratory test information below.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Close form"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
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

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="testCode"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Test Code <span className="text-red-500">*</span>
                      </label>

                      <input
                        id="testCode"
                        type="text"
                        value={form.testCode}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            testCode: event.target.value,
                          })
                        }
                        placeholder="e.g. LAB-001"
                        required
                        disabled={submitting || Boolean(editingTest)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
                      />

                      {editingTest && (
                        <p className="mt-1 text-xs text-slate-500">
                          Test code cannot be changed.
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="testName"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Test Name <span className="text-red-500">*</span>
                      </label>

                      <input
                        id="testName"
                        type="text"
                        value={form.testName}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            testName: event.target.value,
                          })
                        }
                        placeholder="e.g. Full Blood Count"
                        required
                        disabled={submitting}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="sampleType"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Sample Type <span className="text-red-500">*</span>
                      </label>

                      <input
                        id="sampleType"
                        type="text"
                        value={form.sampleType}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            sampleType: event.target.value,
                          })
                        }
                        placeholder="e.g. Blood, Urine"
                        required
                        disabled={submitting}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="price"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Price (LKR) <span className="text-red-500">*</span>
                      </label>

                      <input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            price: event.target.value,
                          })
                        }
                        required
                        disabled={submitting}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Description
                    </label>

                    <textarea
                      id="description"
                      value={form.description}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          description: event.target.value,
                        })
                      }
                      placeholder="Enter an optional description..."
                      rows={3}
                      disabled={submitting}
                      className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={submitting}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting && (
                      <Loader2 className="animate-spin" size={16} />
                    )}

                    {editingTest ? "Save Changes" : "Create Test"}
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
