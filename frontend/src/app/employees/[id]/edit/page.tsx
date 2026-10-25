"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Hash,
  LoaderCircle,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/dashboard-layout";

interface Employee {
  id: string;
  userId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  phone: string;
  email: string;
  username: string;
  userEmail: string;
  role: string;
  department: {
    id: string;
    name: string;
  } | null;
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
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  phone: string;
  email: string;
  departmentId: string;
}

const emptyForm: EmployeeForm = {
  employeeNumber: "",
  firstName: "",
  lastName: "",
  position: "",
  phone: "",
  email: "",
  departmentId: "",
};

export default function EditEmployeePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const employeeId = params.id;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [departmentWarning, setDepartmentWarning] = useState("");

  const loadEmployee = useCallback(async () => {
    if (!employeeId) return;

    setLoading(true);
    setError("");

    try {
      const employeeResponse = await api.get<ApiResponse<Employee>>(
        `/employees/${employeeId}`,
      );

      if (!employeeResponse.data.success || !employeeResponse.data.data) {
        throw new Error(
          employeeResponse.data.message || "Unable to retrieve employee details.",
        );
      }

      const currentEmployee = employeeResponse.data.data;
      setEmployee(currentEmployee);
      setForm({
        employeeNumber: currentEmployee.employeeNumber,
        firstName: currentEmployee.firstName,
        lastName: currentEmployee.lastName,
        position: currentEmployee.position,
        phone: currentEmployee.phone,
        email: currentEmployee.email,
        departmentId: currentEmployee.department?.id ?? "",
      });

      try {
        const departmentResponse = await api.get<ApiResponse<Department[]>>(
          "/departments",
        );

        if (!departmentResponse.data.success) {
          throw new Error("Department list is unavailable.");
        }

        setDepartments(
          Array.isArray(departmentResponse.data.data)
            ? departmentResponse.data.data
            : [],
        );
        setDepartmentWarning("");
      } catch (departmentError) {
        console.warn("Unable to load department options:", departmentError);
        setDepartmentWarning(
          "Department options could not be loaded. The current assignment is retained.",
        );
      }
    } catch (loadError) {
      console.error("Failed to load employee for editing:", loadError);

      setError(
        axios.isAxiosError(loadError)
          ? loadError.response?.data?.message ||
              "Unable to load employee details. Please try again."
          : loadError instanceof Error
            ? loadError.message
            : "Something went wrong while loading this employee.",
      );
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    void loadEmployee();
  }, [loadEmployee]);

  const updateField = (field: keyof EmployeeForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !employee) return;

    const payload = {
      employeeNumber: form.employeeNumber.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      position: form.position.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      departmentId: form.departmentId || null,
    };

    setSubmitting(true);

    try {
      const response = await api.put<ApiResponse<Employee>>(
        `/employees/${employeeId}`,
        payload,
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to save changes.");
      }

      toast.success(response.data.message || "Employee details updated.");
      router.push(`/employees/${employeeId}`);
      router.refresh();
    } catch (saveError) {
      console.error("Failed to update employee:", saveError);

      toast.error(
        axios.isAxiosError(saveError)
          ? saveError.response?.data?.message || "Unable to update employee."
          : saveError instanceof Error
            ? saveError.message
            : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100";
  const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center bg-emerald-50 text-emerald-700">
              <LoaderCircle size={25} className="animate-spin" />
            </span>
            <p className="text-sm font-medium text-slate-600">
              Loading employee details...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !employee) {
    return (
      <DashboardLayout>
        <div className="mx-auto flex min-h-[55vh] max-w-3xl items-center justify-center">
          <div className="w-full border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center bg-rose-50 text-rose-600">
              <UserRound size={25} />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-rose-600">
              Employee record
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Unable to edit employee
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {error || "The requested employee could not be found."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => void loadEmployee()}
                className="inline-flex items-center gap-2 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Refresh employee
              </button>
              <Link
                href={`/employees/${employeeId}`}
                className="inline-flex items-center gap-2 border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back to profile
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const initials = `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`
    .toUpperCase();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-7">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href={`/employees/${employeeId}`}
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
            >
              <ArrowLeft size={16} />
              Back to employee profile
            </Link>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              People management <span className="mx-1 text-slate-300">/</span>{" "}
              Employee directory
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Edit employee
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              Update this employee’s profile and workplace contact details.
            </p>
          </div>

          <div className="flex w-fit items-center gap-3 border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center bg-emerald-700 text-xs font-bold text-white">
              {initials}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {employee.firstName} {employee.lastName}
              </p>
              <p className="text-xs text-slate-500">{employee.employeeNumber}</p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.035]">
            <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-white to-white px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-emerald-700 text-white shadow-sm shadow-emerald-900/15">
                  <BriefcaseBusiness size={21} />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-950">
                    Employee information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Fields marked with <span className="text-rose-600">*</span> are required.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-5 sm:grid-cols-2 sm:p-7">
              <div className="sm:col-span-2">
                <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <Hash size={14} className="text-emerald-700" />
                  Employment details
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
                  className={inputClass}
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
                  onChange={(event) => updateField("position", event.target.value)}
                  className={inputClass}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="sm:col-span-2 mt-2 border-t border-slate-100 pt-5">
                <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <UserRound size={14} className="text-emerald-700" />
                  Personal and contact details
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
                  onChange={(event) => updateField("firstName", event.target.value)}
                  autoComplete="given-name"
                  className={inputClass}
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
                  onChange={(event) => updateField("lastName", event.target.value)}
                  autoComplete="family-name"
                  className={inputClass}
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
                    onChange={(event) => updateField("email", event.target.value)}
                    autoComplete="email"
                    className={`${inputClass} pl-10`}
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
                    onChange={(event) => updateField("phone", event.target.value)}
                    autoComplete="tel"
                    className={`${inputClass} pl-10`}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="departmentId" className={labelClass}>
                  Department <span className="font-normal text-slate-400">(optional)</span>
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
                    disabled={submitting}
                  >
                    <option value="">No department assigned</option>
                    {employee.department &&
                      !departments.some(
                        (department) => department.id === employee.department?.id,
                      ) && (
                        <option value={employee.department.id}>
                          {employee.department.name} (current)
                        </option>
                      )}
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                {departmentWarning ? (
                  <p className="mt-2 text-xs text-amber-700">
                    {departmentWarning}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Choose a department or leave this unassigned.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
              <div className="mb-4 flex items-start gap-2.5 border border-slate-200 bg-white p-3.5">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Linked user account
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {employee.username} · {employee.userEmail} · {employee.role}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    The associated login account cannot be changed here.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                  href={`/employees/${employeeId}`}
                  className="inline-flex items-center justify-center border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/10"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save changes
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
