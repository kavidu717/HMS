"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  BriefcaseBusiness,
  CheckCircle2,
  LoaderCircle,
  Mail,
  Phone,
  Save,
  UserRound,
} from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/dashboard-layout";

interface User {
  id: string;
  username: string;
  email: string;
  status: string;
  role: string;
}

interface Department {
  id: string;
  name: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface EmployeeForm {
  userId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  phone: string;
  email: string;
  departmentId: string;
}

const initialForm: EmployeeForm = {
  userId: "",
  employeeNumber: "",
  firstName: "",
  lastName: "",
  position: "",
  phone: "",
  email: "",
  departmentId: "",
};

const eligibleEmployeeRoles = [
  "NURSE",
  "RECEPTIONIST",
  "LABORATORY_STAFF",
  "PHARMACIST",
  "ACCOUNTANT",
];

const roleLabels: Record<string, string> = {
  NURSE: "Nurse",
  RECEPTIONIST: "Receptionist",
  LABORATORY_STAFF: "Laboratory staff",
  PHARMACIST: "Pharmacist",
  ACCOUNTANT: "Accountant",
};

export default function NewEmployeePage() {
  const router = useRouter();

  const [form, setForm] = useState<EmployeeForm>(initialForm);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      setOptionsError("");

      try {
        const [usersResponse, departmentsResponse] = await Promise.all([
          api.get<ApiResponse<User[]>>("/users"),
          api.get<ApiResponse<Department[]>>("/departments"),
        ]);

        const userData = usersResponse.data.data;
        const departmentData = departmentsResponse.data.data;

        setUsers(
          Array.isArray(userData)
            ? userData.filter(
                (user) =>
                  user.status === "ACTIVE" &&
                  eligibleEmployeeRoles.includes(user.role),
              )
            : [],
        );
        setDepartments(
          Array.isArray(departmentData) ? departmentData : [],
        );
      } catch (error) {
        console.error("Failed to load employee registration options:", error);

        setOptionsError(
          axios.isAxiosError(error)
            ? error.response?.data?.message ||
                "Unable to load users or departments."
            : "Something went wrong while loading the form.",
        );
      } finally {
        setLoadingOptions(false);
      }
    };

    void loadOptions();
  }, []);

  const updateField = (
    field: keyof EmployeeForm,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleUserChange = (userId: string) => {
    const selectedUser = users.find((user) => user.id === userId);

    setForm((previous) => ({
      ...previous,
      userId,
      email: selectedUser?.email ?? previous.email,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) return;

    if (
      !form.userId ||
      !form.employeeNumber.trim() ||
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.position ||
      !form.phone.trim() ||
      !form.email.trim()
    ) {
      toast.error("Please complete all required fields.");
      return;
    }

    const payload = {
      userId: form.userId,
      employeeNumber: form.employeeNumber.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      position: form.position,
      phone: form.phone.trim(),
      email: form.email.trim(),
      ...(form.departmentId
        ? { departmentId: form.departmentId }
        : {}),
    };

    setSubmitting(true);

    try {
      const response = await api.post<ApiResponse<unknown>>(
        "/employees",
        payload,
      );

      toast.success(
        response.data.message || "Employee registered successfully.",
      );

      router.push("/employees");
      router.refresh();
    } catch (error) {
      console.error("Failed to register employee:", error);

      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message ||
              "Unable to register employee."
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100";
  const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-7">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/employees"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
            >
              <ArrowLeft size={16} />
              Back to employees
            </Link>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              People management <span className="mx-1 text-slate-300">/</span>{" "}
              Employee directory
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Register an employee
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Create an employee profile and connect it to an active staff
              account.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 size={16} />
            New employee profile
          </div>
        </header>

        {optionsError && (
          <div
            role="alert"
            className="border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-800"
          >
            <p className="font-semibold">Could not load form options</p>
            <p className="mt-1 text-rose-700">{optionsError}</p>
            <p className="mt-1 text-xs text-rose-600">
              Check your access to Users and Departments, then reload this page.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.035]">
            <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-white to-white px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-emerald-700 text-white shadow-sm shadow-emerald-900/15">
                  <UserRound size={21} />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-950">
                    Employee information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Complete the required details below. Fields marked with *
                    are required.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-5 sm:grid-cols-2 sm:p-7">
              <div className="sm:col-span-2">
                <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <BriefcaseBusiness size={14} className="text-emerald-700" />
                  Employment details
                </p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="userId" className={labelClass}>
                  Linked user account <span className="text-rose-600">*</span>
                </label>
                <select
                  id="userId"
                  value={form.userId}
                  onChange={(event) => handleUserChange(event.target.value)}
                  className={inputClass}
                  required
                  disabled={loadingOptions || submitting}
                >
                  <option value="">
                    {loadingOptions
                      ? "Loading eligible accounts..."
                      : "Select an active staff account"}
                  </option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} · {user.email} ·{" "}
                      {roleLabels[user.role] ?? user.role}
                    </option>
                  ))}
                </select>
                {!loadingOptions && users.length === 0 && !optionsError && (
                  <p className="mt-2 text-xs leading-5 text-amber-700">
                    No eligible accounts are available. Create and activate a
                    user with a staff role in User Management first.
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  Only active accounts with an employee role can be linked.
                </p>
              </div>

              <div>
                <label htmlFor="employeeNumber" className={labelClass}>
                  Employee number <span className="text-rose-600">*</span>
                </label>
                <input
                  id="employeeNumber"
                  type="text"
                  value={form.employeeNumber}
                  onChange={(event) =>
                    updateField("employeeNumber", event.target.value)
                  }
                  placeholder="e.g. EMP-001"
                  className={inputClass}
                  autoComplete="off"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="position" className={labelClass}>
                  Position <span className="text-rose-600">*</span>
                </label>
                <input
                  id="position"
                  type="text"
                  value={form.position}
                  onChange={(event) =>
                    updateField("position", event.target.value)
                  }
                  placeholder="e.g. Senior ward nurse"
                  className={inputClass}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="sm:col-span-2 mt-2 border-t border-slate-100 pt-5">
                <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <UserRound size={14} className="text-emerald-700" />
                  Contact details
                </p>
              </div>

              <div>
                <label htmlFor="firstName" className={labelClass}>
                  First name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={(event) =>
                    updateField("firstName", event.target.value)
                  }
                  placeholder="Enter first name"
                  className={inputClass}
                  autoComplete="given-name"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="lastName" className={labelClass}>
                  Last name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={(event) =>
                    updateField("lastName", event.target.value)
                  }
                  placeholder="Enter last name"
                  className={inputClass}
                  autoComplete="family-name"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>
                  Work email <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    placeholder="employee@hospital.com"
                    className={`${inputClass} pl-10`}
                    autoComplete="email"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone number <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Phone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    placeholder="Enter phone number"
                    className={`${inputClass} pl-10`}
                    autoComplete="tel"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="departmentId" className={labelClass}>
                  Department{" "}
                  <span className="font-normal text-slate-400">
                    (optional)
                  </span>
                </label>
                <div className="relative">
                  <Building2 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    id="departmentId"
                    value={form.departmentId}
                    onChange={(event) =>
                      updateField("departmentId", event.target.value)
                    }
                    className={`${inputClass} pl-10`}
                    disabled={loadingOptions || submitting}
                  >
                    <option value="">No department selected</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  You can assign or change the department later.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="text-xs text-slate-500">
                Employee number must be unique in the directory.
              </p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Link
                  href="/employees"
                  className="inline-flex items-center justify-center border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/10"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting || loadingOptions || users.length === 0}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Register employee
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
