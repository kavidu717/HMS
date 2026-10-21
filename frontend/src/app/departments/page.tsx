"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Activity,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  SearchX,
  ShieldCheck,
  X,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";

interface Department {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DepartmentsResponse {
  success: boolean;
  message?: string;
  data: Department[];
}

interface DepartmentResponse {
  success: boolean;
  message: string;
  data: Department;
}

interface DepartmentFormData {
  name: string;
  description: string;
  status: string;
}

const initialFormData: DepartmentFormData = {
  name: "",
  description: "",
  status: "ACTIVE",
};

export default function DepartmentsPage() {
  const user = useAuthStore((state) => state.user);
  const privileges = user?.privileges ?? [];

  const canReadDepartments = privileges.includes("department:read");
  const canCreateDepartment = privileges.includes("department:create");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] =
    useState<DepartmentFormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchDepartments = useCallback(async () => {
    if (!canReadDepartments) {
      setDepartments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await api.get<DepartmentsResponse>("/departments");
      setDepartments(response.data.data ?? []);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      setError("Unable to load departments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [canReadDepartments]);

  useEffect(() => {
    void fetchDepartments();
  }, [fetchDepartments]);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleCreateDepartment = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!canCreateDepartment) {
      setError("You do not have permission to create departments.");
      return;
    }

    const name = formData.name.trim();
    if (!name) {
      setError("Department name is required.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const response = await api.post<DepartmentResponse>("/departments", {
        name,
        description: formData.description.trim(),
        status: formData.status,
      });

      setSuccess(response.data.message || "Department created successfully.");
      setFormData(initialFormData);
      setShowForm(false);
      await fetchDepartments();
    } catch (err: unknown) {
      console.error("Failed to create department:", err);
      const apiError = err as {
        response?: {
          status?: number;
          data?: { message?: string };
        };
      };

      if (apiError.response?.status === 409) {
        setError("A department with this name already exists.");
      } else {
        setError(
          apiError.response?.data?.message ||
            "Failed to create department. Please try again."
        );
      }
    } finally {
      setCreating(false);
    }
  };

  const filteredDepartments = departments.filter((department) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      department.name.toLowerCase().includes(query) ||
      (department.description ?? "").toLowerCase().includes(query) ||
      department.status.toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === "ALL" || department.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const formatDate = (date?: string) => {
    if (!date) return "—";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const activeDepartments = departments.filter(
    (department) => department.status === "ACTIVE"
  ).length;
  const inactiveDepartments = departments.filter(
    (department) => department.status === "INACTIVE"
  ).length;

  const statusClass = (status: string) => {
    if (status === "ACTIVE") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (status === "INACTIVE") {
      return "border-slate-200 bg-slate-100 text-slate-600";
    }

    return "border-amber-200 bg-amber-50 text-amber-700";
  };

  const statusDotClass = (status: string) => {
    if (status === "ACTIVE") return "bg-emerald-500";
    if (status === "INACTIVE") return "bg-slate-400";
    return "bg-amber-500";
  };

  const statusLabel = (status: string) => {
    if (status === "ACTIVE") return "Active";
    if (status === "INACTIVE") return "Inactive";
    return status;
  };

  if (!canReadDepartments) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl">
          <div className=" border border-rose-200 bg-white p-7 shadow-sm shadow-slate-900/[0.03] sm:p-9">
            <span className="flex h-12 w-12 items-center justify-center  bg-rose-50 text-rose-600">
              <ShieldCheck size={22} />
            </span>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
              Access unavailable
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Your account does not have permission to view department
              management. Contact an administrator if you need access.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <span className="h-1.5 w-1.5  bg-emerald-600" />
              Workspace <span className="text-slate-300">/</span> Organization
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Departments
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              A clear view of the teams and services that make up your hospital.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="mr-1 hidden items-center gap-2  border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm sm:inline-flex">
              <Building2 size={15} className="text-emerald-700" />
              Hospital directory
            </span>
            <button
              type="button"
              onClick={() => void fetchDepartments()}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2  border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            {canCreateDepartment && (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setShowForm((previous) => !previous);
                }}
                aria-expanded={showForm}
                className="inline-flex h-11 items-center justify-center gap-2  bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20"
              >
                {showForm ? <X size={17} /> : <Plus size={17} />}
                {showForm ? "Close form" : "Add department"}
              </button>
            )}
          </div>
        </header>

        {(error || success) && (
          <div
            role={error ? "alert" : "status"}
            className={
              "flex items-start gap-3  border px-4 py-3.5 text-sm " +
              (error
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800")
            }
          >
            <span
              className={
                "mt-0.5 h-2 w-2 shrink-0  " +
                (error ? "bg-rose-500" : "bg-emerald-500")
              }
            />
            <p>{error || success}</p>
          </div>
        )}

        {showForm && canCreateDepartment && (
          <section
            id="create-department-form"
            className="overflow-hidden  border border-emerald-100 bg-white shadow-sm shadow-slate-900/[0.03]"
          >
            <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center  bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <Plus size={20} />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  Add a department
                </h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Add a name and a few details to keep your directory up to date.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleCreateDepartment}
              className="space-y-6 px-5 py-5 sm:px-7 sm:py-6"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Department name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    maxLength={100}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Cardiology"
                    className="w-full  border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Use up to 100 characters.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full  border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Description <span className="font-normal text-slate-400">Optional</span>
                    </label>
                    <span className="text-xs tabular-nums text-slate-400">
                      {formData.description.length}/500
                    </span>
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    maxLength={500}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="What services does this department provide?"
                    className="w-full resize-y  border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData(initialFormData);
                    setError("");
                  }}
                  disabled={creating}
                  className="inline-flex h-11 items-center justify-center  border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/10 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex h-11 items-center justify-center gap-2  bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Create department
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        <section aria-label="Department overview" className="grid gap-4 sm:grid-cols-3">
          <article className=" border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total departments</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 tabular-nums">
                  {loading ? "—" : departments.length}
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center  bg-emerald-50 text-emerald-700">
                <Building2 size={20} />
              </span>
            </div>
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              Listed in your hospital directory
            </p>
          </article>

          <article className=" border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 tabular-nums">
                  {loading ? "—" : activeDepartments}
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center  bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={20} />
              </span>
            </div>
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              Marked active in the directory
            </p>
          </article>

          <article className=" border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Inactive</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 tabular-nums">
                  {loading ? "—" : inactiveDepartments}
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center  bg-slate-100 text-slate-600">
                <CircleDashed size={20} />
              </span>
            </div>
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              Marked inactive in the directory
            </p>
          </article>
        </section>

        <section className="overflow-hidden  border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03]">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Department directory
                  </h2>
                  <span className=" bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 tabular-nums">
                    {filteredDepartments.length}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-500">
                  Browse and find the services across your hospital.
                </p>
              </div>

              <div className="relative w-full lg:max-w-sm">
                <Search
                  size={17}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  aria-label="Search departments"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search departments"
                  className="h-11 w-full appearance-none  border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear department search"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center  text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Activity size={14} />
                Status
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                aria-pressed={statusFilter === "ALL"}
                className={
                  " px-3.5 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/10 " +
                  (statusFilter === "ALL"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                }
              >
                All <span className="ml-1 opacity-75">{departments.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ACTIVE")}
                aria-pressed={statusFilter === "ACTIVE"}
                className={
                  " px-3.5 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/10 " +
                  (statusFilter === "ACTIVE"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                }
              >
                Active <span className="ml-1 opacity-75">{activeDepartments}</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("INACTIVE")}
                aria-pressed={statusFilter === "INACTIVE"}
                className={
                  " px-3.5 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/10 " +
                  (statusFilter === "INACTIVE"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                }
              >
                Inactive <span className="ml-1 opacity-75">{inactiveDepartments}</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center  bg-emerald-50 text-emerald-700">
                <Loader2 size={23} className="animate-spin" />
              </span>
              <p className="mt-4 text-sm font-medium text-slate-700">
                Loading departments
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Your directory will be ready in a moment.
              </p>
            </div>
          ) : departments.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center  bg-emerald-50 text-emerald-700">
                <Building2 size={25} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No departments yet
              </h3>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                {canCreateDepartment
                  ? "Create your first department to start building the hospital directory."
                  : "There are currently no departments to display."}
              </p>
              {canCreateDepartment && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="mt-5 inline-flex h-10 items-center gap-2  bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20"
                >
                  <Plus size={16} />
                  Add department
                </button>
              )}
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center  bg-slate-100 text-slate-500">
                <SearchX size={21} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No matching departments
              </h3>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                Try another search or change the selected status.
              </p>
              {(searchQuery || statusFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                  }}
                  className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800 focus-visible:outline-none focus-visible:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredDepartments.map((department) => (
                  <article key={department.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center  bg-emerald-50 text-emerald-700">
                        <Building2 size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {department.name}
                          </h3>
                          <span
                            className={
                              "inline-flex items-center gap-1.5  border px-2.5 py-1 text-[11px] font-semibold " +
                              statusClass(department.status)
                            }
                          >
                            <span className={"h-1.5 w-1.5  " + statusDotClass(department.status)} />
                            {statusLabel(department.status)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm leading-5 text-slate-500">
                          {department.description || "No description provided"}
                        </p>
                        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400">
                          <CalendarDays size={13} />
                          Added {formatDate(department.createdAt)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th scope="col" className="px-7 py-3.5">Department</th>
                      <th scope="col" className="px-5 py-3.5">Description</th>
                      <th scope="col" className="px-5 py-3.5">Status</th>
                      <th scope="col" className="px-7 py-3.5">Date added</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDepartments.map((department) => (
                      <tr
                        key={department.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-7 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center  bg-emerald-50 text-emerald-700">
                              <Building2 size={17} />
                            </span>
                            <span className="font-semibold text-slate-900">
                              {department.name}
                            </span>
                          </div>
                        </td>
                        <td className="max-w-sm px-5 py-4 text-slate-500">
                          <p className="line-clamp-2 leading-5">
                            {department.description || "No description provided"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={
                              "inline-flex items-center gap-1.5  border px-2.5 py-1 text-xs font-semibold " +
                              statusClass(department.status)
                            }
                          >
                            <span className={"h-1.5 w-1.5  " + statusDotClass(department.status)} />
                            {statusLabel(department.status)}
                          </span>
                        </td>
                        <td className="px-7 py-4 text-slate-500">
                          <span className="inline-flex items-center gap-2 whitespace-nowrap">
                            <CalendarDays size={15} className="text-slate-400" />
                            {formatDate(department.createdAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 px-5 py-3.5 sm:px-7">
                <p className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-700">{filteredDepartments.length}</span>
                  {" "}of <span className="font-semibold text-slate-700">{departments.length}</span> departments
                </p>
              </div>
            </>
          )}
        </section>

        <p className="flex items-center justify-center gap-1.5 pb-2 text-xs text-slate-400">
          <ShieldCheck size={13} />
          Department access is managed through your account permissions.
        </p>
      </div>
    </DashboardLayout>
  );
}
