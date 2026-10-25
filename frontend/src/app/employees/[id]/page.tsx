"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  Hash,
  LoaderCircle,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
  UserCog,
} from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/store/auth.store";

interface Employee {
  id: string;
  userId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  phone: string;
  email: string;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
  username: string;
  userEmail: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export default function EmployeeDetailsPage() {
  const params = useParams<{ id: string }>();
  const employeeId = params.id;
  const canUpdateEmployee = useAuthStore((state) =>
    state.user?.privileges.includes("employee:update") ?? false,
  );

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEmployee = useCallback(async () => {
    if (!employeeId) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.get<ApiResponse<Employee>>(
        `/employees/${employeeId}`,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(
          response.data.message || "Failed to retrieve employee details.",
        );
      }

      setEmployee(response.data.data);
    } catch (error) {
      console.error("Failed to fetch employee:", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ||
          "Unable to load employee details."
        : "Something went wrong while loading employee details.";

      setError(message);
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    void fetchEmployee();
  }, [fetchEmployee]);

  const formatDate = (date?: string) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-LK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPosition = (position: string) =>
    position
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const DetailItem = ({
    icon,
    label,
    value,
  }: {
    icon: React.ReactNode;
    label: string;
    value?: string | null;
  }) => (
    <div className="flex min-w-0 gap-3 border border-slate-200/80 bg-white p-4 transition hover:border-emerald-200 hover:bg-emerald-50/20">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-900">
          {value || "Not available"}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center bg-emerald-50 text-emerald-700">
              <LoaderCircle className="animate-spin" size={25} />
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
              Unable to load employee
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {error || "The requested employee could not be found."}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => void fetchEmployee()}
                className="inline-flex items-center gap-2 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                <RefreshCw size={16} />
                Try again
              </button>

              <Link
                href="/employees"
                className="inline-flex items-center gap-2 border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                Back to employees
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const initials = `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`
    .toUpperCase();
  const statusIsActive = employee.status.toUpperCase() === "ACTIVE";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
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
              Employee profile
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Employment, contact, and linked account information.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canUpdateEmployee && (
              <Link
                href={`/employees/${employee.id}/edit`}
                className="inline-flex h-10 items-center justify-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                <Pencil size={15} />
                Edit employee
              </Link>
            )}
            <button
              type="button"
              onClick={() => void fetchEmployee()}
              className="inline-flex h-10 items-center justify-center gap-2 border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw size={15} />
              Refresh details
            </button>
          </div>
        </header>

        <section className="relative isolate overflow-hidden border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.035]">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 -z-10 w-1/2 bg-gradient-to-l from-emerald-50/70 to-transparent"
          />
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-emerald-700 text-lg font-bold tracking-wide text-white shadow-sm shadow-emerald-900/20 sm:h-[72px] sm:w-[72px]">
                {initials}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {employee.firstName} {employee.lastName}
                </h2>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {employee.position}
                  <span className="mx-2 text-slate-300">·</span>
                  {employee.department?.name ?? "No department assigned"}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                      statusIsActive
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15"
                        : "bg-slate-100 text-slate-600 ring-slate-500/15"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 ${
                        statusIsActive ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    {employee.status}
                  </span>
                  <span className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                    <Hash size={12} />
                    {employee.employeeNumber}
                  </span>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Staff account role
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {formatPosition(employee.role)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                @{employee.username}
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
          <section className="border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
            <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700">
                <BriefcaseBusiness size={19} />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">
                  Employee details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Personal and workplace contact information.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DetailItem
                icon={<UserRound size={18} />}
                label="First name"
                value={employee.firstName}
              />
              <DetailItem
                icon={<UserRound size={18} />}
                label="Last name"
                value={employee.lastName}
              />
              <DetailItem
                icon={<BriefcaseBusiness size={18} />}
                label="Position"
                value={formatPosition(employee.position)}
              />
              <DetailItem
                icon={<Building2 size={18} />}
                label="Department"
                value={employee.department?.name ?? "Not assigned"}
              />
              <DetailItem
                icon={<Mail size={18} />}
                label="Work email"
                value={employee.email}
              />
              <DetailItem
                icon={<Phone size={18} />}
                label="Phone number"
                value={employee.phone}
              />
            </div>
          </section>

          <aside className="space-y-6">
            <section className="border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="flex h-10 w-10 items-center justify-center bg-emerald-50 text-emerald-700">
                  <ShieldCheck size={19} />
                </span>
                <div>
                  <h2 className="font-semibold text-slate-950">
                    Linked user account
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Account associated with this profile
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                <DetailItem
                  icon={<UserCog size={18} />}
                  label="Username"
                  value={employee.username}
                />
                <DetailItem
                  icon={<Mail size={18} />}
                  label="Account email"
                  value={employee.userEmail}
                />
                <DetailItem
                  icon={<Hash size={18} />}
                  label="User ID"
                  value={employee.userId}
                />
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.025] sm:p-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="flex h-10 w-10 items-center justify-center bg-emerald-50 text-emerald-700">
                  <CalendarDays size={19} />
                </span>
                <div>
                  <h2 className="font-semibold text-slate-950">
                    Record history
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Profile timeline
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                <DetailItem
                  icon={<CalendarDays size={18} />}
                  label="Added to directory"
                  value={formatDate(employee.createdAt)}
                />
                <DetailItem
                  icon={<Clock3 size={18} />}
                  label="Last updated"
                  value={formatDate(employee.updatedAt)}
                />
              </div>
            </section>
          </aside>
        </div>

        <div className="flex justify-start border-t border-slate-200 pt-5">
          <Link
            href="/employees"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
          >
            <ArrowLeft size={16} />
            Return to employee directory
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
