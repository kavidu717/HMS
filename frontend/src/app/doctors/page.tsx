"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react";
import axios from "axios";
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
  Stethoscope,
  UserRound,
  X,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/store/auth.store";
import { hasPrivilege } from "@/lib/permissions";
import api from "@/lib/axios";
import DoctorScheduleManager from "./components/DoctorScheduleManager";

interface Department {
  id: string;
  name: string;
  status: string;
}

interface Doctor {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  role: string;
  doctorNumber: string;
  firstName: string;
  lastName: string;
  specialization: string;
  phone: string;
  email: string;
  department: {
    id: string;
    name: string;
  } | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface DoctorFormData {
  userId: string;
  doctorNumber: string;
  firstName: string;
  lastName: string;
  specialization: string;
  phone: string;
  email: string;
  departmentId: string;
  status: string;
}

const initialFormData: DoctorFormData = {
  userId: "",
  doctorNumber: "",
  firstName: "",
  lastName: "",
  specialization: "",
  phone: "",
  email: "",
  departmentId: "",
  status: "ACTIVE",
};

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function DoctorsPage() {
  const user = useAuthStore((state) => state.user);
  const canReadDoctors = hasPrivilege(user, "doctor:read");
  const canCreateDoctor = hasPrivilege(user, "doctor:create");
  const canUpdateDoctor = hasPrivilege(user, "doctor:update");
  const canReadDepartments = hasPrivilege(user, "department:read");
  const canReadUsers = hasPrivilege(user, "user:read");

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [formData, setFormData] =
    useState<DoctorFormData>(initialFormData);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingFormData, setLoadingFormData] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Department assignment state
  const [editingDoctor, setEditingDoctor] =
    useState<Doctor | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] =
    useState("");
  const [savingDepartment, setSavingDepartment] = useState(false);
  const [scheduleDoctor, setScheduleDoctor] = useState<Doctor | null>(null);

  const fetchDoctors = useCallback(async () => {
    if (!canReadDoctors) {
      setDoctors([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<ApiResponse<Doctor[]>>("/doctors");

      const payload = response.data;

      if (!payload.success || !Array.isArray(payload.data)) {
        throw new Error(
          payload.message || "The server returned an invalid doctor list."
        );
      }

      setDoctors(payload.data);
    } catch (err: unknown) {
      console.error("Failed to fetch doctors:", err);

      const message = axios.isAxiosError(err)
        ? err.response?.data?.message ||
          "Unable to load doctors. Please try again."
        : err instanceof Error
          ? err.message
          : "Unable to load doctors. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [canReadDoctors]);

  useEffect(() => {
    void fetchDoctors();
  }, [fetchDoctors]);

  const fetchFormData = async () => {
    setLoadingFormData(true);
    setError("");

    try {
      const requests: Promise<unknown>[] = [];

      if (canReadUsers) {
        requests.push(api.get("/users"));
      }

      if (canReadDepartments) {
        requests.push(api.get("/departments"));
      }

      const results = await Promise.all(requests);

      let resultIndex = 0;

      if (canReadUsers) {
        const usersResponse = results[resultIndex++] as {
          data: ApiResponse<User[]>;
        };

        const fetchedUsers = usersResponse.data.data ?? [];

        const existingDoctorUserIds = new Set(
          doctors.map((doctor) => doctor.userId)
        );

        const availableUsers = fetchedUsers.filter(
          (account) =>
            account.role.toUpperCase() === "DOCTOR" &&
            account.status.toUpperCase() === "ACTIVE" &&
            !existingDoctorUserIds.has(account.id)
        );

        setUsers(availableUsers);
      } else {
        setUsers([]);
      }

      if (canReadDepartments) {
        const departmentsResponse = results[resultIndex] as {
          data: ApiResponse<Department[]>;
        };

        setDepartments(
          (departmentsResponse.data.data ?? []).filter(
            (department) =>
              department.status.toUpperCase() === "ACTIVE"
          )
        );
      } else {
        setDepartments([]);
      }

      setFormData(initialFormData);
    } catch (err: unknown) {
      console.error("Failed to load doctor form data:", err);

      const message = axios.isAxiosError(err)
        ? err.response?.data?.message ||
          "Unable to load users or departments."
        : "Unable to load users or departments.";

      setError(message);
    } finally {
      setLoadingFormData(false);
    }
  };

  const handleOpenForm = async () => {
    setShowForm(true);
    setSuccess("");
    setError("");

    await fetchFormData();
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "userId") {
      const selectedUser = users.find(
        (account) => account.id === value
      );

      if (selectedUser) {
        setFormData((previous) => ({
          ...previous,
          userId: value,
          email: selectedUser.email,
        }));
      }
    }
  };

  const handleCreateDoctor = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!canCreateDoctor) {
      setError("You do not have permission to create doctors.");
      return;
    }

    if (!formData.userId) {
      setError("Please select an existing doctor user account.");
      return;
    }

    if (
      !formData.doctorNumber.trim() ||
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.specialization.trim() ||
      !formData.phone.trim() ||
      !formData.email.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const payload = {
        userId: formData.userId,
        doctorNumber: formData.doctorNumber.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        specialization: formData.specialization.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        ...(formData.departmentId
          ? { departmentId: formData.departmentId }
          : {}),
        status: formData.status,
      };

      const response = await api.post<ApiResponse<Doctor>>(
        "/doctors",
        payload
      );

      const createdDoctor = response.data.data;

      setSuccess(
        response.data.message ||
          `Dr. ${createdDoctor.firstName} ${createdDoctor.lastName} was created successfully.`
      );

      toast.success(
        response.data.message || "Doctor created successfully."
      );

      setFormData(initialFormData);
      setShowForm(false);

      await fetchDoctors();
    } catch (err: unknown) {
      console.error("Failed to create doctor:", err);

      const message = axios.isAxiosError(err)
        ? err.response?.data?.message ||
          "Failed to create doctor. Please try again."
        : "Failed to create doctor. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  // Open the department assignment panel for a doctor.
  const handleOpenDepartmentEditor = async (doctor: Doctor) => {
    if (!canUpdateDoctor) {
      toast.error(
        "You do not have permission to update doctor details."
      );
      return;
    }

    if (!canReadDepartments) {
      toast.error(
        "You do not have permission to view departments."
      );
      return;
    }

    setEditingDoctor(doctor);
    setSelectedDepartmentId(doctor.department?.id ?? "");
    setError("");

    try {
      setLoadingFormData(true);

      const response =
        await api.get<ApiResponse<Department[]>>("/departments");

      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error(
          response.data.message || "Unable to load departments."
        );
      }

      setDepartments(
        response.data.data.filter(
          (department) =>
            department.status.toUpperCase() === "ACTIVE"
        )
      );
    } catch (err: unknown) {
      console.error("Failed to load departments:", err);

      const message = axios.isAxiosError(err)
        ? err.response?.data?.message ||
          "Unable to load departments."
        : err instanceof Error
          ? err.message
          : "Unable to load departments.";

      toast.error(message);
      setEditingDoctor(null);
    } finally {
      setLoadingFormData(false);
    }
  };

  // Assign or change a doctor's department.
  const handleSaveDepartment = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!editingDoctor) return;

    if (!canUpdateDoctor) {
      toast.error(
        "You do not have permission to update doctor details."
      );
      return;
    }

    if (!selectedDepartmentId) {
      toast.error("Please select a department.");
      return;
    }

    try {
      setSavingDepartment(true);
      setError("");

      const response = await api.patch<ApiResponse<Doctor>>(
        `/doctors/${editingDoctor.id}/department`,
        {
          departmentId: selectedDepartmentId,
        }
      );

      if (response.data.success === false) {
        throw new Error(
          response.data.message || "Failed to update department."
        );
      }

      toast.success(
        response.data.message ||
          "Doctor department updated successfully."
      );

      setEditingDoctor(null);
      setSelectedDepartmentId("");

      await fetchDoctors();
    } catch (err: unknown) {
      console.error("Failed to assign doctor department:", err);

      const message = axios.isAxiosError(err)
        ? err.response?.data?.message ||
          "Failed to update department. Please try again."
        : err instanceof Error
          ? err.message
          : "Failed to update department. Please try again.";

      toast.error(message);
    } finally {
      setSavingDepartment(false);
    }
  };

  const filteredDoctors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const matchesQuery =
        !query ||
        `${doctor.firstName} ${doctor.lastName}`
          .toLowerCase()
          .includes(query) ||
        doctor.username.toLowerCase().includes(query) ||
        doctor.email.toLowerCase().includes(query) ||
        doctor.doctorNumber.toLowerCase().includes(query) ||
        doctor.specialization.toLowerCase().includes(query) ||
        (doctor.department?.name ?? "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        doctor.status.toUpperCase() === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [doctors, searchQuery, statusFilter]);

  const activeDoctors = doctors.filter(
    (doctor) => doctor.status.toUpperCase() === "ACTIVE"
  ).length;

  const inactiveDoctors = doctors.filter(
    (doctor) => doctor.status.toUpperCase() === "INACTIVE"
  ).length;

  const statusClass = (status: string) => {
    if (status.toUpperCase() === "ACTIVE") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (status.toUpperCase() === "INACTIVE") {
      return "border-slate-200 bg-slate-100 text-slate-600";
    }

    return "border-amber-200 bg-amber-50 text-amber-700";
  };

  const statusDotClass = (status: string) => {
    if (status.toUpperCase() === "ACTIVE") {
      return "bg-emerald-500";
    }

    if (status.toUpperCase() === "INACTIVE") {
      return "bg-slate-400";
    }

    return "bg-amber-500";
  };

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

  if (!canReadDoctors) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl">
          <div className=" border border-rose-200 bg-white p-7 shadow-sm sm:p-9">
            <span className="flex h-12 w-12 items-center justify-center  bg-rose-50 text-rose-600">
              <ShieldCheck size={22} />
            </span>

            <h1 className="mt-5 text-2xl font-semibold text-slate-950">
              Access unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your account does not have permission to view doctor
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
              Workspace <span className="text-slate-300">/</span> Clinical
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Doctor Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Manage doctor profiles, specializations, and department
              assignments across your hospital.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="hidden items-center gap-2  border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm sm:inline-flex">
              <Stethoscope size={15} className="text-emerald-700" />
              Clinical directory
            </span>

            <button
              type="button"
              onClick={() => void fetchDoctors()}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2  border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            {canCreateDoctor && (
              <button
                type="button"
                onClick={() => void handleOpenForm()}
                aria-expanded={showForm}
                className="inline-flex h-11 items-center justify-center gap-2  bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20"
              >
                {showForm ? <X size={17} /> : <Plus size={17} />}
                {showForm ? "Close form" : "Add doctor"}
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
                "mt-1 h-2 w-2 shrink-0  " +
                (error ? "bg-rose-500" : "bg-emerald-500")
              }
            />
            <p>{error || success}</p>
          </div>
        )}

        {/* Department assignment modal */}
        {editingDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="department-dialog-title"
              className="w-full max-w-lg overflow-hidden  bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center  bg-emerald-50 text-emerald-700">
                    <Building2 size={21} />
                  </span>

                  <div>
                    <h2
                      id="department-dialog-title"
                      className="text-lg font-semibold text-slate-950"
                    >
                      Assign Department
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Dr. {editingDoctor.firstName}{" "}
                      {editingDoctor.lastName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Close department form"
                  onClick={() => {
                    if (!savingDepartment) {
                      setEditingDoctor(null);
                      setSelectedDepartmentId("");
                    }
                  }}
                  disabled={savingDepartment}
                  className=" p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <X size={19} />
                </button>
              </div>

              <form
                onSubmit={handleSaveDepartment}
                className="space-y-5 px-6 py-6"
              >
                <div>
                  <label
                    htmlFor="assignDepartmentId"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Department <span className="text-rose-500">*</span>
                  </label>

                  <select
                    id="assignDepartmentId"
                    value={selectedDepartmentId}
                    onChange={(event) =>
                      setSelectedDepartmentId(event.target.value)
                    }
                    required
                    disabled={loadingFormData || savingDepartment}
                    className="w-full  border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
                  >
                    <option value="">Select a department</option>

                    {departments.map((department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name}
                      </option>
                    ))}
                  </select>

                  {loadingFormData && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 size={13} className="animate-spin" />
                      Loading departments…
                    </p>
                  )}

                  {!loadingFormData && departments.length === 0 && (
                    <p className="mt-2 text-xs text-amber-700">
                      No active departments available.
                    </p>
                  )}
                </div>

                <div className=" border border-emerald-100 bg-emerald-50/70 p-4">
                  <p className="text-sm font-medium text-emerald-950">
                    Current department
                  </p>

                  <p className="mt-1 text-sm text-emerald-800">
                    {editingDoctor.department?.name ||
                      "No department assigned"}
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!savingDepartment) {
                        setEditingDoctor(null);
                        setSelectedDepartmentId("");
                      }
                    }}
                    disabled={savingDepartment}
                    className="inline-flex h-11 items-center justify-center  border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      savingDepartment ||
                      loadingFormData ||
                      departments.length === 0 ||
                      !selectedDepartmentId ||
                      selectedDepartmentId ===
                        editingDoctor.department?.id
                    }
                    className="inline-flex h-11 items-center justify-center gap-2  bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingDepartment ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={17} />
                        Save Department
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {scheduleDoctor && (
          <DoctorScheduleManager
            doctorId={scheduleDoctor.id}
            doctorName={`Dr. ${scheduleDoctor.firstName} ${scheduleDoctor.lastName}`}
            onClose={() => setScheduleDoctor(null)}
          />
        )}

        {/* Add doctor form */}
        {showForm && canCreateDoctor && (
          <section className="overflow-hidden  border border-emerald-100 bg-white shadow-sm">
            <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center  bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <UserRound size={20} />
              </span>

              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  Register a doctor profile
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Select an existing user account with the DOCTOR role,
                  then complete their professional details.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleCreateDoctor}
              className="space-y-6 px-5 py-5 sm:px-7 sm:py-6"
            >
              {loadingFormData ? (
                <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-500">
                  <Loader2 size={19} className="animate-spin" />
                  Loading doctor accounts and departments…
                </div>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="userId"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Doctor user account{" "}
                      <span className="text-rose-500">*</span>
                    </label>

                    <select
                      id="userId"
                      name="userId"
                      required
                      value={formData.userId}
                      onChange={handleChange}
                      disabled={!canReadUsers || users.length === 0}
                      className="w-full  border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
                    >
                      <option value="">
                        {!canReadUsers
                          ? "You do not have permission to read users"
                          : users.length === 0
                            ? "No eligible doctor accounts found"
                            : "Select a doctor account"}
                      </option>

                      {users.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.username} — {account.email}
                        </option>
                      ))}
                    </select>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Only ACTIVE accounts with the DOCTOR role that
                      do not already have a doctor profile are listed.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label
                        htmlFor="doctorNumber"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Doctor number *
                      </label>

                      <input
                        id="doctorNumber"
                        name="doctorNumber"
                        required
                        maxLength={20}
                        value={formData.doctorNumber}
                        onChange={handleChange}
                        placeholder="e.g. DOC-001"
                        className="w-full  border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="firstName"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        First name *
                      </label>

                      <input
                        id="firstName"
                        name="firstName"
                        required
                        maxLength={50}
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="First name"
                        className="w-full  border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="lastName"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Last name *
                      </label>

                      <input
                        id="lastName"
                        name="lastName"
                        required
                        maxLength={50}
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Last name"
                        className="w-full  border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="specialization"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Specialization *
                      </label>

                      <input
                        id="specialization"
                        name="specialization"
                        required
                        maxLength={50}
                        value={formData.specialization}
                        onChange={handleChange}
                        placeholder="e.g. Cardiology"
                        className="w-full  border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Phone number *
                      </label>

                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        maxLength={20}
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+94 77 123 4567"
                        className="w-full  border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Professional email *
                      </label>

                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        maxLength={100}
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="doctor@hospital.com"
                        className="w-full  border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="departmentId"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Department
                      </label>

                      <select
                        id="departmentId"
                        name="departmentId"
                        value={formData.departmentId}
                        onChange={handleChange}
                        disabled={!canReadDepartments}
                        className="w-full  border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
                      >
                        <option value="">No department assigned</option>

                        {departments.map((department) => (
                          <option
                            key={department.id}
                            value={department.id}
                          >
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="status"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Doctor profile status
                      </label>

                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full  border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-start gap-3  border border-emerald-100 bg-emerald-50/70 p-4">
                    <ShieldCheck
                      size={18}
                      className="mt-0.5 shrink-0 text-emerald-700"
                    />

                    <div>
                      <p className="text-sm font-medium text-emerald-950">
                        Existing account and invitation workflow
                      </p>

                      <p className="mt-1 text-xs leading-5 text-emerald-800">
                        This form creates the doctor profile for an existing
                        user. Account invitations and password setup remain
                        part of User Management.
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData(initialFormData);
                    setError("");
                  }}
                  disabled={creating}
                  className="inline-flex h-11 items-center justify-center  border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creating ||
                    loadingFormData ||
                    !canReadUsers ||
                    users.length === 0
                  }
                  className="inline-flex h-11 items-center justify-center gap-2  bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Creating doctor…
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Create doctor profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Summary cards */}
        <section className="grid gap-4 sm:grid-cols-3">
          <article className=" border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total doctors
                </p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {loading ? "—" : doctors.length}
                </p>
              </div>

              <span className="flex h-11 w-11 items-center justify-center  bg-emerald-50 text-emerald-700">
                <Stethoscope size={20} />
              </span>
            </div>

            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              Registered doctor profiles
            </p>
          </article>

          <article className=" border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active doctors
                </p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {loading ? "—" : activeDoctors}
                </p>
              </div>

              <span className="flex h-11 w-11 items-center justify-center  bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={20} />
              </span>
            </div>

            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              Profiles marked active
            </p>
          </article>

          <article className=" border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Inactive doctors
                </p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {loading ? "—" : inactiveDoctors}
                </p>
              </div>

              <span className="flex h-11 w-11 items-center justify-center  bg-slate-100 text-slate-600">
                <CircleDashed size={20} />
              </span>
            </div>

            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              Profiles marked inactive
            </p>
          </article>
        </section>

        {/* Doctor directory */}
        <section className="overflow-hidden  border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Doctor directory
                  </h2>

                  <span className=" bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {filteredDoctors.length}
                  </span>
                </div>

                <p className="mt-1.5 text-sm text-slate-500">
                  Search and review registered doctors.
                </p>
              </div>

              <div className="relative w-full lg:max-w-sm">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  aria-label="Search doctors"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search name, email, department…"
                  className="h-11 w-full  border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Activity size={14} />
                Status
              </span>

              {(
                [
                  ["ALL", "All", doctors.length],
                  ["ACTIVE", "Active", activeDoctors],
                  ["INACTIVE", "Inactive", inactiveDoctors],
                ] as const
              ).map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  aria-pressed={statusFilter === value}
                  className={
                    " px-3.5 py-2 text-xs font-semibold transition " +
                    (statusFilter === value
                      ? "bg-emerald-700 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                  }
                >
                  {label}
                  <span className="ml-1 opacity-75">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 py-14 text-center">
              <Loader2
                size={25}
                className="animate-spin text-emerald-700"
              />

              <p className="mt-4 text-sm font-medium text-slate-700">
                Loading doctors…
              </p>
            </div>
          ) : error && doctors.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 py-14 text-center">
              <p className="text-sm font-medium text-rose-700">
                Unable to load the doctor directory.
              </p>

              <button
                type="button"
                onClick={() => void fetchDoctors()}
                className="mt-4 inline-flex items-center gap-2  bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          ) : doctors.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 py-14 text-center">
              <Stethoscope size={28} className="text-emerald-700" />

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No doctors registered yet
              </h3>

              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                Doctor profiles will appear here after an existing doctor
                user has been registered.
              </p>

              {canCreateDoctor && (
                <button
                  type="button"
                  onClick={() => void handleOpenForm()}
                  className="mt-5 inline-flex h-10 items-center gap-2  bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  <Plus size={16} />
                  Add doctor
                </button>
              )}
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 py-14 text-center">
              <SearchX size={26} className="text-slate-500" />

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No matching doctors
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try another search or change the status filter.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                className="mt-4 text-sm font-semibold text-emerald-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredDoctors.map((doctor) => (
                  <article key={doctor.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center  bg-emerald-50 text-emerald-700">
                        <Stethoscope size={19} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-semibold text-slate-900">
                            Dr. {doctor.firstName} {doctor.lastName}
                          </h3>

                          <span
                            className={
                              "inline-flex items-center gap-1.5  border px-2.5 py-1 text-[11px] font-semibold " +
                              statusClass(doctor.status)
                            }
                          >
                            <span
                              className={
                                "h-1.5 w-1.5  " +
                                statusDotClass(doctor.status)
                              }
                            />
                            {doctor.status}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-emerald-700">
                          {doctor.specialization}
                        </p>

                        <p className="mt-2 break-all text-xs text-slate-500">
                          {doctor.email}
                        </p>

                        <p className="mt-1 break-all text-xs text-slate-500">
                          Account: {doctor.username} · {doctor.userEmail}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Phone: {doctor.phone}
                        </p>

                        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                          <Building2 size={13} />
                          {doctor.department?.name || "No department"}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          Doctor No: {doctor.doctorNumber}
                        </p>

                        {canUpdateDoctor && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setScheduleDoctor(doctor)}
                              className="inline-flex h-9 items-center gap-2  border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                            >
                              <CalendarDays size={14} />
                              Manage Schedules
                            </button>

                            {canReadDepartments && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleOpenDepartmentEditor(doctor)
                                }
                                className="inline-flex h-9 items-center gap-2  border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                              >
                                <Pencil size={14} />
                                {doctor.department
                                  ? "Change department"
                                  : "Assign department"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th scope="col" className="px-7 py-3.5">
                        Doctor
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Specialization
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Department
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Contact
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Status
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Date added
                      </th>
                      {canUpdateDoctor && (
                        <th scope="col" className="px-7 py-3.5">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredDoctors.map((doctor) => (
                      <tr
                        key={doctor.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-7 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center  bg-emerald-50 text-emerald-700">
                              <Stethoscope size={17} />
                            </span>

                            <div>
                              <p className="font-semibold text-slate-900">
                                Dr. {doctor.firstName} {doctor.lastName}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {doctor.doctorNumber}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                @{doctor.username}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {doctor.specialization}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 text-slate-600">
                            <Building2
                              size={15}
                              className="text-slate-400"
                            />
                            {doctor.department?.name || "Unassigned"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-slate-700">
                            {doctor.email}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {doctor.phone}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={
                              "inline-flex items-center gap-1.5  border px-2.5 py-1 text-xs font-semibold " +
                              statusClass(doctor.status)
                            }
                          >
                            <span
                              className={
                                "h-1.5 w-1.5  " +
                                statusDotClass(doctor.status)
                              }
                            />
                            {doctor.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-slate-500">
                          {formatDate(doctor.createdAt)}
                        </td>

                        {canUpdateDoctor && (
                          <td className="px-7 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setScheduleDoctor(doctor)}
                                className="inline-flex items-center gap-2 whitespace-nowrap  border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                              >
                                <CalendarDays size={15} />
                                Manage Schedules
                              </button>

                              {canReadDepartments && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleOpenDepartmentEditor(doctor)
                                  }
                                  className="inline-flex items-center gap-2 whitespace-nowrap  border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                >
                                  <Pencil size={14} />
                                  {doctor.department
                                    ? "Change department"
                                    : "Assign department"}
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-3.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <p>
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredDoctors.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {doctors.length}
                  </span>{" "}
                  doctors
                </p>

                <p>
                  {departments.length} active departments available
                </p>
              </div>
            </>
          )}
        </section>

        <p className="flex items-center justify-center gap-1.5 pb-2 text-xs text-slate-400">
          <ShieldCheck size={13} />
          Doctor management access is controlled by your account privileges.
        </p>
      </div>
    </DashboardLayout>
  );
}
